import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Car, User, Activity, Moon, Sun, LogOut, X, Bot, Calendar, Palette } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useUITheme } from '../context/UIThemeContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { userData } = useAuth();
  const { theme, isDark, toggleTheme, toggleColorMode } = useUITheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Car, label: userData?.role === 'driver' ? 'Create Ride' : 'Join Ride', path: userData?.role === 'driver' ? '/ride-create' : '/rides' },
    { icon: Activity, label: 'Activity', path: '/activity' },
    { icon: Calendar, label: 'Class Schedule', path: '/schedule' },
    { icon: Bot, label: 'AI Assistant', path: '/ai-assistant' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  // Dynamic styles based on theme and color mode
  const getBackgroundStyle = () => {
    if (theme === 'clean') {
      return isDark
        ? 'bg-gray-900 border-gray-700'
        : 'bg-white border-gray-200';
    }
    return 'bg-gradient-to-b from-slate-900 to-blue-900 dark:from-slate-950 dark:to-blue-950 border-cyan-400/30';
  };

  const getTextColor = () => {
    if (theme === 'clean') {
      return isDark ? 'text-gray-100' : 'text-gray-900';
    }
    return 'text-white';
  };

  const getAccentColor = () => {
    if (theme === 'clean') {
      return 'text-teal-500';
    }
    return 'text-cyan-400';
  };

  const getHoverStyle = () => {
    if (theme === 'clean') {
      return isDark
        ? 'hover:bg-gray-800'
        : 'hover:bg-gray-100';
    }
    return 'hover:bg-cyan-400/20';
  };

  const getCardStyle = () => {
    if (theme === 'clean') {
      return isDark
        ? 'bg-gray-800 border-gray-700'
        : 'bg-gray-50 border-gray-200';
    }
    return 'bg-white/5 border-cyan-400/30';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={`fixed left-0 top-0 h-full w-80 border-r shadow-2xl z-50 overflow-y-auto ${getBackgroundStyle()}`}
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Car className={`w-8 h-8 ${getAccentColor()}`} />
                  <h2 className={`text-2xl font-bold ${getTextColor()}`}>UniRide</h2>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition ${getHoverStyle()}`}
                  aria-label="Close sidebar"
                >
                  <X className={`w-6 h-6 ${getAccentColor()}`} />
                </button>
              </div>

              {userData && (
                <div className={`mb-8 p-4 rounded-lg border ${getCardStyle()}`}>
                  <p className={`text-sm mb-1 ${theme === 'clean' ? (isDark ? 'text-gray-400' : 'text-gray-600') : 'text-cyan-300'}`}>
                    Signed in as
                  </p>
                  <p className={`font-semibold ${getTextColor()}`}>{userData.name}</p>
                  <p className={`text-sm capitalize mt-1 ${getAccentColor()}`}>{userData.role}</p>
                </div>
              )}

              <nav className="space-y-2">
                {menuItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition group ${getTextColor()} ${getHoverStyle()}`}
                    >
                      <item.icon className={`w-5 h-5 group-hover:scale-110 transition ${getAccentColor()}`} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </motion.div>
                ))}

                <motion.button
                  onClick={toggleColorMode}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition group ${getTextColor()} ${getHoverStyle()}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isDark ? (
                    <>
                      <Sun className={`w-5 h-5 group-hover:scale-110 transition ${getAccentColor()}`} />
                      <span className="font-medium">Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className={`w-5 h-5 group-hover:scale-110 transition ${getAccentColor()}`} />
                      <span className="font-medium">Dark Mode</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  onClick={toggleTheme}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition group ${getTextColor()} ${getHoverStyle()}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Palette className={`w-5 h-5 group-hover:scale-110 transition ${getAccentColor()}`} />
                  <span className="font-medium">
                    {theme === 'clean' ? 'Neon Theme' : 'Clean Theme'}
                  </span>
                </motion.button>

                <motion.button
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition group mt-4 ${
                    theme === 'clean'
                      ? (isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50')
                      : 'text-red-400 hover:bg-red-400/20'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-5 h-5 group-hover:scale-110 transition" />
                  <span className="font-medium">Logout</span>
                </motion.button>
              </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};