"use client";

import { ContactShadows, Environment, Html, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo, useState } from "react";
import type { SpotSize } from "@/lib/spots";
import { SIZE_LABEL, usd } from "@/lib/spots";

export type SpotView = {
  id: number;
  name: string;
  hint: string;
  size: SpotSize;
  dim: string;
  dimIn: string;
  opening: number;
  current: number;
  bidCount: number;
  holder: {
    brand: string;
    website?: string;
    x?: string;
    logoDataUrl?: string;
    approved: boolean;
  } | null;
};

const PAINT = "#f4f2ee";
const GLASS = "#11141c";
const RUBBER = "#151515";
const RIM = "#c9ccd3";
const LIGHT = "#c1121f";

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.32, z]} rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[0.33, 0.33, 0.22, 32]} />
        <meshStandardMaterial color={RUBBER} roughness={0.9} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.22, 0.22, 0.24, 24]} />
        <meshStandardMaterial color={RIM} metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.08, 0.08, 0.26, 16]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function TeslaBadge() {
  return (
    <group position={[0, 0.92, -2.08]}>
      <mesh>
        <boxGeometry args={[0.16, 0.16, 0.02]} />
        <meshStandardMaterial color="#111" metalness={0.4} roughness={0.3} />
      </mesh>
      <Html center distanceFactor={6} style={{ pointerEvents: "none", color: "#eee", fontWeight: 700, fontSize: 10 }}>
        T
      </Html>
    </group>
  );
}

function Sticker({
  spot,
  position,
  w,
  h,
  onPick,
}: {
  spot?: SpotView;
  position: [number, number, number];
  w: number;
  h: number;
  onPick: (id: number) => void;
}) {
  const [hover, setHover] = useState(false);
  if (!spot) return null;
  const hasLogo = Boolean(spot.holder?.logoDataUrl);
  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onPick(spot.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "grab";
        }}
      >
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          color={hasLogo ? "#ffffff" : hover ? "#e2ff4d" : "#111111"}
          transparent
          opacity={hasLogo ? 0.95 : hover ? 0.55 : 0.28}
          roughness={0.4}
        />
      </mesh>
      <Html center distanceFactor={5} style={{ pointerEvents: "none", textAlign: "center", width: 90 }}>
        <div style={{ fontFamily: "Instrument Sans, sans-serif", color: hover || hasLogo ? "#111" : "#e2ff4d" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "-0.02em" }}>
            {spot.holder?.brand ?? spot.name}
          </div>
          <div style={{ fontSize: 8, opacity: 0.85 }}>{usd(spot.current)}</div>
        </div>
      </Html>
    </group>
  );
}

function Model3({ spots, onPick }: { spots: SpotView[]; onPick: (id: number) => void }) {
  const byId = useMemo(() => Object.fromEntries(spots.map((s) => [s.id, s])), [spots]);
  return (
    <group rotation={[0, Math.PI * 0.18, 0]}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[1.86, 0.42, 4.35]} />
        <meshPhysicalMaterial color={PAINT} metalness={0.72} roughness={0.22} clearcoat={1} clearcoatRoughness={0.12} />
      </mesh>
      <RoundedBox args={[1.82, 0.22, 4.2]} radius={0.08} position={[0, 0.66, 0.02]} smoothness={4} castShadow>
        <meshPhysicalMaterial color={PAINT} metalness={0.72} roughness={0.2} clearcoat={1} clearcoatRoughness={0.1} />
      </RoundedBox>
      <mesh position={[0, 0.58, 1.55]} rotation={[-0.08, 0, 0]} castShadow>
        <boxGeometry args={[1.78, 0.16, 1.15]} />
        <meshPhysicalMaterial color={PAINT} metalness={0.7} roughness={0.2} clearcoat={1} clearcoatRoughness={0.1} />
      </mesh>
      <mesh position={[0, 1.02, -0.15]} rotation={[0.12, 0, 0]} castShadow>
        <boxGeometry args={[1.62, 0.52, 2.15]} />
        <meshPhysicalMaterial color={GLASS} metalness={0.85} roughness={0.08} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 0.9, -1.55]}>
        <boxGeometry args={[1.78, 0.28, 1.05]} />
        <meshPhysicalMaterial color={PAINT} metalness={0.72} roughness={0.2} clearcoat={1} clearcoatRoughness={0.1} />
      </mesh>
      <mesh position={[0, 0.72, -2.16]}>
        <boxGeometry args={[1.7, 0.06, 0.08]} />
        <meshStandardMaterial color={LIGHT} emissive={LIGHT} emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0, 0.55, 2.16]}>
        <boxGeometry args={[1.55, 0.08, 0.06]} />
        <meshStandardMaterial color="#f7fbff" emissive="#dcecff" emissiveIntensity={0.5} />
      </mesh>
      <TeslaBadge />
      <Wheel x={-0.78} z={1.35} />
      <Wheel x={0.78} z={1.35} />
      <Wheel x={-0.78} z={-1.4} />
      <Wheel x={0.78} z={-1.4} />
      <group position={[0, 0.98, -1.72]} rotation={[0.05, 0, 0]}>
        <Sticker spot={byId[1]} position={[0, 0.18, 0]} w={0.55} h={0.16} onPick={onPick} />
        <Sticker spot={byId[2]} position={[-0.52, 0.18, 0]} w={0.42} h={0.16} onPick={onPick} />
        <Sticker spot={byId[3]} position={[0.52, 0.18, 0]} w={0.42} h={0.16} onPick={onPick} />
        <Sticker spot={byId[4]} position={[-0.22, 0, 0]} w={0.2} h={0.14} onPick={onPick} />
        <Sticker spot={byId[5]} position={[0.22, 0, 0]} w={0.2} h={0.14} onPick={onPick} />
        <Sticker spot={byId[6]} position={[0, -0.16, 0]} w={0.42} h={0.12} onPick={onPick} />
        <Sticker spot={byId[7]} position={[-0.5, -0.16, 0]} w={0.38} h={0.12} onPick={onPick} />
        <Sticker spot={byId[8]} position={[0.5, -0.16, 0]} w={0.38} h={0.12} onPick={onPick} />
        <Sticker spot={byId[9]} position={[-0.85, 0.02, 0.12]} w={0.16} h={0.16} onPick={onPick} />
        <Sticker spot={byId[10]} position={[0.85, 0.02, 0.12]} w={0.16} h={0.16} onPick={onPick} />
      </group>
    </group>
  );
}

export default function Car3D({ spots, onPick }: { spots: SpotView[]; onPick: (id: number) => void }) {
  return (
    <div className="car-canvas" aria-label="Spin the white Model 3">
      <Canvas camera={{ position: [3.4, 1.7, 4.2], fov: 32 }} shadows>
        <color attach="background" args={["#0c0d12"]} />
        <ambientLight intensity={0.45} />
        <spotLight position={[6, 8, 4]} angle={0.35} intensity={80} penumbra={0.6} castShadow />
        <spotLight position={[-4, 5, -3]} angle={0.5} intensity={30} color="#8899ff" />
        <Suspense fallback={null}>
          <Environment preset="city" />
          <Model3 spots={spots} onPick={onPick} />
          <ContactShadows position={[0, 0, 0]} opacity={0.55} scale={8} blur={2.2} far={3} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={3.2}
          maxDistance={8}
          minPolarAngle={0.7}
          maxPolarAngle={1.4}
          autoRotate
          autoRotateSpeed={0.7}
          target={[0, 0.7, 0]}
        />
      </Canvas>
    </div>
  );
}

export { SIZE_LABEL };
