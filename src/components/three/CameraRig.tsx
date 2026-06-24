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
  const { camera, gl, scene } = useThree();
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

  // Handle Reset View Trigger
  const resetViewTrigger = useAppStore(s => s.resetViewTrigger);

  useEffect(() => {
    if (resetViewTrigger > 0) {
      isAnimating.current = true;
      const tl = gsap.timeline({
        onComplete: () => {
          targetRotationY.current = 0;
          targetRotationX.current = 0;
          isAnimating.current = false;
          useAppStore.getState().setFocusedSong(null);
        }
      });

      // Calculate shortest path back to 0
      let currentY = rotationY.current;
      currentY = Math.atan2(Math.sin(currentY), Math.cos(currentY)); // normalize between -PI to PI
      rotationY.current = currentY;
      
      tl.to(rotationY, { current: 0, duration: 1.2, ease: 'power3.inOut' });
      tl.to(rotationX, { current: 0, duration: 1.2, ease: 'power3.inOut' }, '<');
      tl.to(targetFov, { 
        current: getBaseFov(), 
        duration: 1.2, 
        ease: 'power3.inOut',
        onUpdate: () => useAppStore.getState().setCameraZoom(targetFov.current)
      }, '<');
      
      return () => { tl.kill(); };
    }
  }, [resetViewTrigger, getBaseFov]);

  // Initialize camera at origin looking outward
  useEffect(() => {
    camera.position.set(0, 0, 0.1);
    camera.lookAt(0, 0, -10);
  }, [camera]);

  // Fly-to animation (for clicking on a card)
  useEffect(() => {
    if (!focusedSong) return;

    let targetPhi = focusedSong.phi;
    let targetTheta = focusedSong.theta;
    let cardWidth = 0.88; // Fallback default size
    let foundMesh = false;

    // Dynamically traverse the scene to locate the exact card mesh matching the focused track
    scene.traverse((obj) => {
      if (foundMesh) return;
      if (
        obj.userData?.track &&
        (obj.userData.track.id === focusedSong.id ||
          obj.userData.track.id.startsWith(focusedSong.id + '_v_'))
      ) {
        if (typeof obj.userData.track.phi === 'number' && typeof obj.userData.track.theta === 'number') {
          targetPhi = obj.userData.track.phi;
          targetTheta = obj.userData.track.theta;
          if (typeof obj.userData.itemWidth === 'number') {
            cardWidth = obj.userData.itemWidth;
          }
          foundMesh = true;
        }
      }
    });

    const currentY = rotationY.current;

    // Normalize target angle differences to avoid spinning the long way (shortest path)
    let diffY = targetPhi - currentY;
    diffY = Math.atan2(Math.sin(diffY), Math.cos(diffY));
    const finalTargetY = currentY + diffY;
    const finalTargetX = Math.PI / 2 - targetTheta;

    isAnimating.current = true;
    // Flat telephoto lens zoom to prevent perspective distortion.
    // Dynamically scale the target FOV based on card size so focused cards occupy the same visual screen area.
    const zoomTargetFov = 20 * (cardWidth / 0.88);

    const tl = gsap.timeline({
      onComplete: () => {
        // Synchronize rotation angles to prevent camera snap/glitch on transition completion
        targetRotationY.current = finalTargetY;
        targetRotationX.current = finalTargetX;
        isAnimating.current = false;
      },
    });

    tl.to(rotationY, {
      current: finalTargetY,
      duration: 1.2,
      ease: 'power3.inOut',
    });

    tl.to(
      rotationX,
      {
        current: finalTargetX,
        duration: 1.2,
        ease: 'power3.inOut',
      },
      '<'
    );

    tl.to(
      targetFov,
      {
        current: zoomTargetFov,
        duration: 1.2,
        ease: 'power3.inOut',
        onUpdate: () => {
          useAppStore.getState().setCameraZoom(targetFov.current);
        },
      },
      '<'
    );

    return () => {
      tl.kill();
    };
  }, [focusedSong, scene]);

  // Zoom back when focused song is cleared
  useEffect(() => {
    if (!focusedSong) {
      const defaultFov = getBaseFov();
      // Only animate back if we're not already at default zoom (to prevent running on mount)
      if (Math.abs(targetFov.current - defaultFov) < 1.0) {
        return;
      }

      isAnimating.current = true;

      const tl = gsap.timeline({
        onComplete: () => {
          isAnimating.current = false;
        },
      });

      tl.to(targetFov, {
        current: defaultFov,
        duration: 1.0,
        ease: 'power3.out',
        onUpdate: () => {
          useAppStore.getState().setCameraZoom(targetFov.current);
        },
      });

      return () => {
        tl.kill();
      };
    }
  }, [focusedSong, getBaseFov]);

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

    velocityTheta.current = -dx * MOUSE_SENSITIVITY;
    velocityPhi.current = dy * MOUSE_SENSITIVITY;

    prevPointer.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerUp = useCallback(() => {
    isPointerDown.current = false;
  }, []);

  const onWheel = useCallback((e: WheelEvent) => {
    // Scroll zoom: deltaY > 0 scroll down (zoom out), deltaY < 0 scroll up (zoom in)
    const newFov = THREE.MathUtils.clamp(targetFov.current + e.deltaY * 0.05, 5, 130);
    targetFov.current = newFov;
    useAppStore.getState().setCameraZoom(newFov);
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
    const { navigationControls, cameraZoom } = useAppStore.getState();

    // Sync zoom from store (e.g. slider)
    if (Math.abs(targetFov.current - cameraZoom) > 0.05) {
      targetFov.current = THREE.MathUtils.clamp(cameraZoom, 5, 130);
    }

    // Smooth fov zoom LERP
    if (camera instanceof THREE.PerspectiveCamera) {
      if (Math.abs(camera.fov - targetFov.current) > 0.01) {
        camera.fov += (targetFov.current - camera.fov) * 0.1;
        camera.updateProjectionMatrix();
      }
    }

    // Smooth rotation updates (only when not animating via GSAP)
    if (!isAnimating.current) {
      // Button-based continuous rotation
      const buttonRotateSpeed = 1.6; // Radians per second
      if (navigationControls.left) {
        targetRotationY.current -= buttonRotateSpeed * delta;
      }
      if (navigationControls.right) {
        targetRotationY.current += buttonRotateSpeed * delta;
      }
      if (navigationControls.up) {
        targetRotationX.current += buttonRotateSpeed * delta;
      }
      if (navigationControls.down) {
        targetRotationX.current -= buttonRotateSpeed * delta;
      }

      // Apply velocity with inertia
      targetRotationY.current += velocityTheta.current;
      targetRotationX.current += velocityPhi.current;

      // Clamp vertical rotation to avoid flipping, but allow looking up/down at the poles
      targetRotationX.current = THREE.MathUtils.clamp(
        targetRotationX.current,
        -1.56,
        1.56
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
    }

    // Compute look direction from rotation
    const lookDir = new THREE.Vector3(
      Math.sin(rotationY.current) * Math.cos(rotationX.current),
      Math.sin(rotationX.current),
      -Math.cos(rotationY.current) * Math.cos(rotationX.current)
    );

    // Camera stays at center origin (0, 0, 0.1) looking in lookDir
    const lookTarget = new THREE.Vector3().copy(camera.position).add(lookDir);
    camera.lookAt(lookTarget);
  });

  return null; // No rendered geometry — pure controller
}
