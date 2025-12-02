import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Car, Users, Activity, Trophy } from 'lucide-react';
import { Sidebar } from '../../../components/Sidebar';
import { useAuth } from '../../../context/AuthContext';
import { useUITheme } from '../../../context/UIThemeContext';
import { CleanCard } from '../components/CleanCard';

export const CleanHomePage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userData, loading } = useAuth();
  const { isDark } = useUITheme();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Menu Button */}
      <motion.button
        onClick={() => setSidebarOpen(true)}
        className={`fixed top-6 left-6 z-30 p-3 rounded-full transition shadow-sm ${
          isDark
            ? 'bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-teal-500'
            : 'bg-white border border-gray-200 hover:bg-gray-50 hover:border-teal-500'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Open menu"
      >
        <Menu className={`w-6 h-6 ${isDark ? 'text-gray-100' : 'text-gray-700'}`} />
      </motion.button>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative flex flex-col items-center justify-center min-h-screen px-4">
        {/* Title Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <Car className="w-24 h-24 text-teal-500 mx-auto mb-6" />
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500 mb-4">
            UniRide
          </h1>
          <p className={`text-xl md:text-2xl ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            {userData?.name ? `Welcome back, ${userData.name}!` : 'Ride Together, Save Together'}
          </p>
        </motion.div>

        {/* Action Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {userData?.role === 'rider' && (
            <CleanCard
              onClick={() => navigate('/rides')}
              hoverable
              padding="lg"
              className="cursor-pointer group"
            >
              <div className="flex flex-col items-center text-center">
                <Users className="w-16 h-16 text-cyan-500 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Join a Ride</h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Find and join available rides</p>
              </div>
            </CleanCard>
          )}

          {userData?.role === 'driver' && (
            <CleanCard
              onClick={() => navigate('/ride-create')}
              hoverable
              padding="lg"
              className="cursor-pointer group"
            >
              <div className="flex flex-col items-center text-center">
                <Car className="w-16 h-16 text-teal-500 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Create a Ride</h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Offer a ride to others</p>
              </div>
            </CleanCard>
          )}

          <CleanCard
            onClick={() => navigate('/activity')}
            hoverable
            padding="lg"
            className="cursor-pointer group"
          >
            <div className="flex flex-col items-center text-center">
              <Activity className="w-16 h-16 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>My Activity</h3>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>View your ride history</p>
            </div>
          </CleanCard>

          <CleanCard
            onClick={() => navigate('/leaderboard')}
            hoverable
            padding="lg"
            className="cursor-pointer group"
          >
            <div className="flex flex-col items-center text-center">
              <Trophy className="w-16 h-16 text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Leaderboard</h3>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Top carpoolers this week</p>
            </div>
          </CleanCard>
        </motion.div>

        {/* Role Badge */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm shadow-sm ${
            isDark
              ? 'bg-gray-800 border border-gray-700 text-gray-300'
              : 'bg-white border border-gray-200 text-gray-600'
          }`}>
            {userData?.role === 'driver' ? '🚗 Driver Mode' : '🎒 Rider Mode'}
          </span>
        </motion.div>
      </div>
    </div>
  );
};