import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Menu, Car, Users, Trophy } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { pageTransition, buttonHover, buttonTap } from '../animations/motionVariants';
import { heroIntro, glowEffect } from '../animations/gsapAnimations';
import * as THREE from 'three';

const FloatingShapes: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    let animationId: number;
    const animate = () => {
      if (groupRef.current) {
        groupRef.current.rotation.y += 0.001;
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <group ref={groupRef}>
      {[...Array(15)].map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
          ]}
          rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
        >
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#22d3ee' : '#06b6d4'}
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      ))}
    </group>
  );
};

export const HomePage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, userData, loading } = useAuth();
  const navigate = useNavigate();
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      heroIntro(titleRef.current);
      glowEffect(titleRef.current);
    }
  }, []);

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/auth');
    }
  }, [currentUser, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900 dark:from-slate-950 dark:to-blue-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 to-blue-900 dark:from-slate-950 dark:to-blue-950"
      {...pageTransition}
    >
      <div className="absolute inset-0 opacity-30">
        <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} color="#22d3ee" />
          <FloatingShapes />
        </Canvas>
      </div>

      <motion.button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-6 left-6 z-30 p-3 bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/30 rounded-full hover:bg-cyan-500/30 transition"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-cyan-400" />
      </motion.button>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <Car className="w-24 h-24 text-cyan-400 mx-auto mb-6" />
          <h1
            ref={titleRef}
            className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4"
          >
            UniCarpool
          </h1>
          <p className="text-xl md:text-2xl text-cyan-300">
            {userData?.name ? `Welcome back, ${userData.name}!` : 'Ride Together, Save Together'}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {userData?.role === 'rider' && (
            <motion.button
              onClick={() => navigate('/rides')}
              className="group relative p-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-xl border-2 border-cyan-400/30 rounded-2xl hover:border-cyan-400 transition overflow-hidden"
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <Users className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Join a Ride</h3>
              <p className="text-cyan-300">Find and join available rides</p>
            </motion.button>
          )}

          {userData?.role === 'driver' && (
            <motion.button
              onClick={() => navigate('/ride-create')}
              className="group relative p-8 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border-2 border-blue-400/30 rounded-2xl hover:border-blue-400 transition overflow-hidden"
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <Car className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Create a Ride</h3>
              <p className="text-blue-300">Offer a ride to others</p>
            </motion.button>
          )}

          <motion.button
            onClick={() => navigate('/activity')}
            className="group relative p-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border-2 border-purple-400/30 rounded-2xl hover:border-purple-400 transition overflow-hidden"
            whileHover={buttonHover}
            whileTap={buttonTap}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Car className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-2">My Activity</h3>
            <p className="text-purple-300">View your ride history</p>
          </motion.button>

          <motion.button
            onClick={() => navigate('/leaderboard')}
            className="group relative p-8 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border-2 border-yellow-400/30 rounded-2xl hover:border-yellow-400 transition overflow-hidden"
            whileHover={buttonHover}
            whileTap={buttonTap}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/20 to-yellow-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-2">Leaderboard</h3>
            <p className="text-yellow-300">Top carpoolers this week</p>
          </motion.button>
        </motion.div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <p className="text-cyan-300/70 text-sm">
            {userData?.role === 'driver' ? '🚗 Driver Mode' : '🎒 Rider Mode'}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};
