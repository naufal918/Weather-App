import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";

function Sun() {
  const mesh = useRef();
  useFrame(() => (mesh.current.rotation.y += 0.003));
  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshStandardMaterial emissive="#FFD93D" emissiveIntensity={2} color="#FFDD55" />
    </mesh>
  );
}

function Cloud() {
  const mesh = useRef();
  useFrame(() => (mesh.current.position.x += 0.001));
  return (
    <mesh ref={mesh} position={[Math.random() * 8 - 4, Math.random() * 2, Math.random() * 2 - 1]}>
      <sphereGeometry args={[Math.random() * 0.8 + 0.5, 16, 16]} />
      <meshStandardMaterial color="#FFFFFF" transparent opacity={0.8} />
    </mesh>
  );
}

function Rain() {
  const drops = Array.from({ length: 300 });
  return (
    <group>
      {drops.map((_, i) => (
        <mesh
          key={i}
          position={[Math.random() * 10 - 5, Math.random() * 5, Math.random() * 10 - 5]}
        >
          <cylinderGeometry args={[0.02, 0.02, 0.4]} />
          <meshStandardMaterial color="#66ccff" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Lightning() {
  const mesh = useRef();
  useFrame(() => {
    mesh.current.material.emissiveIntensity = Math.random() > 0.97 ? 5 : 0;
  });
  return (
    <mesh ref={mesh} position={[0, 2, 0]}>
      <boxGeometry args={[0.2, 4, 0.2]} />
      <meshStandardMaterial emissive="#ffffff" emissiveIntensity={0} />
    </mesh>
  );
}

export default function WeatherScene({ condition = "clear" }) {
  const normalized = condition.toLowerCase();

  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 3]} intensity={1.5} />
        <Stars radius={50} depth={30} count={2000} factor={4} saturation={0} fade speed={1} />

        {normalized.includes("clear") && <Sun />}
        {normalized.includes("cloud") &&
          Array.from({ length: 6 }).map((_, i) => <Cloud key={i} />)}
        {normalized.includes("rain") && <Rain />}
        {normalized.includes("thunder") && (
          <>
            <Rain />
            <Lightning />
          </>
        )}

        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
