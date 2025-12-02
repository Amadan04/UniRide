import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
  ArrowLeft,
  Trophy,
  Medal,
  Award,
  Leaf,
  TrendingUp,
  Crown
} from 'lucide-react';
import { UserStats, BADGES, getWeeklyStats } from '../services/scoreService';
import { pageTransition } from '../animations/motionVariants';

interface LeaderboardUser {
  uid: string;
  name: string;
  role: 'driver' | 'rider';
  stats?: UserStats;
  weeklyStats?: {
    weeklyScore: number;
    co2Saved: number;
  };
}

export const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      // Get all users
      const usersSnapshot = await getDocs(collection(db, 'users'));

      // Calculate weekly stats for all users in parallel (much faster!)
      const userPromises = usersSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();

        // Get weekly stats in parallel
        const weeklyStats = await getWeeklyStats(userData.uid);

        return {
          uid: userData.uid,
          name: userData.name,
          role: userData.role || 'rider',
          stats: userData.stats,
          weeklyStats: {
            weeklyScore: userData.stats?.weeklyScore || 0,
            co2Saved: weeklyStats.co2Saved || 0
          }
        };
      });

      const users = await Promise.all(userPromises);

      // Sort by weekly score (descending) and take top 10
      const sortedUsers = users
        .sort((a, b) => (b.weeklyStats?.weeklyScore || 0) - (a.weeklyStats?.weeklyScore || 0))
        .slice(0, 10);

      setLeaderboard(sortedUsers);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-300 fill-gray-300" />;
      case 3:
        return <Medal className="w-8 h-8 text-orange-400 fill-orange-400" />;
      default:
        return <div className="w-8 h-8 flex items-center justify-center text-cyan-300 font-bold text-lg">{rank}</div>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-500/20 to-yellow-600/20 border-yellow-400/50 shadow-yellow-500/30';
      case 2:
        return 'from-gray-300/20 to-gray-400/20 border-gray-300/50 shadow-gray-300/30';
      case 3:
        return 'from-orange-500/20 to-orange-600/20 border-orange-400/50 shadow-orange-500/30';
      default:
        return 'from-cyan-500/10 to-blue-500/10 border-cyan-400/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading leaderboard...</div>
      </div>
    );
  }

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
            onClick={loadLeaderboard}
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-400/30 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition"
          >
            Refresh
          </button>
        </div>



        {/* Title Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-lg border border-cyan-500/20 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-4">
            <Trophy className="w-12 h-12 text-yellow-400" />
            <div>
              <h1 className="text-4xl font-bold text-white mb-1">Weekly Leaderboard</h1>
              <p className="text-cyan-300">Top 10 Carpoolers of the Week</p>
            </div>
          </div>
        </motion.div>

        {/* Leaderboard List */}
        <div className="space-y-4">
          {leaderboard.length === 0 ? (
            <div className="bg-gray-800/50 backdrop-blur-lg border border-cyan-500/20 rounded-xl p-8 text-center">
              <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No leaderboard data available yet. Start carpooling to compete!</p>
            </div>
          ) : (
            leaderboard.map((user, index) => {
              const rank = index + 1;
              const userBadges = BADGES.filter(badge => user.stats?.badges.includes(badge.id) || false);

              return (
                <motion.div
                  key={user.uid}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/user-stats/${user.uid}`)}
                  className={`bg-gradient-to-r ${getRankColor(rank)} backdrop-blur-lg border rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all ${
                    rank <= 3 ? 'shadow-lg' : ''
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-12 flex items-center justify-center">
                      {getRankIcon(rank)}
                    </div>

                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-lg truncate">{user.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-cyan-300">
                        <span className="capitalize">{user.role}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Leaf className="w-3 h-3 text-green-400" />
                          <span>{user.weeklyStats?.co2Saved?.toFixed(1) || 0} kg CO₂ saved</span>
                        </div>
                      </div>

                      {/* Badges */}
                      {userBadges.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          {userBadges.slice(0, 5).map((badge) => (
                            <div
                              key={badge.id}
                              className="text-xl"
                              title={badge.name}
                            >
                              {badge.icon}
                            </div>
                          ))}
                          {userBadges.length > 5 && (
                            <span className="text-xs text-cyan-300 ml-1">+{userBadges.length - 5}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Weekly Score */}
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        <span className="text-3xl font-bold text-green-400">
                          {user.weeklyStats?.weeklyScore || 0}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">Weekly Score</div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-xl p-4 mt-6"
        >
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-cyan-300">
              <p className="font-semibold mb-1">How Weekly Scores Work</p>
              <p className="text-cyan-300/80">
                Weekly scores are calculated based on your carpooling activity in the last 7 days.
                Create rides, join rides, save fuel, and reduce CO₂ emissions to climb the leaderboard!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};