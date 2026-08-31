"use client";

import { ContactShadows, Environment, Html, OrbitControls, useCursor, useGLTF } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useState } from "react";
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

const MODEL = "/models/tesla/scene.gltf";
const PAINT = "#f3f1ec";

type PadLayout = {
  id: number;
  position: [number, number, number];
  size: [number, number];
};

// Local to the rear-deck group (Y-rotated π so +X is screen-left / world −X).
// 9/10 sit further out and slightly toward the cabin (local −Z → world +Z).
const PADS: PadLayout[] = [
  { id: 1, position: [0, 0.18, 0], size: [0.55, 0.16] },
  { id: 2, position: [0.5, 0.18, 0], size: [0.42, 0.16] },
  { id: 3, position: [-0.5, 0.18, 0], size: [0.42, 0.16] },
  { id: 4, position: [0.2, 0, 0], size: [0.18, 0.12] },
  { id: 5, position: [-0.2, 0, 0], size: [0.18, 0.12] },
  { id: 6, position: [0, -0.16, 0], size: [0.42, 0.12] },
  { id: 7, position: [0.5, -0.16, 0], size: [0.42, 0.12] },
  { id: 8, position: [-0.5, -0.16, 0], size: [0.42, 0.12] },
  { id: 9, position: [0.78, 0.04, -0.12], size: [0.14, 0.14] },
  { id: 10, position: [-0.78, 0.04, -0.12], size: [0.14, 0.14] },
];

function useLogoTexture(url?: string) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!url) {
      setTex(null);
      return;
    }
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(url, (t) => {
      if (cancelled) {
        t.dispose();
        return;
      }
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      t.needsUpdate = true;
      setTex(t);
    });
    return () => {
      cancelled = true;
      setTex((prev) => {
        prev?.dispose();
        return null;
      });
    };
  }, [url]);
  return tex;
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
  const logo = useLogoTexture(spot?.holder?.logoDataUrl);
  useCursor(hot);
  if (!spot) return null;
  const taken = Boolean(logo);

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
        {taken && logo ? (
          <meshBasicMaterial map={logo} toneMapped={false} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        ) : (
          <meshPhysicalMaterial
            color={hot ? "#e2ff4d" : "#111110"}
            transparent
            opacity={hot ? 0.72 : 0.38}
            roughness={0.35}
            metalness={0.1}
            depthWrite={false}
            side={THREE.DoubleSide}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        )}
      </mesh>
      {hot && (
        <Html center distanceFactor={8} zIndexRange={[30, 0]} style={{ pointerEvents: "none", width: 128, textAlign: "center" }}>
          <div
            style={{
              fontFamily: "Instrument Sans, sans-serif",
              background: "rgba(12,13,18,.88)",
              color: "#f3f1eb",
              border: "1px solid rgba(243,241,235,.14)",
              borderRadius: 10,
              padding: "7px 9px",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "-0.03em" }}>{spot.holder?.brand ?? spot.name}</div>
            <div style={{ fontSize: 10, color: "#e2ff4d", marginTop: 2 }}>{usd(spot.current)}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function TeslaModel({ spots, onPick }: { spots: SpotView[]; onPick: (id: number) => void }) {
  const { scene } = useGLTF(MODEL);
  const [deck, setDeck] = useState<{ y: number; z: number } | null>(null);
  const byId = useMemo(() => Object.fromEntries(spots.map((s) => [s.id, s])), [spots]);

  useLayoutEffect(() => {
    scene.scale.set(0.01, 0.01, 0.01);
    scene.position.set(0, 0.84, 0);
    scene.rotation.set(0, Math.PI, 0);
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) {
        if (!mat || !("envMapIntensity" in mat)) continue;
        const std = mat as THREE.MeshStandardMaterial;
        std.envMapIntensity = 1.6;
        const n = (std.name || "").toLowerCase();
        if (n === "primary" || n.startsWith("primary.")) {
          std.color.set(PAINT);
          std.metalness = 0.55;
          std.roughness = 0.22;
          std.envMapIntensity = 1.8;
        }
      }
    });
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const h = box.max.y - box.min.y;
    let y = box.min.y + 0.55 * h;
    if (y < 0.92 || y > 1.1) y = Math.min(1.05, Math.max(0.95, box.min.y + 0.62 * h));
    setDeck({ y, z: box.min.z + 0.08 });
  }, [scene]);

  return (
    <group>
      <primitive object={scene} />
      {deck && (
        <group position={[0, deck.y, deck.z]} rotation={[0.15, Math.PI, 0]}>
          {PADS.map((pad) => (
            <SpotPad key={pad.id} spot={byId[pad.id]} position={pad.position} size={pad.size} onPick={onPick} />
          ))}
        </group>
      )}
    </group>
  );
}

function LockedOrbit() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(3.2, 1.55, -5.6);
    camera.lookAt(0, 0.75, 0);
  }, [camera]);
  return (
    <OrbitControls
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={5.8}
      maxDistance={9}
      minPolarAngle={1.05}
      maxPolarAngle={1.35}
      target={[0, 0.75, 0]}
      autoRotate
      autoRotateSpeed={0.35}
    />
  );
}

function Loader() {
  return (
    <Html center style={{ pointerEvents: "none", color: "#c9cbd4", fontFamily: "Instrument Sans, sans-serif", fontSize: 14 }}>
      Loading Model 3…
    </Html>
  );
}

export default function Car3D({ spots, onPick }: { spots: SpotView[]; onPick: (id: number) => void }) {
  return (
    <div className="car-canvas" aria-label="White 2018 Model 3. Drag to orbit. Click a spot to bid.">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 32, near: 0.4, far: 40, position: [3.2, 1.55, -5.6] }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#0c0d12"]} />
        <ambientLight intensity={0.32} />
        <spotLight position={[5, 8, 3]} intensity={55} angle={0.35} penumbra={0.7} castShadow />
        <spotLight position={[-4, 4, -6]} intensity={22} color="#9aa7ff" />
        <Environment preset="city" />
        <Suspense fallback={<Loader />}>
          <TeslaModel spots={spots} onPick={onPick} />
        </Suspense>
        <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={9} blur={2.4} far={2.8} />
        <LockedOrbit />
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL);
