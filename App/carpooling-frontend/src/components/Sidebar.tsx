import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Car, MessageSquare, User, Activity, Moon, Sun, LogOut, X, Bot, Calendar } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { userData } = useAuth();
  const { isDark, toggleTheme } = useTheme();
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
            className="fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-slate-900 to-blue-900 dark:from-slate-950 dark:to-blue-950 border-r border-cyan-400/30 shadow-2xl z-50 overflow-y-auto"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Car className="w-8 h-8 text-cyan-400" />
                  <h2 className="text-2xl font-bold text-white">UniCarpool</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                  aria-label="Close sidebar"
                >
                  <X className="w-6 h-6 text-cyan-400" />
                </button>
              </div>

              {userData && (
                <div className="mb-8 p-4 bg-white/5 rounded-lg border border-cyan-400/30">
                  <p className="text-cyan-300 text-sm mb-1">Signed in as</p>
                  <p className="text-white font-semibold">{userData.name}</p>
                  <p className="text-cyan-400 text-sm capitalize mt-1">{userData.role}</p>
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
                      className="flex items-center gap-3 px-4 py-3 text-white hover:bg-cyan-400/20 rounded-lg transition group"
                    >
                      <item.icon className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </motion.div>
                ))}

                <motion.button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-cyan-400/20 rounded-lg transition group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isDark ? (
                    <>
                      <Sun className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" />
                      <span className="font-medium">Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" />
                      <span className="font-medium">Dark Mode</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/20 rounded-lg transition group mt-4"
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
