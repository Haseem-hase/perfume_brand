"use client";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Archivo } from "next/font/google";
import PerfumeBottle, { type BottleHandle } from "./PerfumeBottle";
import { PERFUMES } from "./Perfumes";
import "./Carousel.css";

const display = Archivo({ subsets: ["latin"], weight: ["900"], style: ["italic"] });

const N = PERFUMES.length;
const RADIUS = 13; // radius of the horizontal ring (fitted to the reference screenshot)
const STEP = 0.18; // angle (rad) between two bottles on the ring
const ARC = 0.016; // how much the row bends: sides sit lower than the centre (smooth arch)
const TILT = 0.028; // lean of each bottle toward the centre, grows smoothly with distance
const RING_PITCH = -0.12; // camera sees a bit of the underside, like the reference
const BOTTLE_SCALE = 1.15;
// The ring must be longer than the screen so a bottle slides fully off-screen BEFORE it wraps round
// (that wrap was the "blinking"). With few perfumes we repeat them: COPIES sets of N bottles.
const COPIES = Math.max(1, Math.ceil(10 / N));
const M = N * COPIES; // number of bottles actually drawn
const CIRCLE_UNTIL = 4; // up to this many slots from the centre the path is the circle; after that it continues straight, off-screen

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
    <group position={[0, 2.95, -0.4]} rotation={[Math.PI - 0.3, 0, 0]} scale={0.75}>
      {/* flipped so the camera sees the underside, like the reference */}
      <mesh geometry={geo}>
        <meshStandardMaterial color="#eef1f6" metalness={0.85} roughness={0.18} emissive="#2a2d33" />
      </mesh>
      {/* concentric chrome rings on the underside */}
      <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.0, 0.05, 16, 96]} />
        <meshStandardMaterial color="#f4f6fa" metalness={1} roughness={0.12} emissive="#3a3d44" />
      </mesh>
      <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.05, 16, 96]} />
        <meshStandardMaterial color="#f4f6fa" metalness={1} roughness={0.12} emissive="#3a3d44" />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[1.25, 1.5, 0.4, 96, 1, true]} />
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
  const current = useRef(0);
  const handles = useRef<MutableRefObject<BottleHandle | null>[]>(
    Array.from({ length: M }, () => ({ current: null }))
  );
  const groups = useRef<(THREE.Group | null)[]>([]);

  useFrame((state, dt) => {
    current.current = THREE.MathUtils.damp(current.current, target.current, 5, dt);
    const c = current.current;
    onProgress(c);

    for (let i = 0; i < M; i++) {
      let d = i - c;
      d -= M * Math.round(d / M); // wrap happens at +-M/2 slots = far off-screen
      const g = groups.current[i];
      if (!g) continue;
      // circle path near the centre, then a straight continuation (tangent) so bottles keep travelling off-screen
      const dc = Math.max(-CIRCLE_UNTIL, Math.min(CIRCLE_UNTIL, d));
      const over = d - dc; // slots beyond the circle part (0 for most bottles)
      const a = dc * STEP; // angle on the ring (0 = front/centre)
      const x = Math.sin(a) * RADIUS + over * RADIUS * STEP * Math.cos(a);
      const zExtra = -Math.abs(over) * RADIUS * STEP * Math.abs(Math.sin(a));
      // one smooth arch through all bottles + a lean that grows smoothly with x (no per-bottle zigzag, no phase-shifted bobbing)
      g.position.set(x, -ARC * x * x, Math.cos(a) * RADIUS - RADIUS + zExtra);
      g.rotation.set(0, a, TILT * x);
      const focus = Math.max(0, 1 - Math.abs(d) / 1.35);
      handles.current[i].current?.setFocus(focus * focus);
      g.visible = Math.abs(d) < M / 2 - 0.5;
    }
  });

  return (
    <group position={[0, -0.05, 0]} rotation={[RING_PITCH, 0, 0]}>
      {Array.from({ length: M }, (_, i) => PERFUMES[i % N]).map((p, i) => (
        <group
          key={`${p.name}-${i}`}
          ref={(el: THREE.Group | null) => {
            groups.current[i] = el;
          }}
        >
          <group scale={BOTTLE_SCALE}>
            <group position={[0, -0.5, 0]}>
              <PerfumeBottle perfume={p} handleRef={handles.current[i]} />
            </group>
          </group>
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
  const activeRef = useRef<number>(0);
  const [active, setActive] = useState(0);

  const wrap = (v: number) => ((v % N) + N) % N;
  const snapSoon = () => {
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => {
      target.current = Math.round(target.current);
    }, 140);
  };
  const go = (i: number) => {
    target.current = i; // unbounded: the wheel wraps around
  };

  const onProgress = (c: number) => {
    const el = sliderRef.current;
    if (el) {
      el.value = String(Math.min(N - 1, wrap(c)));
    }
    const r = wrap(Math.round(c));
    if (r !== activeRef.current) {
      activeRef.current = r;
      setActive(r);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(Math.round(target.current) + 1);
      if (e.key === "ArrowLeft") go(Math.round(target.current) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const p = PERFUMES[active];

  return (
    <main
      className="pc"
      style={{ "--glow": p.glow } as CSSProperties}
      onWheel={(e) => {
        target.current += (e.deltaY + e.deltaX) * 0.0025;
        snapSoon();
      }}
      onPointerDown={(e) => {
        drag.current = e.clientX;
      }}
      onPointerMove={(e) => {
        if (drag.current == null) return;
        target.current -= (e.clientX - drag.current) * 0.006;
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

      <Canvas className="pc-canvas" camera={{ position: [0, 0, 11], fov: 38 }} dpr={[1, 2]}>
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
            // jump to the chosen perfume by the shortest way round the loop
            const v = parseFloat(e.target.value);
            target.current = v + N * Math.round((target.current - v) / N);
            snapSoon();
          }}
        />
        <p className="pc-hint">SCROLL TO DISCOVER</p>
      </section>
    </main>
  );
}
