import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
  ArrowLeft,
  TrendingUp,
  Award,
  Car,
  Users,
  Fuel,
  Leaf,
  DollarSign,
  BarChart3,
  Star
} from 'lucide-react';
import { UserStats, getUserLevel, BADGES, updateUserStats } from '../services/scoreService';
import { pageTransition } from '../animations/motionVariants';

interface UserData {
  uid: string;
  name: string;
  email: string;
  role: 'driver' | 'rider';
  avgRating: number;
  stats?: UserStats;
}

export const UserStatsPage: React.FC = () => {
  const { userID } = useParams<{ userID: string }>();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userID) {
      loadUserData();
    }
  }, [userID]);

  const loadUserData = async () => {
    if (!userID) return;

    try {
      setLoading(true);

      // Get user data
      const userQuery = query(
        collection(db, 'users'),
        where('uid', '==', userID)
      );
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userData = {
          id: userSnapshot.docs[0].id,
          ...userSnapshot.docs[0].data()
        } as UserData;

        setUserData(userData);
      } else {
        console.error('User not found');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStats = async () => {
    if (!userID) return;

    try {
      setRefreshing(true);
      await updateUserStats(userID);
      await loadUserData();
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading user stats...</div>
      </div>
    );
  }

  if (!userData || !userData.stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">User not found or no stats available</p>
          <button
            onClick={() => navigate(-1)}
            className="text-cyan-400 hover:text-cyan-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const stats = userData.stats;
  const userLevel = getUserLevel(stats.score);
  const userBadges = BADGES.filter(badge => stats.badges.includes(badge.id));

  // Progress percentages
  const scoreProgress = stats.score;
  const distanceProgress = Math.min(100, (stats.totalDistanceKm / 50) * 100);
  const fuelProgress = Math.min(100, (stats.fuelSaved / 20) * 100);
  const co2Progress = Math.min(100, (stats.co2Saved / 50) * 100);

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900 to-gray-900 py-8 px-4"
      {...pageTransition}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <button
            onClick={handleRefreshStats}
            disabled={refreshing}
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-400/30 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Stats'}
          </button>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-lg border border-cyan-500/20 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
              {userData.name.charAt(0).toUpperCase()}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-1">{userData.name}</h1>
              <div className="flex items-center gap-4 text-cyan-300">
                <span className="capitalize">{userData.role}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span>{userData.avgRating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Score Badge */}
            <div className="text-center">
              <div className="text-5xl font-bold text-cyan-400 mb-1">{stats.score}</div>
              <div className="text-gray-400 text-sm">Carpool Score</div>
              <div className="mt-2 px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded-full text-cyan-300 text-xs font-semibold">
                {userLevel}
              </div>
            </div>
          </div>

          {/* Score Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Overall Progress</span>
              <span>{stats.score}/100</span>
            </div>
            <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${scoreProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Rides Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-lg border border-cyan-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Car className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Ride Activity</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Rides Joined</span>
                <span className="text-2xl font-bold text-white">{stats.ridesJoined}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Rides Created</span>
                <span className="text-2xl font-bold text-white">{stats.ridesCreated}</span>
              </div>
              {userData.role === 'driver' && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Passengers Carried</span>
                  <span className="text-2xl font-bold text-white">{stats.passengersCarried}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Weekly Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-lg border border-cyan-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">This Week</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Weekly Score</span>
                <span className="text-3xl font-bold text-green-400">{stats.weeklyScore}</span>
              </div>
              <div className="text-sm text-gray-400 mt-2">
                Keep it up! Your weekly performance contributes to your overall ranking.
              </div>
            </div>
          </motion.div>
        </div>

        {/* Environmental Impact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-lg border border-cyan-500/20 rounded-xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Leaf className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">Environmental Impact</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Distance */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-gray-400">Distance</span>
              </div>
              <div className="text-2xl font-bold text-white mb-2">
                {stats.totalDistanceKm.toFixed(1)} km
              </div>
              <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${distanceProgress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-cyan-500"
                />
              </div>
            </div>

            {/* Fuel Saved */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Fuel className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-gray-400">Fuel Saved</span>
              </div>
              <div className="text-2xl font-bold text-white mb-2">
                {stats.fuelSaved.toFixed(1)} L
              </div>
              <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${fuelProgress}%` }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="h-full bg-orange-500"
                />
              </div>
            </div>

            {/* CO₂ Saved */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">CO₂ Saved</span>
              </div>
              <div className="text-2xl font-bold text-white mb-2">
                {stats.co2Saved.toFixed(1)} kg
              </div>
              <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${co2Progress}%` }}
                  transition={{ duration: 1, delay: 0.7 }}
                  className="h-full bg-green-500"
                />
              </div>
            </div>

            {/* Money Saved */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-400">Money Saved</span>
              </div>
              <div className="text-2xl font-bold text-white mb-2">
                {stats.moneySaved.toFixed(2)} BHD
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Estimated savings
              </div>
            </div>
          </div>
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-lg border border-cyan-500/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Achievements</h2>
          </div>

          {userBadges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userBadges.map((badge) => (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{badge.icon}</div>
                    <div>
                      <h3 className="text-white font-semibold">{badge.name}</h3>
                      <p className="text-gray-400 text-xs">{badge.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No badges earned yet. Keep carpooling to unlock achievements!</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};