import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { Car, Mail, Lock, User, Calendar, Users, GraduationCap } from 'lucide-react';
import { fadeInUp } from '../animations/gsapAnimations';
import { pageTransition, scaleIn } from '../animations/motionVariants';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from '../context/ToastContext';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const [passwordError, setPasswordError] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    gender: '',
    university: '',
    role: 'rider' as 'rider' | 'driver',
  });

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  useEffect(() => {
    if (formRef.current) {
      fadeInUp(formRef.current, 0.2);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setPasswordError('');
  setLoading(true);

  // Validate password for signup
  if (!isLogin && !passwordRegex.test(formData.password)) {
    setPasswordError('Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number');
    toast.error('Invalid password format');
    setLoading(false);
    return;
  }

  try {
    if (isLogin) {
      // 🔐 LOGIN
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      toast.success('Welcome back!');
      navigate('/');
    } else {
      // 🆕 SIGN UP
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      // ✅ Firestore write with required fields
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,                        // 🔑 required by your rule
        email: user.email,                    // 🔑 must match auth token email
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        university: formData.university,
        role: formData.role,                  // "Driver" or "Rider"
        rating: 5.0,
        totalRatings: 0,
        createdAt: serverTimestamp(),         // cleaner Firestore timestamp
      });

      console.log("✅ Firestore user created successfully");
      toast.success('Account created successfully!');
      navigate('/');
    }
  } catch (err: any) {
    console.error("❌ Signup error:", err);
  setError(err.message || 'An error occurred');
  toast.error(err.message || 'Authentication failed');
  } finally {
    setLoading(false);
  }
};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
  if (e.target.name === 'password') {
    setPasswordError('');
  }
};

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900"
      {...pageTransition}
    >
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -1000],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        ref={formRef}
        className="relative z-10 w-full max-w-md mx-4"
        {...scaleIn}
      >
        <div className="backdrop-blur-xl bg-white/10 border border-cyan-400/30 rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <Car className="w-16 h-16 text-cyan-400" strokeWidth={1.5} />
          </div>

          <h2 className="text-3xl font-bold text-center text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Join UniCarpool'}
          </h2>
          <p className="text-cyan-300 text-center mb-6">
            {isLogin ? 'Sign in to continue' : 'Create your account'}
          </p>

          {error && (
            <motion.div
              className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 transition"
              />
              {!isLogin && passwordError && (
                <p className="text-red-400 text-sm mt-1">{passwordError}</p>
              )}
            </div>

            {!isLogin && (
              <>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <input
                    type="number"
                    name="age"
                    placeholder="Age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>

                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <input
                    type="text"
                    name="university"
                    placeholder="University"
                    value={formData.university}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>

                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition"
                  >
                    <option value="rider">Rider</option>
                    <option value="driver">Driver</option>
                  </select>
                </div>
              </>
            )}

            <motion.button
              type="submit"
              disabled={loading || (!isLogin && !passwordRegex.test(formData.password))}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-cyan-500/50 transition disabled:opacity-50"

              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-cyan-300 hover:text-cyan-400 transition"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
