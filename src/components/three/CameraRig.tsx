'use client';

// ─────────────────────────────────────────────────────────────
// Feelora 2 — GSAP Camera Rig
// Camera placed INSIDE the sphere, looking outward at the
// surrounding song cards (like a planetarium)
// ─────────────────────────────────────────────────────────────

import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

import { useAppStore } from '@/store/useAppStore';
import { useAudioStore } from '@/store/useAudioStore';

// Camera config — inside-out viewing (planetarium style)
const IDLE_ROTATION_SPEED = 0.0;
const MOUSE_SENSITIVITY = 0.003;
const INERTIA_DECAY = 0.92;

export function CameraRig() {
  const { camera, gl } = useThree();
  const { cameraTarget, focusedSong, setCameraTarget } = useAppStore();

  // State refs (no re-renders)
  // Camera stays near origin (inside the sphere), rotation only
  const rotationY = useRef(0);
  const rotationX = useRef(0);
  const targetRotationY = useRef(0);
  const targetRotationX = useRef(0);
  const velocityTheta = useRef(0);
  const velocityPhi = useRef(0);
  const isPointerDown = useRef(false);
  const prevPointer = useRef({ x: 0, y: 0 });
  const isAnimating = useRef(false);
  const targetLookAt = useRef(new THREE.Vector3(0, 0, -10));

  const getBaseFov = useCallback(() => {
    if (typeof window === 'undefined') return 60;
    if (window.innerWidth < 768) return 95; // Mobile: much wider FOV
    if (window.innerWidth < 1024) return 75; // Tablet
    return 60; // Desktop
  }, []);

  // Camera zoom (FOV adjustment)
  const targetFov = useRef(getBaseFov());

  // Handle window resize for responsive FOV
  useEffect(() => {
    const handleResize = () => {
      if (!isAnimating.current && !focusedSong) {
        targetFov.current = getBaseFov();
      }
    };
    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [focusedSong, getBaseFov]);

  // Initialize camera at origin looking outward
  useEffect(() => {
    camera.position.set(0, 0, 0.1);
    camera.lookAt(0, 0, -10);
  }, [camera]);

  // Fly-to animation (for clicking on a card)
  useEffect(() => {
    if (!cameraTarget || !focusedSong) return;

    isAnimating.current = true;
    targetFov.current = getBaseFov(); // Reset zoom to default

    const target = new THREE.Vector3(...cameraTarget);
    // Position camera most of the way toward the card (72% of radius)
    const direction = target.clone().normalize();
    const cameraPos = direction.multiplyScalar(target.length() * 0.72);

    const tl = gsap.timeline({
      onComplete: () => {
        // Synchronize rotation angles to prevent camera snap/glitch on transition completion
        rotationY.current = focusedSong.phi;
        targetRotationY.current = focusedSong.phi;
        rotationX.current = Math.PI / 2 - focusedSong.theta;
        targetRotationX.current = Math.PI / 2 - focusedSong.theta;
        
        isAnimating.current = false;
      },
    });

    tl.to(camera.position, {
      x: cameraPos.x,
      y: cameraPos.y,
      z: cameraPos.z,
      duration: 1.4,
      ease: 'power3.inOut',
    });

    tl.to(
      targetLookAt.current,
      {
        x: target.x,
        y: target.y,
        z: target.z,
        duration: 1.4,
        ease: 'power3.inOut',
      },
      '<'
    );

    return () => {
      tl.kill();
    };
  }, [cameraTarget, focusedSong, camera]);

  // Zoom back when focused song is cleared
  useEffect(() => {
    if (!focusedSong && isAnimating.current === false) {
      targetFov.current = getBaseFov(); // Reset zoom to default on unfocus
      // Animate back to center
      gsap.to(camera.position, {
        x: 0,
        y: 0,
        z: 0.1,
        duration: 1.2,
        ease: 'power3.out',
      });
      gsap.to(targetLookAt.current, {
        x: 0,
        y: 0,
        z: -10,
        duration: 1.2,
        ease: 'power3.out',
      });
    }
  }, [focusedSong, camera]);

  // Pointer handlers
  const onPointerDown = useCallback((e: PointerEvent) => {
    isPointerDown.current = true;
    prevPointer.current = { x: e.clientX, y: e.clientY };
    velocityTheta.current = 0;
    velocityPhi.current = 0;
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!isPointerDown.current || isAnimating.current) return;

    const dx = e.clientX - prevPointer.current.x;
    const dy = e.clientY - prevPointer.current.y;

    velocityTheta.current = dx * MOUSE_SENSITIVITY;
    velocityPhi.current = dy * MOUSE_SENSITIVITY;

    prevPointer.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerUp = useCallback(() => {
    isPointerDown.current = false;
  }, []);

  const onWheel = useCallback((e: WheelEvent) => {
    // Scroll zoom: deltaY > 0 scroll down (zoom out), deltaY < 0 scroll up (zoom in)
    targetFov.current += e.deltaY * 0.05;
    targetFov.current = THREE.MathUtils.clamp(targetFov.current, 8, 120);
  }, []);

  // Register event listeners
  useEffect(() => {
    const domElement = gl.domElement;
    domElement.addEventListener('pointerdown', onPointerDown);
    domElement.addEventListener('pointermove', onPointerMove);
    domElement.addEventListener('pointerup', onPointerUp);
    domElement.addEventListener('pointerleave', onPointerUp);
    domElement.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      domElement.removeEventListener('pointerdown', onPointerDown);
      domElement.removeEventListener('pointermove', onPointerMove);
      domElement.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('pointerleave', onPointerUp);
      domElement.removeEventListener('wheel', onWheel);
    };
  }, [gl, onPointerDown, onPointerMove, onPointerUp, onWheel]);

  // Per-frame camera update
  useFrame((state, delta) => {
    // Smooth fov zoom LERP
    if (camera instanceof THREE.PerspectiveCamera) {
      if (Math.abs(camera.fov - targetFov.current) > 0.01) {
        camera.fov += (targetFov.current - camera.fov) * 0.1;
        camera.updateProjectionMatrix();
      }
    }

    if (isAnimating.current) {
      // During fly-to, just look at target
      camera.lookAt(targetLookAt.current);
      return;
    }

    // Apply velocity with inertia
    targetRotationY.current += velocityTheta.current;
    targetRotationX.current += velocityPhi.current;

    // Clamp vertical rotation to avoid flipping, but allow looking up/down at the poles
    targetRotationX.current = THREE.MathUtils.clamp(
      targetRotationX.current,
      -1.4,
      1.4
    );

    // Decay velocity (inertia)
    velocityTheta.current *= INERTIA_DECAY;
    velocityPhi.current *= INERTIA_DECAY;

    // Idle rotation when no input
    if (
      !isPointerDown.current &&
      Math.abs(velocityTheta.current) < 0.0001
    ) {
      targetRotationY.current += IDLE_ROTATION_SPEED * delta;
    }

    // Smooth rotation lerp
    rotationY.current += (targetRotationY.current - rotationY.current) * 0.08;
    rotationX.current += (targetRotationX.current - rotationX.current) * 0.08;

    // Compute look direction from rotation (no audio-reactive shake/breathing)
    const lookDir = new THREE.Vector3(
      Math.sin(rotationY.current) * Math.cos(rotationX.current),
      Math.sin(rotationX.current),
      -Math.cos(rotationY.current) * Math.cos(rotationX.current)
    );

    // Camera stays at its current position (origin or zoomed in), looks in lookDir
    const lookTarget = new THREE.Vector3().copy(camera.position).add(lookDir);
    camera.lookAt(lookTarget);
  });

  return null; // No rendered geometry — pure controller
}
