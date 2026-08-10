"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import * as THREE from "three";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Ambient Three.js backdrop for the hero.
 *
 * Deliberately abstract: a slow drift of translucent planes that reads as dust and
 * light in a room rather than a literal object. It sits behind the headline at low
 * opacity and must never compete with the type.
 *
 * All Three.js state is confined to this file. The Canvas is unmounted whenever the
 * hero leaves the tree, and geometries and materials created here are owned by R3F,
 * which disposes them on unmount.
 */

const COUNT = 26;

type Shard = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  speed: number;
  phase: number;
  opacity: number;
};

/** Deterministic pseudo random so server and client agree and layout never jumps. */
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function useShards(): Shard[] {
  return useMemo(() => {
    const random = seeded(20260810);

    return Array.from({ length: COUNT }, () => ({
      position: [(random() - 0.5) * 12, (random() - 0.5) * 8, (random() - 0.5) * 6 - 2],
      rotation: [random() * Math.PI, random() * Math.PI, random() * Math.PI],
      scale: 0.25 + random() * 0.9,
      speed: 0.05 + random() * 0.12,
      phase: random() * Math.PI * 2,
      opacity: 0.05 + random() * 0.12,
    })) as Shard[];
  }, []);
}

function Shards({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const shards = useShards();

  // A single shared geometry and material family keeps draw calls and memory low.
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1.4), []);

  useFrame((state, delta) => {
    if (!animate || !group.current) return;

    // Cap delta so a backgrounded tab does not resume with one enormous jump.
    const step = Math.min(delta, 0.05);
    const elapsed = state.clock.elapsedTime;

    group.current.children.forEach((child, index) => {
      const shard = shards[index];
      if (!shard) return;

      child.rotation.y += step * shard.speed;
      child.rotation.x += step * shard.speed * 0.35;
      child.position.y = shard.position[1] + Math.sin(elapsed * shard.speed + shard.phase) * 0.4;
    });

    // Parallax toward the pointer. state.pointer is already normalized to -1..1.
    const targetX = state.pointer.x * 0.35;
    const targetY = state.pointer.y * 0.2;
    group.current.rotation.y += (targetX - group.current.rotation.y) * 0.03;
    group.current.rotation.x += (-targetY - group.current.rotation.x) * 0.03;
  });

  return (
    <group ref={group}>
      {shards.map((shard, index) => (
        <mesh
          key={index}
          geometry={geometry}
          position={shard.position}
          rotation={shard.rotation}
          scale={shard.scale}
        >
          <meshBasicMaterial
            color={index % 3 === 0 ? "#ebc71d" : "#f3f3f9"}
            transparent
            opacity={shard.opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.NormalBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

export function HeroCanvas({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        // `frameloop: never` still renders one frame on demand via invalidate, but
        // for reduced motion we want a single static paint and no ticking loop.
        frameloop={reducedMotion ? "demand" : "always"}
        camera={{ position: [0, 0, 7], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ pointerEvents: "none" }}
      >
        <Shards animate={!reducedMotion} />
        <AdaptiveDpr pixelated />
        <Preload all />
      </Canvas>
    </div>
  );
}
