import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

const FloatingCar: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <boxGeometry args={[2, 0.8, 1]} />
      <meshStandardMaterial color="#22d3ee" metalness={0.8} roughness={0.2} />
      <mesh position={[0.6, -0.5, 0.4]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#0891b2" />
      </mesh>
      <mesh position={[-0.6, -0.5, 0.4]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#0891b2" />
      </mesh>
      <mesh position={[0.6, -0.5, -0.4]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#0891b2" />
      </mesh>
      <mesh position={[-0.6, -0.5, -0.4]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#0891b2" />
      </mesh>
    </mesh>
  );
};

const Particles: React.FC = () => {
  const particlesRef = useRef<THREE.Points>(null);

  const particleCount = 100;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 20;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.001;
      particlesRef.current.rotation.x += 0.0005;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#22d3ee" transparent opacity={0.6} />
    </points>
  );
};

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#22d3ee" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
        <spotLight position={[0, 10, 0]} intensity={1} color="#0891b2" />

        <FloatingCar />
        <Particles />

        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <motion.h1
          className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          style={{
            textShadow: '0 0 40px rgba(34, 211, 238, 0.6)',
          }}
        >
          UniCarpool
        </motion.h1>
        <motion.p
          className="text-xl md:text-2xl text-cyan-300"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          Ride Together, Save Together
        </motion.p>
      </div>
    </motion.div>
  );
};
