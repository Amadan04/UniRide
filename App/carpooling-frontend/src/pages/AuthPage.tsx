import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../firebase';
import { Car, Mail, Lock, User, Calendar, Users, GraduationCap, Check, X, Loader2 } from 'lucide-react';
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

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });

  // Email validation state
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (!formData.email || !formData.password) {
      toast.error('Please enter your email and password');
      return;
    }

    setResendingEmail(true);

    try {
      // Sign in to get the user
      const { user } = await signInWithEmailAndPassword(auth, formData.email, formData.password);

      // Check if already verified
      await user.reload();
      if (user.emailVerified) {
        toast.success('Your email is already verified! You can now sign in.');
        setError('');
        await auth.signOut();
        setResendingEmail(false);
        return;
      }

      // Send new verification email with action URL
      const actionCodeSettings = {
        url: window.location.origin + '/auth',
        handleCodeInApp: false,
      };
      await sendEmailVerification(user, actionCodeSettings);
      toast.success('Verification email sent! Please check your inbox.');
      setError('A new verification link has been sent to your email.');

      // Sign out after sending
      await auth.signOut();
    } catch (err: any) {
      console.error('Resend verification error:', err);
      const friendlyError = getFirebaseErrorMessage(err.code);
      toast.error(friendlyError);
    } finally {
      setResendingEmail(false);
    }
  };

  // Update password validation when password changes
  useEffect(() => {
    if (!isLogin && formData.password) {
      setPasswordValidation({
        minLength: formData.password.length >= 8,
        hasUppercase: /[A-Z]/.test(formData.password),
        hasLowercase: /[a-z]/.test(formData.password),
        hasNumber: /\d/.test(formData.password),
      });
    }
  }, [formData.password, isLogin]);

  // Update email validation when email changes
  useEffect(() => {
    if (!isLogin && formData.email) {
      setEmailValid(validateEmail(formData.email));
    } else {
      setEmailValid(null);
    }
  }, [formData.email, isLogin]);

  useEffect(() => {
    if (formRef.current) {
      fadeInUp(formRef.current, 0.2);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  // Validate password for signup
  if (!isLogin && !passwordRegex.test(formData.password)) {
    toast.error('Please meet all password requirements');
    setLoading(false);
    return;
  }

  // Validate email for signup
  if (!isLogin && !emailValid) {
    toast.error('Please enter a valid email address');
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

      // Send email verification with action URL
      try {
        const actionCodeSettings = {
          url: window.location.origin + '/auth',
          handleCodeInApp: false,
        };
        await sendEmailVerification(user, actionCodeSettings);
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
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>

              {/* Show Resend button only if error is about email verification */}
              {isLogin && error.includes('verify your email') && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingEmail}
                  className="w-full mt-3 px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {resendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Resend Verification Email
                    </>
                  )}
                </button>
              )}
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

            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 transition ${
                    !isLogin && formData.email
                      ? emailValid
                        ? 'border-green-400/50'
                        : 'border-red-400/50'
                      : 'border-cyan-400/30'
                  }`}
                />
              </div>
              {!isLogin && formData.email && emailValid === false && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Please enter a valid email address
                </motion.p>
              )}
            </div>

            <div>
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
              </div>
              {!isLogin && formData.password && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 space-y-1"
                >
                  <p className="text-xs text-cyan-300 mb-1.5">Password requirements:</p>
                  <div className="grid grid-cols-2 gap-1">
                    <div className={`text-xs flex items-center gap-1.5 ${passwordValidation.minLength ? 'text-green-400' : 'text-gray-400'}`}>
                      {passwordValidation.minLength ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      <span>8+ characters</span>
                    </div>
                    <div className={`text-xs flex items-center gap-1.5 ${passwordValidation.hasUppercase ? 'text-green-400' : 'text-gray-400'}`}>
                      {passwordValidation.hasUppercase ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      <span>Uppercase letter</span>
                    </div>
                    <div className={`text-xs flex items-center gap-1.5 ${passwordValidation.hasLowercase ? 'text-green-400' : 'text-gray-400'}`}>
                      {passwordValidation.hasLowercase ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      <span>Lowercase letter</span>
                    </div>
                    <div className={`text-xs flex items-center gap-1.5 ${passwordValidation.hasNumber ? 'text-green-400' : 'text-gray-400'}`}>
                      {passwordValidation.hasNumber ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      <span>Number</span>
                    </div>
                  </div>
                </motion.div>
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
