"use client";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState, MutableRefObject, CSSProperties, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Archivo } from "next/font/google";
import "./Carousel.css";
import { PERFUMES } from "./Perfumes";
import PerfumeBottle, { type BottleHandle } from "./PerfumeBottle";

const display = Archivo({ subsets: ["latin"], weight: ["900"], style: ["italic"] });

const N = PERFUMES.length;
const PIVOT_Y = 9; // the "wheel" centre, high above the screen
const RADIUS = 9.3; // distance from pivot to bottles
const STEP = 0.24; // angle (rad) between two bottles

/* ---------- silver pedestal at the top ---------- */
function Pedestal() {
  const geo = useMemo(() => {
    const pts = [
      [0.0, 0.0], [1.5, 0.0], [1.7, 0.06], [1.75, 0.14], [1.5, 0.2], [1.2, 0.22],
      [1.05, 0.3], [0.85, 0.34], [0.0, 0.34],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 96);
  }, []);
  return (
    <group position={[0, 3.1, -0.4]} rotation={[0.28, 0, 0]}>
      <mesh geometry={geo}>
        <meshStandardMaterial color="#d9dde5" metalness={1} roughness={0.12} envMapIntensity={1.6} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[1.35, 1.55, 0.55, 96, 1, true]} />
        <meshStandardMaterial color="#050505" metalness={0.9} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ---------- the rotating wheel of bottles ---------- */
type WheelProps = {
  target: MutableRefObject<number>;
  onProgress: (current: number) => void;
};

function Wheel({ target, onProgress }: WheelProps) {
  const wheel = useRef<THREE.Group>(null);
  const current = useRef<number>(0);
  const bottles = useMemo(
    () => PERFUMES.map(() => ({ current: null as BottleHandle | null })),
    []
  );
  const groups = useRef<(THREE.Group | null)[]>([]);

  useFrame((state, dt) => {
    // smooth follow
    current.current = THREE.MathUtils.damp(current.current, target.current, 5, dt);
    const c = current.current;
    onProgress(c);

    PERFUMES.forEach((_, i) => {
      const d = i - c; // distance from the centre, in "slots"
      const g = groups.current[i];
      if (!g) return;
      const theta = -Math.PI / 2 + d * STEP * -1; // active one sits at the bottom of the wheel
      g.position.set(Math.cos(theta) * RADIUS, PIVOT_Y + Math.sin(theta) * RADIUS, -Math.abs(d) * 0.35);
      g.rotation.z = theta + Math.PI / 2 - 0.08;
      g.rotation.y = d * 0.12 + Math.sin(state.clock.elapsedTime * 0.6 + i) * 0.06; // gentle float
      g.rotation.x = -0.05;
      const focus = Math.max(0, 1 - Math.abs(d) / 1.35);
      bottles[i]?.current?.setFocus(focus * focus);
      g.visible = Math.abs(d) < 5;
    });
  });

  return (
    <group ref={wheel}>
      {PERFUMES.map((p, i) => (
        <group key={p.name} ref={(el: THREE.Group | null) => { groups.current[i] = el; }}>
          <PerfumeBottle perfume={p} bottleRef={bottles[i]} />
        </group>
      ))}
    </group>
  );
}

function Studio() {
  return (
    <Environment resolution={256} background={false}>
      <Lightformer form="rect" intensity={4} position={[0, 5, 4]} scale={[10, 2, 1]} />
      <Lightformer form="rect" intensity={2} position={[-6, 1, 3]} scale={[2, 6, 1]} />
      <Lightformer form="rect" intensity={2} position={[6, 1, 3]} scale={[2, 6, 1]} />
      <Lightformer form="ring" intensity={3} position={[0, 3, -3]} scale={4} />
    </Environment>
  );
}

/* ---------- page UI ---------- */
export default function PerfumeCarousel() {
  const target = useRef<number>(0);
  const sliderRef = useRef<HTMLInputElement>(null);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drag = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  const clamp = useCallback((v: number) => Math.min(N - 1, Math.max(0, v)), []);
  const snapSoon = useCallback(() => {
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => (target.current = Math.round(target.current)), 140);
  }, []);
  const go = useCallback((i: number) => (target.current = clamp(i)), [clamp]);

  const onProgress = useCallback((c: number) => {
    if (sliderRef.current) {
      sliderRef.current.value = c.toString();
      sliderRef.current.style.setProperty("--p", `${(c / (N - 1)) * 100}%`);
    }
    const r = Math.round(c);
    if (r !== activeRef.current) {
      activeRef.current = r;
      setActive(r);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(Math.round(target.current) + 1);
      if (e.key === "ArrowLeft") go(Math.round(target.current) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const p = PERFUMES[active];

  return (
    <main
      className="pc"
      style={{ "--glow": p.glow } as CSSProperties}
      onWheel={(e) => {
        target.current = clamp(target.current + (e.deltaY + e.deltaX) * 0.0025);
        snapSoon();
      }}
      onPointerDown={(e) => (drag.current = e.clientX)}
      onPointerMove={(e) => {
        if (drag.current == null) return;
        target.current = clamp(target.current - (e.clientX - drag.current) * 0.006);
        drag.current = e.clientX;
      }}
      onPointerUp={() => {
        drag.current = null;
        snapSoon();
      }}
      onPointerLeave={() => {
        if (drag.current != null) {
          drag.current = null;
          snapSoon();
        }
      }}
    >
      <div className="pc-glow" />

      <Canvas className="pc-canvas" camera={{ position: [0, 0.2, 12], fov: 35 }} dpr={[1, 2]}>
        <Studio />
        <ambientLight intensity={0.25} />
        <spotLight position={[0, 6, 6]} angle={0.6} penumbra={1} intensity={60} />
        <Pedestal />
        <Wheel target={target} onProgress={onProgress} />
      </Canvas>

      {/* top bar */}
      <div className="pc-line" />
      <header className="pc-nav">
        <div className="pc-sound">
          ON <i /><i /><i /><i />
        </div>
        <div className={`pc-logo ${display.className}`}>
          MAISON
          <br />
          ÉLIXIR
        </div>
        <div className="pc-right">
          <button className="pc-menu">
            <span className="pc-dots"><b /><b /><b /><b /></span>MENU
          </button>
          <button className="pc-contact">CONTACT</button>
        </div>
      </header>

      {/* corner brackets */}
      <span className="pc-c tl" /><span className="pc-c tr" /><span className="pc-c bl" /><span className="pc-c br" />

      {/* arrows */}
      <button className="pc-arrow l" aria-label="Previous" onClick={() => go(Math.round(target.current) - 1)} />
      <button className="pc-arrow r" aria-label="Next" onClick={() => go(Math.round(target.current) + 1)} />

      {/* title + slider */}
      <section className="pc-bottom">
        <h1 key={p.name} className={`pc-title ${display.className}`}>{p.name}</h1>
        <input
          ref={sliderRef}
          className="pc-slider"
          type="range"
          min={0}
          max={N - 1}
          step={0.001}
          defaultValue={0}
          aria-label="Choose perfume"
          onChange={(e) => {
            target.current = parseFloat(e.target.value);
            snapSoon();
          }}
        />
        <p className="pc-hint">SCROLL TO DISCOVER</p>
      </section>
    </main>
  );
}
