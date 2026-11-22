"use client";
import * as THREE from "three";
import { useRef, useLayoutEffect, type MutableRefObject } from "react";
import { RoundedBox } from "@react-three/drei";
import type { Perfume } from "./Perfumes";

export type BottleHandle = { setFocus: (focus: number) => void };

type Props = {
  perfume: Perfume;
  handleRef: MutableRefObject<BottleHandle | null>;
};

/**
 * Procedural perfume bottle. focus: 1 = centre/active, 0 = far away (dark).
 * To use your own GLB later, replace the meshes with <primitive object={gltf.scene} />.
 */
export default function PerfumeBottle({ perfume, handleRef }: Props) {
  const glass = useRef<THREE.MeshPhysicalMaterial>(null);
  const liquid = useRef<THREE.MeshStandardMaterial>(null);
  const cap = useRef<THREE.MeshStandardMaterial>(null);
  const base = useRef<THREE.MeshPhysicalMaterial>(null);
  const label = useRef<THREE.MeshStandardMaterial>(null);

  useLayoutEffect(() => {
    handleRef.current = {
      setFocus(f: number) {
        const k = 0.12 + 0.88 * f;
        if (glass.current) {
          glass.current.color.set(perfume.glass).multiplyScalar(0.25 + 0.75 * f);
          // env reflections are scaled with specularIntensity / clearcoat (envMapIntensity is ignored with scene.environment)
          glass.current.specularIntensity = 0.04 + 0.96 * f;
          glass.current.clearcoat = 0.05 + 0.95 * f;
        }
        if (liquid.current) {
          liquid.current.color.set(perfume.liquid).multiplyScalar(k);
          liquid.current.emissive.set(perfume.liquid).multiplyScalar(0.35 * f);
        }
        if (base.current) {
          base.current.color.set("#cfd6e0").multiplyScalar(0.15 + 0.85 * f);
          base.current.specularIntensity = 0.04 + 0.96 * f;
          base.current.clearcoat = 0.05 + 0.95 * f;
        }
        if (label.current) {
          label.current.opacity = 0.02 + 0.1 * f;
          label.current.roughness = 1 - 0.5 * f;
        }
        if (cap.current) {
          cap.current.color.set(perfume.cap).multiplyScalar(k);
        }
      },
    };
  });

  return (
    <group>
      {/* glass body */}
      <RoundedBox args={[1.35, 1.9, 0.62]} radius={0.12} smoothness={6}>
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
        <meshPhysicalMaterial ref={base} color="#cfd6e0" metalness={0.3} roughness={0.05} transparent opacity={0.5} clearcoat={1} />
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

      {/* front label */}
      <mesh position={[0, 0.05, 0.315]}>
        <planeGeometry args={[0.8, 0.9]} />
        <meshStandardMaterial ref={label} color="#ffffff" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}
