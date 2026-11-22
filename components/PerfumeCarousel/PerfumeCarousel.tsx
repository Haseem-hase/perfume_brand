"use client";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
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

/* ---------- light-producing torch above the active perfume ---------- */
const BEAM_VERT = /* glsl */ `
  varying vec3 vN; varying vec3 vV; varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const BEAM_FRAG = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity;
  varying vec3 vN; varying vec3 vV; varying vec2 vUv;
  void main() {
    float f = abs(dot(normalize(vN), normalize(vV)));
    float soft = pow(f, 1.3);            // transparent at the silhouette edges -> soft volumetric look
    float along = pow(vUv.y, 1.6);       // bright at the lens, fading toward the product
    float a = soft * along * uOpacity;
    gl_FragColor = vec4(uColor, a);
  }
`;
const LENS_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const LENS_FRAG = /* glsl */ `
  uniform vec3 uColor; uniform float uHalo;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    if (uHalo > 0.5) {                    // soft glow around the lens (additive)
      float a = pow(max(0.0, 1.0 - r), 2.2) * 0.5;
      gl_FragColor = vec4(uColor, a);
    } else {                              // Fresnel lens: concentric grooves, white-hot centre, darker rim
      float core = smoothstep(1.0, 0.0, r);
      float grooves = 0.5 + 0.5 * cos(r * 46.0);
      float rim = smoothstep(1.0, 0.86, r);
      vec3 col = mix(uColor, vec3(1.0), core * 0.9);
      col *= mix(0.78, 1.0, grooves) * (0.55 + 0.45 * rim);
      gl_FragColor = vec4(col * (0.9 + 0.8 * core), 1.0);
    }
  }
`;

// outer silhouette of the lamp body, as [radius, distance behind the lens]
const BODY_PROFILE: [number, number][] = [
  [1.13, 0.0], [1.18, 0.07], [1.18, 0.32], [1.11, 0.72], [1.02, 1.1], [0.95, 1.45],
  [0.92, 1.75], [0.8, 1.97], [0.52, 2.1], [0.0, 2.14],
];
const bodyRadiusAt = (y: number) => {
  for (let i = 1; i < BODY_PROFILE.length; i++) {
    const [r0, y0] = BODY_PROFILE[i - 1];
    const [r1, y1] = BODY_PROFILE[i];
    if (y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0 || 1);
  }
  return 0.5;
};

const TORCH_POS = new THREE.Vector3(0, 2.5, -0.4);
const TORCH_TILT = -0.35; // rotation about x: lens turns toward the viewer, light still lands on the centre bottle

function Torch({ glow }: { glow: string }) {
  const light = useRef<THREE.SpotLight>(null);
  const aim = useRef<THREE.Object3D>(null);
  const tint = useMemo(() => new THREE.Color("#ffffff"), []);
  const goal = useMemo(() => new THREE.Color("#ffffff"), []);
  const white = useMemo(() => new THREE.Color("#ffffff"), []);

  const bodyGeo = useMemo(() => {
    const curve = new THREE.SplineCurve(BODY_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)));
    return new THREE.LatheGeometry(curve.getPoints(90), 96);
  }, []);
  const fins = useMemo(() => {
    const out: { y: number; r: number }[] = [];
    for (let y = 0.85; y <= 1.85; y += 0.1) out.push({ y, r: bodyRadiusAt(y) + 0.04 });
    return out;
  }, []);
  // where the pivot knobs sit in world space (side of the body, rotated with the tilt)
  const pivot = useMemo(() => {
    const v = new THREE.Vector3(0, 0.95, 0).applyEuler(new THREE.Euler(TORCH_TILT, 0, 0));
    return v.add(TORCH_POS);
  }, []);

  const beamMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color("#ffffff") }, uOpacity: { value: 0.5 } },
        vertexShader: BEAM_VERT,
        fragmentShader: BEAM_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    []
  );
  const lensMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color("#ffffff") }, uHalo: { value: 0 } },
        vertexShader: LENS_VERT,
        fragmentShader: LENS_FRAG,
      }),
    []
  );
  const haloMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color("#ffffff") }, uHalo: { value: 1 } },
        vertexShader: LENS_VERT,
        fragmentShader: LENS_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(() => {
    if (light.current && aim.current) light.current.target = aim.current;
  }, []);

  // beam / lens take a soft tint of the active perfume's colour
  useFrame((_, dt) => {
    goal.set(glow).lerp(white, 0.55);
    tint.lerp(goal, 1 - Math.exp(-dt * 3));
    (beamMat.uniforms.uColor.value as THREE.Color).copy(tint);
    (lensMat.uniforms.uColor.value as THREE.Color).copy(tint);
    (haloMat.uniforms.uColor.value as THREE.Color).copy(tint);
    if (light.current) light.current.color.copy(tint);
  });

  const dark = { color: "#101114", metalness: 0.85, roughness: 0.34 } as const;
  const chrome = { color: "#f1f3f7", metalness: 1, roughness: 0.1 } as const;

  return (
    <>
      {/* ----- mounting yoke (world space, vertical) ----- */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.5, pivot.y, pivot.z]}>
          <RoundedBox args={[0.16, 2.2, 0.3]} radius={0.05} smoothness={4} position={[0, 1.1, 0]}>
            <meshStandardMaterial {...dark} />
          </RoundedBox>
          {/* pivot pin + ridged locking knob */}
          <mesh position={[side * -0.17, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.4, 24]} />
            <meshStandardMaterial {...chrome} />
          </mesh>
          <mesh position={[side * 0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.16, 8]} />
            <meshStandardMaterial {...chrome} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, pivot.y + 2.2, pivot.z]}>
        <boxGeometry args={[3.2, 0.2, 0.3]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      <mesh position={[0, pivot.y + 3.4, pivot.z]}>
        <cylinderGeometry args={[0.16, 0.16, 2.4, 32]} />
        <meshStandardMaterial {...chrome} />
      </mesh>

      {/* ----- the lamp head. Origin = front of the lens; local -y is the direction the light travels ----- */}
      <group position={TORCH_POS} rotation={[TORCH_TILT, 0, 0]}>
        {/* smooth shaped body */}
        <mesh geometry={bodyGeo}>
          <meshStandardMaterial {...dark} side={THREE.DoubleSide} />
        </mesh>
        {/* cooling fins */}
        {fins.map(({ y, r }) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[r, r, 0.045, 96]} />
            <meshStandardMaterial {...dark} roughness={0.28} />
          </mesh>
        ))}
        {/* chrome front bezel + thin inner trim */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.08, 0.08, 24, 120]} />
          <meshStandardMaterial {...chrome} />
        </mesh>
        <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.95, 0.035, 16, 120]} />
          <meshStandardMaterial color="#3a3d44" metalness={1} roughness={0.25} />
        </mesh>
        {/* matt black collar (the lens sits recessed inside it) */}
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.93, 0.93, 0.28, 96, 1, true]} />
          <meshStandardMaterial color="#050506" metalness={0.4} roughness={0.8} side={THREE.BackSide} />
        </mesh>
        {/* Fresnel lens */}
        <mesh position={[0, 0.26, 0]} rotation={[Math.PI / 2, 0, 0]} material={lensMat}>
          <circleGeometry args={[0.93, 96]} />
        </mesh>
        {/* soft halo in front of the lens */}
        <mesh position={[0, -0.06, 0]} rotation={[Math.PI / 2, 0, 0]} material={haloMat} renderOrder={3}>
          <circleGeometry args={[2.1, 64]} />
        </mesh>
        {/* volumetric beam */}
        <mesh position={[0, -1.6, 0]} material={beamMat} renderOrder={2}>
          <cylinderGeometry args={[0.93, 1.9, 3.4, 64, 1, true]} />
        </mesh>
        {/* real light so the active bottle is lit by the torch */}
        <spotLight ref={light} position={[0, -0.1, 0]} angle={0.36} penumbra={1} intensity={70} distance={9} decay={2} />
        <object3D ref={aim} position={[0, -3, 0]} />
      </group>
    </>
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
        <Torch glow={p.glow} />
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
