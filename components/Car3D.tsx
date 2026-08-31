"use client";

import { ContactShadows, Environment, Html, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { usd, type SpotSize } from "@/lib/spots";

export type SpotView = {
  id: number;
  name: string;
  hint: string;
  size: SpotSize;
  current: number;
  bidCount: number;
  holder: { brand: string; logoDataUrl?: string } | null;
};

const PAINT = "#f3f1ec";

function bodyGeometry() {
  const s = new THREE.Shape();
  const pts: [number, number][] = [
    [-2.34, 0.14],
    [-2.36, 0.28],
    [-2.3, 0.5],
    [-2.18, 0.66],
    [-1.95, 0.74],
    [-1.15, 0.78],
    [-0.62, 0.86],
    [-0.18, 1.22],
    [0.22, 1.4],
    [0.85, 1.44],
    [1.28, 1.38],
    [1.72, 1.12],
    [2.02, 0.94],
    [2.22, 0.86],
    [2.32, 0.7],
    [2.36, 0.48],
    [2.34, 0.28],
    [2.28, 0.14],
  ];
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 1.78,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.04,
    bevelSegments: 4,
    steps: 1,
  });
  g.center();
  g.rotateX(-Math.PI / 2);
  g.translate(0, 0.14, 0);
  return g;
}

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.33, z]} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.33, 0.33, 0.2, 36]} />
        <meshStandardMaterial color="#111" roughness={0.92} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.23, 0.23, 0.22, 28]} />
        <meshStandardMaterial color="#c5c8cf" metalness={0.9} roughness={0.22} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.09, 0.09, 0.23, 16]} />
        <meshStandardMaterial color="#1c1c1c" metalness={0.5} roughness={0.35} />
      </mesh>
    </group>
  );
}

function SpotPad({
  spot,
  position,
  size,
  onPick,
}: {
  spot?: SpotView;
  position: [number, number, number];
  size: [number, number];
  onPick: (id: number) => void;
}) {
  const [hot, setHot] = useState(false);
  if (!spot) return null;
  const taken = Boolean(spot.holder?.logoDataUrl);
  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onPick(spot.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHot(true);
        }}
        onPointerOut={() => setHot(false)}
      >
        <planeGeometry args={size} />
        <meshPhysicalMaterial
          color={taken ? "#ffffff" : hot ? "#e2ff4d" : "#111110"}
          transparent
          opacity={taken ? 0.95 : hot ? 0.72 : 0.38}
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>
      <Html center distanceFactor={7} zIndexRange={[20, 0]} style={{ pointerEvents: "none", width: 88, textAlign: "center" }}>
        <div
          style={{
            fontFamily: "Instrument Sans, sans-serif",
            color: hot || taken ? "#111" : "#e2ff4d",
            textShadow: hot ? "none" : "0 1px 8px rgba(0,0,0,.7)",
          }}
        >
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "-0.03em" }}>
            {spot.holder?.brand ?? spot.name}
          </div>
          <div style={{ fontSize: 8, opacity: 0.9 }}>{usd(spot.current)}</div>
        </div>
      </Html>
    </group>
  );
}

function Model3({ spots, onPick }: { spots: SpotView[]; onPick: (id: number) => void }) {
  const geom = useMemo(() => bodyGeometry(), []);
  const paint = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: PAINT,
        metalness: 0.78,
        roughness: 0.16,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.35,
      }),
    [],
  );
  const byId = useMemo(() => Object.fromEntries(spots.map((s) => [s.id, s])), [spots]);

  return (
    <group>
      <mesh geometry={geom} material={paint} castShadow receiveShadow />
      <mesh position={[0, 1.08, 0.05]} rotation={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[1.58, 0.42, 2.05]} />
        <meshPhysicalMaterial color="#0d1016" metalness={0.9} roughness={0.06} transparent opacity={0.88} />
      </mesh>
      <mesh position={[0, 0.78, -2.22]}>
        <boxGeometry args={[1.62, 0.055, 0.06]} />
        <meshStandardMaterial color="#c1121f" emissive="#c1121f" emissiveIntensity={1.1} />
      </mesh>
      <mesh position={[-0.42, 0.62, 2.2]} rotation={[0, 0.08, 0]}>
        <boxGeometry args={[0.42, 0.12, 0.05]} />
        <meshStandardMaterial color="#eef3ff" emissive="#c9d8ff" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0.42, 0.62, 2.2]} rotation={[0, -0.08, 0]}>
        <boxGeometry args={[0.42, 0.12, 0.05]} />
        <meshStandardMaterial color="#eef3ff" emissive="#c9d8ff" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.9, -2.18]}>
        <boxGeometry args={[0.14, 0.14, 0.03]} />
        <meshStandardMaterial color="#111" metalness={0.5} roughness={0.25} />
      </mesh>
      <mesh position={[-0.92, 0.92, 0.35]} rotation={[0, 0.4, 0.1]}>
        <boxGeometry args={[0.08, 0.18, 0.28]} />
        <meshPhysicalMaterial color="#111" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0.92, 0.92, 0.35]} rotation={[0, -0.4, -0.1]}>
        <boxGeometry args={[0.08, 0.18, 0.28]} />
        <meshPhysicalMaterial color="#111" metalness={0.7} roughness={0.2} />
      </mesh>
      <Wheel x={-0.82} z={1.28} />
      <Wheel x={0.82} z={1.28} />
      <Wheel x={-0.82} z={-1.42} />
      <Wheel x={0.82} z={-1.42} />
      <group position={[0, 0.98, -2.16]} rotation={[0.02, Math.PI, 0]}>
        <SpotPad spot={byId[1]} position={[0, 0.2, 0.01]} size={[0.62, 0.18]} onPick={onPick} />
        <SpotPad spot={byId[2]} position={[-0.58, 0.2, 0.01]} size={[0.46, 0.18]} onPick={onPick} />
        <SpotPad spot={byId[3]} position={[0.58, 0.2, 0.01]} size={[0.46, 0.18]} onPick={onPick} />
        <SpotPad spot={byId[4]} position={[-0.24, 0.02, 0.01]} size={[0.2, 0.14]} onPick={onPick} />
        <SpotPad spot={byId[5]} position={[0.24, 0.02, 0.01]} size={[0.2, 0.14]} onPick={onPick} />
        <SpotPad spot={byId[6]} position={[0, -0.16, 0.01]} size={[0.48, 0.13]} onPick={onPick} />
        <SpotPad spot={byId[7]} position={[-0.56, -0.16, 0.01]} size={[0.42, 0.13]} onPick={onPick} />
        <SpotPad spot={byId[8]} position={[0.56, -0.16, 0.01]} size={[0.42, 0.13]} onPick={onPick} />
        <SpotPad spot={byId[9]} position={[-0.88, 0.02, 0.08]} size={[0.16, 0.16]} onPick={onPick} />
        <SpotPad spot={byId[10]} position={[0.88, 0.02, 0.08]} size={[0.16, 0.16]} onPick={onPick} />
      </group>
    </group>
  );
}

function LockedOrbit() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(3.15, 1.55, -5.35);
    camera.lookAt(0, 0.62, 0);
  }, [camera]);
  return (
    <OrbitControls
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={5.6}
      maxDistance={8.2}
      minPolarAngle={1.05}
      maxPolarAngle={1.32}
      target={[0, 0.62, 0]}
      autoRotate
      autoRotateSpeed={0.45}
    />
  );
}

export default function Car3D({ spots, onPick }: { spots: SpotView[]; onPick: (id: number) => void }) {
  return (
    <div className="car-canvas" aria-label="White 2018 Model 3. Drag to orbit. Click a spot to bid.">
      <Canvas shadows camera={{ fov: 28, near: 0.4, far: 40, position: [3.15, 1.55, -5.35] }} gl={{ antialias: true }}>
        <color attach="background" args={["#0c0d12"]} />
        <ambientLight intensity={0.35} />
        <spotLight position={[5, 8, 3]} intensity={70} angle={0.35} penumbra={0.7} castShadow />
        <spotLight position={[-4, 4, -6]} intensity={28} color="#9aa7ff" />
        <Environment preset="studio" />
        <Model3 spots={spots} onPick={onPick} />
        <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={9} blur={2.4} far={2.8} />
        <LockedOrbit />
      </Canvas>
    </div>
  );
}
