"use client";
import * as THREE from "three";
import { useRef, MutableRefObject, useLayoutEffect } from "react";
import { RoundedBox } from "@react-three/drei";
import type { Perfume } from "./Perfumes";

export type BottleHandle = {
  setFocus: (focus: number) => void;
};

type PerfumeBottleProps = {
  perfume: Perfume;
  bottleRef: MutableRefObject<BottleHandle | null>;
};

/**
 * Procedural perfume bottle (no model file needed).
 * `focus` (0..1) is set by the carousel every frame: 1 = centre/active, 0 = far away (dark).
 * To use your own GLB later, replace the contents of this component with <primitive object={gltf.scene} />
 * and keep the `focus` -> material brightness logic in the carousel.
 */
export default function PerfumeBottle({ perfume, bottleRef }: PerfumeBottleProps) {
  const glass = useRef<THREE.MeshPhysicalMaterial>(null);
  const liquid = useRef<THREE.MeshStandardMaterial>(null);
  const cap = useRef<THREE.MeshStandardMaterial>(null);

  // exposed to the carousel so it can animate brightness without React re-renders
  useLayoutEffect(() => {
    if (bottleRef) {
      bottleRef.current = {
        setFocus(f: number) {
          const k = 0.12 + 0.88 * f;
          if (glass.current) {
            glass.current.color.set(perfume.glass).multiplyScalar(0.35 + 0.65 * f);
            glass.current.envMapIntensity = 0.15 + 1.6 * f;
          }
          if (liquid.current) {
            liquid.current.color.set(perfume.liquid).multiplyScalar(k);
            liquid.current.emissive.set(perfume.liquid).multiplyScalar(0.35 * f);
          }
          if (cap.current) {
            cap.current.color.set(perfume.cap).multiplyScalar(k);
            cap.current.envMapIntensity = 0.2 + 2.2 * f;
          }
        },
      };
    }
  });

  return (
    <group>
      {/* glass body */}
      <RoundedBox args={[1.35, 1.9, 0.62]} radius={0.12} smoothness={6} position={[0, 0, 0]}>
        <meshPhysicalMaterial
          ref={glass}
          color={perfume.glass}
          metalness={0.1}
          roughness={0.06}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transparent
          opacity={0.92}
        />
      </RoundedBox>

      {/* perfume liquid */}
      <RoundedBox args={[1.15, 1.55, 0.42]} radius={0.08} smoothness={4} position={[0, -0.08, 0]}>
        <meshStandardMaterial ref={liquid} color={perfume.liquid} roughness={0.25} metalness={0.1} />
      </RoundedBox>

      {/* heavy glass base */}
      <RoundedBox args={[1.42, 0.14, 0.7]} radius={0.05} smoothness={4} position={[0, -0.98, 0]}>
        <meshPhysicalMaterial color="#cfd6e0" metalness={0.3} roughness={0.05} transparent opacity={0.5} clearcoat={1} />
      </RoundedBox>

      {/* neck */}
      <mesh position={[0, 1.08, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.28, 32]} />
        <meshStandardMaterial color="#b9bec9" metalness={1} roughness={0.2} />
      </mesh>

      {/* cap */}
      <mesh position={[0, 1.58, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.72, 48]} />
        <meshStandardMaterial ref={cap} color={perfume.cap} metalness={1} roughness={0.18} />
      </mesh>
      <mesh position={[0, 1.96, 0]}>
        <cylinderGeometry args={[0.31, 0.31, 0.04, 48]} />
        <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.1} />
      </mesh>

      {/* simple front label */}
      <mesh position={[0, 0.05, 0.315]}>
        <planeGeometry args={[0.8, 0.9]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}
