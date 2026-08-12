"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Maximize, Minimize, RefreshCw, ZoomIn, ZoomOut, Move } from "lucide-react";
import * as THREE from "three";

export function PanoramaViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // State refs for Three.js render loop without trigger re-renders
  const isDraggingRef = useRef(false);
  const onPointerDownPointerXRef = useRef(0);
  const onPointerDownPointerYRef = useRef(0);
  const lonRef = useRef(0);
  const latRef = useRef(0);
  const onPointerDownLonRef = useRef(0);
  const onPointerDownLatRef = useRef(0);
  const fovRef = useRef(75);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const autoRotateRef = useRef(true);

  autoRotateRef.current = isAutoRotate;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationFrameId: number;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      1,
      1100,
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);

    // 2. 360 Sphere Geometry & Texture
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1); // Invert geometry so texture faces inward

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "/gallery/360IMAGE.jpeg",
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error("Failed to load 360 panorama image", err);
        setError(true);
        setLoading(false);
      },
    );

    // 3. Resize Handler
    const handleResize = () => {
      if (!container || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // 4. Pointer Drag Logic
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      isDraggingRef.current = true;
      onPointerDownPointerXRef.current = event.clientX;
      onPointerDownPointerYRef.current = event.clientY;
      onPointerDownLonRef.current = lonRef.current;
      onPointerDownLatRef.current = latRef.current;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) return;
      lonRef.current = (onPointerDownPointerXRef.current - event.clientX) * 0.15 + onPointerDownLonRef.current;
      latRef.current = (event.clientY - onPointerDownPointerYRef.current) * 0.15 + onPointerDownLatRef.current;
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      fovRef.current = Math.max(30, Math.min(100, fovRef.current + event.deltaY * 0.05));
      if (cameraRef.current) {
        cameraRef.current.fov = fovRef.current;
        cameraRef.current.updateProjectionMatrix();
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // 5. Render Loop with Smooth Inverted Rotation
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotateRef.current && !isDraggingRef.current) {
        lonRef.current += 0.08;
      }

      latRef.current = Math.max(-85, Math.min(85, latRef.current));

      const phi = THREE.MathUtils.degToRad(90 - latRef.current);
      const theta = THREE.MathUtils.degToRad(lonRef.current);

      const targetX = 500 * Math.sin(phi) * Math.cos(theta);
      const targetY = 500 * Math.cos(phi);
      const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(targetX, targetY, targetZ);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      geometry.dispose();
      renderer.dispose();
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  const handleZoom = useCallback((delta: number) => {
    fovRef.current = Math.max(30, Math.min(100, fovRef.current + delta));
    if (cameraRef.current) {
      cameraRef.current.fov = fovRef.current;
      cameraRef.current.updateProjectionMatrix();
    }
  }, []);

  return (
    <section className="relative mx-auto max-w-[1600px] px-5 py-16 sm:px-8 lg:px-12">
      <div className="mb-8 flex flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-[0.62rem] font-medium tracking-[0.3em] text-gold uppercase sm:text-[0.68rem]"
        >
          Virtual Immersion
        </motion.p>
        <motion.h3
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-3 font-display text-[clamp(1.75rem,4vw,3.25rem)] text-ivory"
        >
          Interactive 360° Interior Experience
        </motion.h3>
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-4 h-0.5 w-24 bg-gradient-to-r from-transparent via-gold to-transparent"
        />
      </div>

      {/* 360 Canvas Container */}
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="group relative aspect-[16/9] min-h-[420px] w-full overflow-hidden rounded-xl bg-charcoal shadow-[0_30px_90px_rgba(0,0,0,0.65)] ring-1 ring-gold/30"
      >
        <canvas
          ref={canvasRef}
          className="size-full cursor-grab active:cursor-grabbing"
          aria-label="Interactive 360 panorama view"
        />

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-deep/90 backdrop-blur-sm">
            <RefreshCw className="size-8 animate-spin text-gold" />
            <p className="mt-4 text-xs tracking-[0.2em] text-ivory/80 uppercase">
              Loading 360 Panorama...
            </p>
          </div>
        )}

        {/* Error Fallback */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-deep/90 px-6 text-center">
            <p className="text-sm tracking-[0.14em] text-ivory/60 uppercase">
              Unable to load 360 panorama image
            </p>
          </div>
        )}

        {/* Dynamic Controls Overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
          {/* Top Bar: Badge & Guidance */}
          <div className="flex items-center justify-between gap-3">
            <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-gold/40 bg-navy-deep/80 px-4 py-2 text-[0.65rem] tracking-[0.18em] text-gold uppercase backdrop-blur-md">
              <Move className="size-3.5" />
              <span>Click & Drag to Look Around</span>
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAutoRotate((prev) => !prev)}
                className={`flex size-10 items-center justify-center rounded-full border border-ivory/25 bg-navy-deep/80 text-ivory transition-colors duration-300 hover:border-gold hover:text-gold ${
                  isAutoRotate ? "border-gold/80 text-gold" : ""
                }`}
                title={isAutoRotate ? "Pause Auto-Rotation" : "Start Auto-Rotation"}
                aria-label="Toggle auto rotation"
              >
                <RefreshCw className={`size-4 ${isAutoRotate ? "animate-spin" : ""}`} />
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="flex size-10 items-center justify-center rounded-full border border-ivory/25 bg-navy-deep/80 text-ivory transition-colors duration-300 hover:border-gold hover:text-gold"
                title="Toggle Fullscreen"
                aria-label="Toggle fullscreen view"
              >
                {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
              </button>
            </div>
          </div>

          {/* Bottom Bar: Zoom Controls */}
          <div className="flex justify-end gap-2">
            <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-ivory/20 bg-navy-deep/80 p-1.5 backdrop-blur-md">
              <button
                type="button"
                onClick={() => handleZoom(8)}
                className="flex size-9 items-center justify-center rounded-full text-ivory/80 transition-colors hover:bg-gold hover:text-navy-deep"
                aria-label="Zoom Out"
                title="Zoom Out"
              >
                <ZoomOut className="size-4" />
              </button>
              <span className="h-4 w-px bg-ivory/20" />
              <button
                type="button"
                onClick={() => handleZoom(-8)}
                className="flex size-9 items-center justify-center rounded-full text-ivory/80 transition-colors hover:bg-gold hover:text-navy-deep"
                aria-label="Zoom In"
                title="Zoom In"
              >
                <ZoomIn className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
