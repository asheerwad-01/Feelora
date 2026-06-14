import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import gsap from "gsap";
import { Track } from "../types";

interface SphericalGalleryProps {
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
  selectedTrack: Track | null;
  bloomStrength?: number;
  bloomThreshold?: number;
}

export default function SphericalGallery({
  tracks,
  onSelectTrack,
  selectedTrack,
  bloomStrength = 1.5,
  bloomThreshold = 0.12
}: SphericalGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep track of interaction states via refs to bypass stale React state closures in the animate loop
  const stateRef = useRef({
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    rotationY: 0,
    rotationX: 0,
    targetRotationY: 0,
    targetRotationX: 0,
    autoSpinSpeed: 0.001,
    isHoveredId: "",
    isZoomed: false
  });

  // Track hover status for UI cursor styling
  const [hoveredTrack, setHoveredTrack] = useState<Track | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || tracks.length === 0) return;

    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;

    // 1. Scene, Camera & Renderer setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040406, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 0.1); // Camera inside looking outward

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // Post-processing Bloom Effect Pipeline
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // UnrealBloomPass: (resolution, strength, radius, threshold)
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      bloomStrength,   // Higher intensity strength for dreamy volumetric glow
      0.55,            // Spread radius of the glowing atmosphere
      bloomThreshold   // Brightness threshold limit for highlights
    );
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.18);
    scene.add(ambientLight);

    const centerLight = new THREE.PointLight(0xffffff, 5.5, 20);
    centerLight.position.set(0, 0, 0);
    scene.add(centerLight);

    // Glowing sphere background core
    const bgGroup = new THREE.Group();
    scene.add(bgGroup);

    // 3. Card coordinates positioning
    // We position cards in a tight, immersive 3D grid around the central observer
    const cardsGroup = new THREE.Group();
    scene.add(cardsGroup);

    const radius = 7.0; // Perfect radius surrounding the viewer
    const rows = 8; // Dense vertical coverage (8 vertical columns)
    const cardsPerRow = 18; // 18 horizontal segments covering full 360 degree circle (144 cards totals!)
    const targetCount = rows * cardsPerRow;

    const cardMeshes: THREE.Mesh[] = [];
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "anonymous";

    // Generate fallback visual canvas dynamic texture when CORS blocks cover art or image fails to fetch
    const createFallbackTexture = (title: string, artist: string, bgColor: string) => {
      const cv = document.createElement("canvas");
      cv.width = 512;
      cv.height = 384;
      const ctx = cv.getContext("2d");
      if (ctx) {
        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 512, 384);
        grad.addColorStop(0, bgColor);
        grad.addColorStop(1, "#030205");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 384);

        // Grid/Soundwave lines
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 512; i += 32) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 384);
          ctx.stroke();
        }
        for (let j = 0; j < 384; j += 32) {
          ctx.beginPath();
          ctx.moveTo(0, j);
          ctx.lineTo(512, j);
          ctx.stroke();
        }

        // Circular focal glow
        ctx.beginPath();
        ctx.arc(256, 192, 100, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.02)";
        ctx.fill();

        // High contrast song lyrics title text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px 'Inter', sans-serif";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(title, 256, 140);

        // Music artist text
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "500 20px 'JetBrains Mono', monospace";
        ctx.fillText(artist.toUpperCase(), 256, 200);

        // Decorative vinyl record mockup
        ctx.beginPath();
        ctx.arc(256, 280, 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(16, 185, 129, 0.5)"; // Green glow dot
        ctx.fill();
      }
      const dataUrl = cv.toDataURL();
      const txt = textureLoader.load(dataUrl);
      return txt;
    };

    // Replicate tracks dynamically if search/curated length is small to guarantee dense packing
    const denseTracks: Track[] = [];
    if (tracks.length > 0) {
      while (denseTracks.length < targetCount) {
        tracks.forEach((track) => {
          if (denseTracks.length < targetCount) {
            denseTracks.push({
              ...track,
              id: `${track.id}_v_${denseTracks.length}`
            });
          }
        });
      }
    }

    denseTracks.forEach((track, index) => {
      const row = Math.floor(index / cardsPerRow);
      const col = index % cardsPerRow;

      // Wrap full 360 degrees horizontally: from 0 to 2*PI
      const phi = (col / cardsPerRow) * Math.PI * 2;

      // Distribute polar angle vertically covering main field of view (avoid poles to limit distortion)
      const vMin = Math.PI * 0.12;
      const vMax = Math.PI * 0.88;
      const theta = vMin + (row / (rows - 1)) * (vMax - vMin);

      // Convert spherical coordinates to 3D Cartesian coords
      const x = radius * Math.sin(theta) * Math.sin(phi);
      const y = radius * Math.cos(theta);
      const z = -radius * Math.sin(theta) * Math.cos(phi);

      // Calculate perfect seamless width so horizontal spacing has practically zero gap (0.015 unit margin)
      const latitudeRadiusCircumference = 2 * Math.PI * radius * Math.sin(theta);
      const exactCellWidth = latitudeRadiusCircumference / cardsPerRow;
      const itemWidth = Math.max(0.65, exactCellWidth - 0.015);

      // Calculate perfect seamless height so vertical rows have practically zero gap (0.015 unit margin)
      const sphereSpanningHeight = radius * (vMax - vMin);
      const exactCellHeight = sphereSpanningHeight / (rows - 1);
      const itemHeight = exactCellHeight - 0.015;

      const geometry = new THREE.PlaneGeometry(itemWidth, itemHeight, 8, 8);
      
      // Load standard texture with CORS anonymity configuration
      let cardTexture: THREE.Texture;
      try {
        cardTexture = textureLoader.load(
          track.artwork,
          () => {}, // onload
          () => {
            // failed, use beautiful canvas procedural fallback texture instead
            const fallback = createFallbackTexture(track.title, track.artist, track.color);
            material.map = fallback;
            material.needsUpdate = true;
          }
        );
        cardTexture.colorSpace = THREE.SRGBColorSpace;
      } catch (err) {
        cardTexture = createFallbackTexture(track.title, track.artist, track.color);
      }

      const material = new THREE.MeshBasicMaterial({
        map: cardTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.94, // Heightened opacity for vibrant glowing display
        toneMapped: true
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);

      // Make card plane face the central camera (origin)
      mesh.lookAt(0, 0, 0);
      mesh.rotateY(Math.PI); // Adjust so front faces interior camera

      // Keep reference of custom track meta on the object
      mesh.userData = { track, index, defaultScale: 1 };
      cardsGroup.add(mesh);
      cardMeshes.push(mesh);
    });

    // 4. Raycaster & Interactivity State
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Mouse movement listeners inside container
    const onMouseDown = (e: MouseEvent) => {
      stateRef.current.isDragging = true;
      stateRef.current.prevMouseX = e.clientX;
      stateRef.current.prevMouseY = e.clientY;
      stateRef.current.autoSpinSpeed = 0; // stop autospin during manual drag
    };

    const onMouseMove = (e: MouseEvent) => {
      const { isDragging } = stateRef.current;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Handle dragging offset (rotation changes)
      if (isDragging) {
        const deltaX = e.clientX - stateRef.current.prevMouseX;
        const deltaY = e.clientY - stateRef.current.prevMouseY;

        stateRef.current.targetRotationY += deltaX * 0.0035;
        // Limit vertical axis dragging to prevent flipping over
        stateRef.current.targetRotationX = Math.max(
          -0.7,
          Math.min(0.7, stateRef.current.targetRotationX + deltaY * 0.0035)
        );

        stateRef.current.prevMouseX = e.clientX;
        stateRef.current.prevMouseY = e.clientY;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      stateRef.current.isDragging = false;
      
      // Delay resuming spin
      gsap.delayedCall(3.5, () => {
        if (!stateRef.current.isDragging && !selectedTrack) {
          stateRef.current.autoSpinSpeed = 0.0007;
        }
      });
    };

    // Card Selection via clicking/tapping on Raycasted details
    const onCanvasClick = (e: MouseEvent) => {
      if (selectedTrack) return; // Ignore clicking grid if a track is zoomed into focus mode

      const rect = renderer.domElement.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Move raycaster
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(cardsGroup.children);

      if (intersects.length > 0) {
        // Successful click on project/song card mesh
        const clickedMesh = intersects[0].object as THREE.Mesh;
        const trackSelected = clickedMesh.userData.track as Track;

        // Perform exquisite zooming alignment
        zoomIntoCard(clickedMesh, trackSelected);
      }
    };

    const zoomIntoCard = (mesh: THREE.Mesh, track: Track) => {
      stateRef.current.isZoomed = true;
      stateRef.current.autoSpinSpeed = 0;

      // Calculate camera orientation to face mesh directly using its rotated world position
      const meshPos = new THREE.Vector3();
      mesh.getWorldPosition(meshPos);
      
      // Position camera very close to card for premium cinematic zoom depth (approx 75% of distance)
      const targetCamPos = meshPos.clone().normalize().multiplyScalar(radius * 0.72);

      // Animate camera and scene to highlight selection
      gsap.to(camera.position, {
        x: targetCamPos.x,
        y: targetCamPos.y,
        z: targetCamPos.z,
        duration: 1.4,
        ease: "power3.inOut"
      });

      // Maintain looking at card during flight
      gsap.to(camera, {
        duration: 1.4,
        ease: "power3.inOut",
        onUpdate: () => {
          camera.lookAt(meshPos);
        }
      });

      // Gently dim other meshes to spotlight the playing track
      cardMeshes.forEach((otherMesh) => {
        const mat = otherMesh.material as THREE.MeshBasicMaterial;
        if (otherMesh !== mesh) {
          gsap.to(mat, { opacity: 0.1, duration: 1.0 });
        } else {
          gsap.to(mat, { opacity: 1.0, duration: 0.8 });
        }
      });

      // Dispatch selected track up to React state after alignment completes
      gsap.delayedCall(1.2, () => {
        onSelectTrack(track);
      });
    };

    // Core Animation Frame Loop
    let animationFrameId: number;
    
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Apply majestic auto spin when not dragging or zoomed in
      if (!stateRef.current.isDragging && !stateRef.current.isZoomed) {
        stateRef.current.targetRotationY += stateRef.current.autoSpinSpeed;
      }

      // Smooth inertia damping rotation values (Lenis/smooth-scroll style mechanics)
      stateRef.current.rotationY += (stateRef.current.targetRotationY - stateRef.current.rotationY) * 0.08;
      stateRef.current.rotationX += (stateRef.current.targetRotationX - stateRef.current.rotationX) * 0.08;

      // Rotate group representing spherical gallery
      cardsGroup.rotation.y = stateRef.current.rotationY;
      cardsGroup.rotation.x = stateRef.current.rotationX;

      // Handle hover raycasting & micro scaling animations
      if (!stateRef.current.isDragging && !stateRef.current.isZoomed) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(cardsGroup.children);

        if (intersects.length > 0) {
          const hoveredMesh = intersects[0].object as THREE.Mesh;
          const metadata = hoveredMesh.userData.track as Track;

          if (stateRef.current.isHoveredId !== metadata.id) {
            stateRef.current.isHoveredId = metadata.id;
            setHoveredTrack(metadata);

            // Pop scale of hovered card mesh elegantly using GSAP
            gsap.to(hoveredMesh.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 0.4, ease: "power2.out" });
            
            // Revert scales of non-hovered card meshes
            cardMeshes.forEach((mesh) => {
              if (mesh !== hoveredMesh) {
                gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: "power2.out" });
              }
            });
          }
        } else {
          if (stateRef.current.isHoveredId !== "") {
            stateRef.current.isHoveredId = "";
            setHoveredTrack(null);
            
            // Revert all to normal scale
            cardMeshes.forEach((mesh) => {
              gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: "power2.out" });
            });
          }
        }
      }

      composer.render();
    };

    // Attach listeners
    const el = containerRef.current;
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("click", onCanvasClick);

    animate();

    // 5. Responsive Resize handler
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      composer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.current);

    // Zoom back out when track selection is cleared in parent
    const performReset = () => {
      if (!selectedTrack && stateRef.current.isZoomed) {
        stateRef.current.isZoomed = false;
        stateRef.current.autoSpinSpeed = 0.001;

        gsap.to(camera.position, {
          x: 0,
          y: 0,
          z: 0.1,
          duration: 1.2,
          ease: "power3.out"
        });

        // Face forward smoothly again
        const targetLook = new THREE.Vector3(0, 0, -10);
        gsap.to(camera, {
          duration: 1.2,
          ease: "power3.out",
          onUpdate: () => {
            camera.lookAt(targetLook);
          }
        });

        cardMeshes.forEach((mesh) => {
          const mat = mesh.material as THREE.MeshBasicMaterial;
          gsap.to(mat, { opacity: 0.88, duration: 0.8 });
          gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: 0.5 });
        });
      }
    };

    // Sync Reset effect from selectedTrack changes
    performReset();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("click", onCanvasClick);
      
      // Dispose materials & meshes
      cardMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      });
      composer.dispose();
      renderer.dispose();
    };
  }, [tracks, selectedTrack, bloomStrength, bloomThreshold]);

  return (
    <div
      ref={containerRef}
      id="three-spherical-root"
      className="relative w-full h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] cursor-grab active:cursor-grabbing outline-none select-none bg-[#030205] overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* Dynamic Hover Card HUD tooltip */}
      {hoveredTrack && !selectedTrack && (
        <div className="absolute pointer-events-none left-1/2 bottom-8 -translate-x-1/2 bg-black/85 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-4 shadow-2xl animate-fade-in">
          <img
            src={hoveredTrack.artwork}
            alt={hoveredTrack.title}
            className="w-10 h-10 rounded-md object-cover border border-white/5"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="font-sans font-semibold text-white text-sm tracking-tight">
              {hoveredTrack.title}
            </div>
            <div className="font-mono text-[10px] text-gray-400 font-medium uppercase tracking-wider">
              {hoveredTrack.artist}
            </div>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-2" />
        </div>
      )}

      {/* Hint HUD */}
      {!selectedTrack && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none text-center select-none bg-black/25 backdrop-blur-sm px-4 py-2 rounded-full border border-white/5">
          <span className="font-sans text-xs text-gray-400 tracking-wide">
            🖱️ Left Click & Drag around sphere • Tap any Card to Play
          </span>
        </div>
      )}
    </div>
  );
}
