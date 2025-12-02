import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../firebase';
import { useUITheme } from '../../../context/UIThemeContext';
import { CleanCard } from '../components/CleanCard';
import { CleanButton } from '../components/CleanButton';

export const CleanForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useUITheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (error: any) {
      console.error('Password reset error:', error);

      // Handle specific Firebase errors
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later');
          break;
        default:
          setError('Failed to send reset email. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <CleanCard className="max-w-md w-full text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-6"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>

          <h1 className={`text-3xl font-bold mb-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Check Your Email
          </h1>
          <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            We've sent a password reset link to{' '}
            <span className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{email}</span>
          </p>

          <div className={`rounded-lg p-4 mb-6 ${isDark ? 'bg-teal-900/20 border border-teal-700' : 'bg-teal-50 border border-teal-200'}`}>
            <p className={`text-sm ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
              💡 Didn't receive the email? Check your spam folder or try again in a few minutes.
            </p>
          </div>

          <CleanButton onClick={() => navigate('/auth')} className="w-full mb-3">
            Back to Login
          </CleanButton>

          <button
            onClick={() => {
              setSuccess(false);
              setEmail('');
            }}
            className={`text-sm transition ${isDark ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}
          >
            Send another email
          </button>
        </CleanCard>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <CleanCard className="max-w-md w-full">
        <button
          onClick={() => navigate('/auth')}
          className={`flex items-center gap-2 mb-6 transition ${isDark ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Login
        </button>

        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isDark ? 'bg-teal-900/30' : 'bg-teal-100'}`}>
            <Mail className={`w-8 h-8 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Reset Password
          </h1>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block mb-2 text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Email Address
            </label>
            <div className="relative">
              <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Enter your email"
                className={`w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition ${
                  isDark
                    ? 'bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-teal-500'
                    : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-teal-500'
                }`}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 p-3 rounded-lg ${
                isDark ? 'bg-red-900/20 border border-red-700 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          <CleanButton
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </CleanButton>
        </form>

        <div className="mt-6 text-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Remember your password?{' '}
            <button
              onClick={() => navigate('/auth')}
              className={`font-semibold transition ${isDark ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}
            >
              Sign In
            </button>
          </p>
        </div>
      </CleanCard>
    </div>
  );
};