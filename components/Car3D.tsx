"use client";

import { ContactShadows, Html, OrbitControls, useCursor, useGLTF } from "@react-three/drei";
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
const PAINT = "#ffffff";
const PAD_LIFT = 0.006;
const SKIP_HIT = /wheel|glass|hub|tire|chrome|light|lcd|seat/i;

type PadDef = {
  id: number;
  f: [number, number, number];
  size: [number, number];
  out: [number, number, number];
};

// After Y=π: min.z = rear/trunk, max.z = front/hood.
// Driver (US) is max.x; passenger is min.x.
// From the default rear camera (−Z), that puts the driver on screen-right.
const PAD_DEFS: PadDef[] = [
  { id: 1, f: [0.5, 0.55, 0.82], size: [0.42, 0.2], out: [0, 1, 0] },
  { id: 2, f: [0.98, 0.42, 0.55], size: [0.36, 0.16], out: [1, 0, 0] },
  { id: 3, f: [0.02, 0.42, 0.55], size: [0.36, 0.16], out: [-1, 0, 0] },
  { id: 4, f: [0.98, 0.42, 0.38], size: [0.32, 0.15], out: [1, 0, 0] },
  { id: 5, f: [0.02, 0.42, 0.38], size: [0.32, 0.15], out: [-1, 0, 0] },
  { id: 6, f: [0.72, 0.22, 1.05], size: [0.22, 0.08], out: [0, 0, 1] },
  { id: 7, f: [0.28, 0.22, 1.05], size: [0.22, 0.08], out: [0, 0, 1] },
  { id: 8, f: [0.62, 0.62, 0.08], size: [0.28, 0.13], out: [0, 0.15, -1] },
  { id: 9, f: [0.38, 0.62, 0.08], size: [0.28, 0.13], out: [0, 0.15, -1] },
  { id: 10, f: [0.7, 0.2, -0.02], size: [0.2, 0.08], out: [0, 0, -1] },
  { id: 11, f: [0.3, 0.2, -0.02], size: [0.2, 0.08], out: [0, 0, -1] },
];

type PadPose = {
  id: number;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  size: [number, number];
};

function skipHit(hit: THREE.Intersection): boolean {
  let obj: THREE.Object3D | null = hit.object;
  while (obj) {
    if (SKIP_HIT.test(obj.name)) return true;
    obj = obj.parent;
  }
  const mesh = hit.object as THREE.Mesh;
  const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
  for (const mat of mats) {
    if (mat && SKIP_HIT.test(mat.name)) return true;
  }
  return false;
}

function posePad(scene: THREE.Object3D, box: THREE.Box3, def: PadDef): PadPose | null {
  const sx = box.max.x - box.min.x;
  const sy = box.max.y - box.min.y;
  const sz = box.max.z - box.min.z;
  const aim = new THREE.Vector3(box.min.x + def.f[0] * sx, box.min.y + def.f[1] * sy, box.min.z + def.f[2] * sz);
  const out = new THREE.Vector3(...def.out).normalize();
  const origin = aim.clone().addScaledVector(out, 3);
  const raycaster = new THREE.Raycaster(origin, out.clone().negate());
  const hits = raycaster.intersectObject(scene, true);
  const hit = hits.find((h) => h.face && !skipHit(h));
  if (!hit || !hit.face) return null;

  const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
  if (worldNormal.dot(out) < 0) worldNormal.negate();

  const position = hit.point.clone().addScaledVector(worldNormal, PAD_LIFT);
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), worldNormal);
  return {
    id: def.id,
    position: [position.x, position.y, position.z],
    quaternion: [quat.x, quat.y, quat.z, quat.w],
    size: def.size,
  };
}

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
  quaternion,
  size,
  onPick,
}: {
  spot?: SpotView;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  size: [number, number];
  onPick: (id: number) => void;
}) {
  const [hot, setHot] = useState(false);
  const logo = useLogoTexture(spot?.holder?.logoDataUrl);
  useCursor(hot);
  if (!spot) return null;
  const taken = Boolean(logo);

  return (
    <group position={position} quaternion={quaternion}>
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
          <meshBasicMaterial
            map={logo}
            toneMapped={false}
            side={THREE.FrontSide}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        ) : (
          <meshBasicMaterial
            color={hot ? "#e2ff4d" : "#3a3936"}
            transparent
            opacity={hot ? 0.88 : 0.72}
            depthWrite={false}
            side={THREE.FrontSide}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
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
  const [pads, setPads] = useState<PadPose[] | null>(null);
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
        if (n === "primary" || n.startsWith("primary.") || n.includes("putih") || n.includes("paint")) {
          std.map = null;
          std.color.set(PAINT);
          std.metalness = 0.22;
          std.roughness = 0.34;
          if ("clearcoat" in std) {
            (std as THREE.MeshPhysicalMaterial).clearcoat = 1;
            (std as THREE.MeshPhysicalMaterial).clearcoatRoughness = 0.07;
          }
          std.envMapIntensity = 1.3;
        }
      }
    });
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    setPads(PAD_DEFS.map((def) => posePad(scene, box, def)).filter((p): p is PadPose => p !== null));
  }, [scene]);

  return (
    <group>
      <primitive object={scene} />
      {pads?.map((pad) => (
        <SpotPad key={pad.id} spot={byId[pad.id]} position={pad.position} quaternion={pad.quaternion} size={pad.size} onPick={onPick} />
      ))}
    </group>
  );
}

function LockedOrbit() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(3.35, 1.45, -5.4);
    camera.lookAt(0, 0.7, 0);
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
      target={[0, 0.7, 0]}
      autoRotate
      autoRotateSpeed={0.28}
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
        camera={{ fov: 30, near: 0.4, far: 40, position: [3.35, 1.45, -5.4] }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      >
        <color attach="background" args={["#e8e6e0"]} />
        <hemisphereLight args={["#ffffff", "#e6e4de", 0.9]} />
        <directionalLight position={[4, 8, 6]} intensity={1.35} />
        <directionalLight position={[-3, 5, -4]} intensity={0.5} />
        <Suspense fallback={<Loader />}>
          <TeslaModel spots={spots} onPick={onPick} />
        </Suspense>
        <ContactShadows position={[0, 0, 0]} opacity={0.28} scale={8} blur={3} far={2.4} />
        <LockedOrbit />
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL);
