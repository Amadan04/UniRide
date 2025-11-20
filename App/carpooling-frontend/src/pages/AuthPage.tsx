import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../firebase';
import { Car, Mail, Lock, User, Calendar, Users, GraduationCap } from 'lucide-react';
import { fadeInUp } from '../animations/gsapAnimations';
import { pageTransition, scaleIn } from '../animations/motionVariants';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from '../context/ToastContext';

// Firebase error code to user-friendly message mapping
const getFirebaseErrorMessage = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
    'auth/weak-password': 'Password is too weak. Please use at least 8 characters with uppercase, lowercase, and numbers.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/popup-closed-by-user': 'Sign-in cancelled. Please try again.',
    'auth/cancelled-popup-request': 'Sign-in cancelled. Please try again.',
    'auth/popup-blocked': 'Popup blocked by browser. Please allow popups for this site.',
  };

  return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
};

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const [passwordError, setPasswordError] = useState('');
  const toast = useToast();

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
      const { user } = await signInWithEmailAndPassword(auth, formData.email, formData.password);

      // Check if email is verified
      if (!user.emailVerified) {
        await auth.signOut();
        const friendlyError = 'Please verify your email before signing in. Check your inbox for the verification link.';
        setError(friendlyError);
        toast.error(friendlyError);
        setLoading(false);
        return;
      }

      toast.success('Welcome back!');
      navigate('/');
    } else {
      // 🆕 SIGN UP
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      // Send email verification
      try {
        await sendEmailVerification(user);
        console.log("📧 Verification email sent to:", user.email);
      } catch (emailErr) {
        console.warn("⚠️ Failed to send verification email:", emailErr);
        // Continue with account creation even if email fails
      }

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

      // Sign out user until they verify email
      await auth.signOut();

      console.log("✅ Firestore user created successfully");
      toast.success('Account created! Please check your email to verify your account before signing in.');
      setError('Please verify your email before signing in. Check your inbox for the verification link.');
      setIsLogin(true); // Switch to login mode
    }
  } catch (err: any) {
    console.error("❌ Auth error:", err);
    const friendlyError = getFirebaseErrorMessage(err.code);
    setError(friendlyError);
    toast.error(friendlyError);
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
            {isLogin ? 'Welcome Back' : 'Join UniRide'}
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
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition appearance-none cursor-pointer"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%2367e8f9\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")',
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <option value="" className="bg-slate-800 text-white">Select Gender</option>
                    <option value="male" className="bg-slate-800 text-white">Male</option>
                    <option value="female" className="bg-slate-800 text-white">Female</option>
                    <option value="other" className="bg-slate-800 text-white">Other</option>
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
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition appearance-none cursor-pointer"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%2367e8f9\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")',
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <option value="rider" className="bg-slate-800 text-white">Rider</option>
                    <option value="driver" className="bg-slate-800 text-white">Driver</option>
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
