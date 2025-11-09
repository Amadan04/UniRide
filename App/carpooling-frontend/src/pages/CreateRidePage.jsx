import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { MapPin, Calendar, Clock, Users, DollarSign, CheckCircle } from 'lucide-react';
import { fadeInUp, staggerContainer, glowButton } from '../animations/motionVariants';
import { successAnimation } from '../animations/gsapAnimations';
import AnimatedHeader from '../components/AnimatedHeader';

export default function CreateRidePage() {
  const [formData, setFormData] = useState({
    pickup: '',
    destination: '',
    date: '',
    time: '',
    totalSeats: '',
    cost: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const successRef = useRef();
  const particlesRef = useRef([]);

  useEffect(() => {
    const particles = particlesRef.current;
    particles.forEach((particle, index) => {
      if (particle) {
        gsap.to(particle, {
          y: `+=${Math.random() * 50 - 25}`,
          x: `+=${Math.random() * 50 - 25}`,
          opacity: Math.random() * 0.3 + 0.2,
          duration: Math.random() * 3 + 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: index * 0.15,
        });
      }
    });
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess(true);

      if (successRef.current) {
        successAnimation(successRef.current);
      }

      setTimeout(() => {
        navigate('/chat');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <AnimatedHeader />

      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            ref={(el) => (particlesRef.current[i] = el)}
            className="absolute rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-10"
            style={{
              width: `${Math.random() * 80 + 30}px`,
              height: `${Math.random() * 80 + 30}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              filter: 'blur(30px)',
            }}
          />
        ))}
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="relative z-10 container mx-auto px-4 pt-32 pb-16"
      >
        <motion.div
          variants={fadeInUp}
          className="max-w-2xl mx-auto"
        >
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-bold text-white mb-4 text-center"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Create Your Ride
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center text-blue-200 mb-12 text-lg"
          >
            Share your journey and split the costs
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8"
            style={{
              boxShadow: '0 0 60px rgba(59, 130, 246, 0.3)',
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400" size={22} />
                <input
                  type="text"
                  name="pickup"
                  placeholder="Pickup Location"
                  value={formData.pickup}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all backdrop-blur-sm"
                  required
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="relative"
              >
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400" size={22} />
                <input
                  type="text"
                  name="destination"
                  placeholder="Destination"
                  value={formData.destination}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all backdrop-blur-sm"
                  required
                />
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="relative"
                >
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={22} />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="relative"
                >
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={22} />
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
                    required
                  />
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="relative"
                >
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400" size={22} />
                  <input
                    type="number"
                    name="totalSeats"
                    placeholder="Available Seats"
                    min="1"
                    max="8"
                    value={formData.totalSeats}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all backdrop-blur-sm"
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="relative"
                >
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400" size={22} />
                  <input
                    type="number"
                    name="cost"
                    placeholder="Cost per Seat ($)"
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all backdrop-blur-sm"
                    required
                  />
                </motion.div>
              </div>

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
                disabled={loading || success}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
                style={{
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)',
                }}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                    <span>Creating Ride...</span>
                  </div>
                ) : success ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={24} />
                    <span>Ride Created!</span>
                  </div>
                ) : (
                  <span>Create Ride</span>
                )}
              </motion.button>
            </form>
          </motion.div>

          <AnimatePresence>
            {success && (
              <motion.div
                ref={successRef}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
              >
                <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-full p-8 shadow-2xl">
                  <CheckCircle size={100} className="text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
