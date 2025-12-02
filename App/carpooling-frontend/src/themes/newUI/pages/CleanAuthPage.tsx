import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../../../firebase';
import { Car, Mail, Lock, User, Calendar, Users as UsersIcon, GraduationCap, Check, X, Loader2 } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from '../../../context/ToastContext';
import { useUITheme } from '../../../context/UIThemeContext';
import { CleanButton } from '../components/CleanButton';
import { CleanInput } from '../components/CleanInput';
import { CleanSelect } from '../components/CleanSelect';
import { CleanCard } from '../components/CleanCard';

const getFirebaseErrorMessage = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 8 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
  };
  return errorMessages[errorCode] || 'An error occurred. Please try again.';
};

export const CleanAuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const { isDark } = useUITheme();

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

  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });

  const [emailValid, setEmailValid] = useState<boolean | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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

  useEffect(() => {
    if (!isLogin && formData.email) {
      setEmailValid(validateEmail(formData.email));
    } else {
      setEmailValid(null);
    }
  }, [formData.email, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isLogin && !passwordRegex.test(formData.password)) {
      toast.error('Please meet all password requirements');
      setLoading(false);
      return;
    }

    if (!isLogin && !emailValid) {
      toast.error('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { user } = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        if (!user.emailVerified) {
          await auth.signOut();
          setError('Please verify your email before signing in.');
          toast.error('Please verify your email first');
          setLoading(false);
          return;
        }
        toast.success('Welcome back!');
        navigate('/');
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

        try {
          const actionCodeSettings = {
            url: window.location.origin + '/auth',
            handleCodeInApp: false,
          };
          await sendEmailVerification(user, actionCodeSettings);
        } catch (emailErr) {
          console.warn('Failed to send verification email:', emailErr);
        }

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          university: formData.university,
          role: formData.role,
          rating: 5.0,
          totalRatings: 0,
          createdAt: serverTimestamp(),
        });

        await auth.signOut();
        toast.success('Account created! Please verify your email.');
        setError('Check your email for verification link.');
        setIsLogin(true);
      }
    } catch (err: any) {
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
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-teal-50 to-teal-100'
    }`}>
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CleanCard padding="lg">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center">
              <Car className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className={`text-3xl font-bold text-center mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {isLogin ? 'Welcome Back' : 'Join UniRide'}
          </h2>
          <p className={`text-center mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {isLogin ? 'Sign in to continue' : 'Create your account'}
          </p>

          {/* Error Message */}
          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              isDark
                ? 'bg-red-900/20 border border-red-800 text-red-400'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <CleanInput
                type="text"
                name="name"
                label="Full Name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
                icon={<User className="w-5 h-5" />}
              />
            )}

            <CleanInput
              type="email"
              name="email"
              label="Email"
              placeholder="you@university.edu"
              value={formData.email}
              onChange={handleChange}
              required
              icon={<Mail className="w-5 h-5" />}
              error={!isLogin && formData.email && !emailValid ? 'Invalid email format' : undefined}
            />

            <div>
              <CleanInput
                type="password"
                name="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                icon={<Lock className="w-5 h-5" />}
              />
              {!isLogin && formData.password && (
                <div className="mt-2 space-y-1">
                  <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Password must have:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { key: 'minLength', label: '8+ characters' },
                      { key: 'hasUppercase', label: 'Uppercase' },
                      { key: 'hasLowercase', label: 'Lowercase' },
                      { key: 'hasNumber', label: 'Number' },
                    ].map((req) => (
                      <div
                        key={req.key}
                        className={`flex items-center gap-1.5 text-xs ${
                          passwordValidation[req.key as keyof typeof passwordValidation]
                            ? 'text-teal-600'
                            : (isDark ? 'text-gray-500' : 'text-gray-400')
                        }`}
                      >
                        {passwordValidation[req.key as keyof typeof passwordValidation] ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        <span>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className={`text-sm transition ${isDark ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {!isLogin && (
              <>
                <CleanInput
                  type="number"
                  name="age"
                  label="Age"
                  placeholder="18"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  icon={<Calendar className="w-5 h-5" />}
                />

                <CleanSelect
                  name="gender"
                  label="Gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  icon={<UsersIcon className="w-5 h-5" />}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                  placeholder="Select gender"
                />

                <CleanInput
                  type="text"
                  name="university"
                  label="University"
                  placeholder="Your University"
                  value={formData.university}
                  onChange={handleChange}
                  required
                  icon={<GraduationCap className="w-5 h-5" />}
                />

                <CleanSelect
                  name="role"
                  label="I want to"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  icon={<Car className="w-5 h-5" />}
                  options={[
                    { value: 'rider', label: 'Find Rides (Rider)' },
                    { value: 'driver', label: 'Offer Rides (Driver)' },
                  ]}
                />
              </>
            )}

            <CleanButton
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={loading || (!isLogin && !passwordRegex.test(formData.password))}
              loading={loading}
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </CleanButton>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className={`text-sm font-medium transition-colors ${
                isDark
                  ? 'text-teal-400 hover:text-teal-300'
                  : 'text-teal-600 hover:text-teal-700'
              }`}
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </CleanCard>
      </motion.div>
    </div>
  );
};