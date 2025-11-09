import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import { fadeInUp, staggerContainer, glowButton } from '../animations/motionVariants';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const bgRef = useRef();
  const particlesRef = useRef([]);

  useEffect(() => {
    const particles = particlesRef.current;
    particles.forEach((particle, index) => {
      if (particle) {
        gsap.to(particle, {
          y: `+=${Math.random() * 100 - 50}`,
          x: `+=${Math.random() * 100 - 50}`,
          opacity: Math.random() * 0.5 + 0.3,
          duration: Math.random() * 4 + 3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: index * 0.1,
        });
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        navigate('/ride');
      } else {
        navigate('/ride');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div ref={bgRef} className="absolute inset-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            ref={(el) => (particlesRef.current[i] = el)}
            className="absolute rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20"
            style={{
              width: `${Math.random() * 100 + 20}px`,
              height: `${Math.random() * 100 + 20}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              filter: 'blur(40px)',
            }}
          />
        ))}
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12"
      >
        <motion.div
          variants={fadeInUp}
          className="w-full max-w-md"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8"
            style={{
              boxShadow: '0 0 60px rgba(59, 130, 246, 0.3)',
            }}
          >
            <motion.h1
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold text-center text-white mb-2"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {isLogin ? 'Welcome Back' : 'Join UniCarpool'}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center text-blue-200 mb-8"
            >
              {isLogin ? 'Sign in to continue your journey' : 'Create an account to get started'}
            </motion.p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={20} />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                    required={!isLogin}
                  />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={20} />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                  required
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="relative"
              >
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={20} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                  required
                />
              </motion.div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                variants={glowButton}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)',
                }}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                    <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
                  </>
                )}
              </motion.button>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-center"
            >
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-300 hover:text-white transition-colors"
              >
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <span className="font-semibold underline">
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </span>
              </button>
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center text-blue-200/70 text-sm"
          >
            By continuing, you agree to our Terms of Service and Privacy Policy
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
