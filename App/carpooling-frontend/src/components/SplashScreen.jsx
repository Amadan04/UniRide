import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { Car } from 'lucide-react';

function AnimatedSphere() {
  const meshRef = useRef();

  useFrame((state) => {
    meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.3;
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
  });

  return (
    <Sphere ref={meshRef} args={[1, 100, 100]} scale={2.5}>
      <MeshDistortMaterial
        color="#3b82f6"
        attach="material"
        distort={0.5}
        speed={2}
        roughness={0.2}
        metalness={0.8}
      />
    </Sphere>
  );
}

function Particles() {
  const particlesRef = useRef();

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  const particles = Array.from({ length: 50 }, (_, i) => ({
    position: [
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
    ],
    scale: Math.random() * 0.1 + 0.05,
  }));

  return (
    <group ref={particlesRef}>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position}>
          <sphereGeometry args={[particle.scale, 8, 8]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export default function SplashScreen({ onComplete }) {
  const containerRef = useRef();
  const titleRef = useRef();

  useEffect(() => {
    gsap.fromTo(
      titleRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, delay: 0.5 }
    );

    gsap.to(titleRef.current, {
      textShadow: '0 0 30px rgba(59, 130, 246, 1), 0 0 60px rgba(139, 92, 246, 0.8)',
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    const timer = setTimeout(() => {
      gsap.to(containerRef.current, {
        opacity: 0,
        scale: 0.9,
        duration: 0.8,
        ease: 'power2.in',
        onComplete,
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#3b82f6" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
          <AnimatedSphere />
          <Particles />
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      <div className="relative z-10 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: 'backOut' }}
          className="mb-6 flex justify-center"
        >
          <div className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-6 shadow-2xl shadow-blue-500/50">
            <Car size={64} className="text-white" />
          </div>
        </motion.div>

        <h1
          ref={titleRef}
          className="text-6xl font-bold text-white"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          UniCarpool
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-4 text-xl text-blue-200"
        >
          Ride Together, Save Together
        </motion.p>
      </div>
    </motion.div>
  );
}
