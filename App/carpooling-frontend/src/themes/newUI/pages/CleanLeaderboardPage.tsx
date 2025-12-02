import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import {
  ArrowLeft,
  Trophy,
  Medal,
  Award,
  Leaf,
  TrendingUp,
  Crown
} from 'lucide-react';
import { UserStats, BADGES, getWeeklyStats } from '../../../services/scoreService';
import { CleanCard } from '../components/CleanCard';
import { CleanButton } from '../components/CleanButton';
import { useUITheme } from '../../../context/UIThemeContext';

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

export const CleanLeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useUITheme();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users: LeaderboardUser[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();

        const weeklyStats = await getWeeklyStats(userData.uid);

        users.push({
          uid: userData.uid,
          name: userData.name,
          role: userData.role || 'rider',
          stats: userData.stats,
          weeklyStats: {
            weeklyScore: userData.stats?.weeklyScore || 0,
            co2Saved: weeklyStats.co2Saved || 0
          }
        });
      }

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
        return <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400 fill-gray-400" />;
      case 3:
        return <Medal className="w-8 h-8 text-orange-500 fill-orange-500" />;
      default:
        return <div className="w-8 h-8 flex items-center justify-center text-teal-600 font-bold text-lg">{rank}</div>;
    }
  };

  const getRankColor = (rank: number, isDark: boolean) => {
    if (isDark) {
      switch (rank) {
        case 1:
          return 'bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 border-yellow-600/50';
        case 2:
          return 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-600/50';
        case 3:
          return 'bg-gradient-to-r from-orange-900/30 to-orange-800/30 border-orange-600/50';
        default:
          return 'bg-gray-800 border-gray-700';
      }
    } else {
      switch (rank) {
        case 1:
          return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300';
        case 2:
          return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300';
        case 3:
          return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300';
        default:
          return 'bg-white border-gray-200';
      }
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className={`${isDark ? 'text-gray-100' : 'text-gray-900'} text-xl`}>Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} py-8 px-4`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 ${isDark ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'} transition`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <CleanButton
            onClick={loadLeaderboard}
            variant="secondary"
          >
            Refresh
          </CleanButton>
        </div>

        {/* Title Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CleanCard padding="lg" className="mb-6">
            <div className="flex items-center gap-4">
              <Trophy className="w-12 h-12 text-yellow-500" />
              <div>
                <h1 className={`text-4xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-1`}>Weekly Leaderboard</h1>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Top 10 Carpoolers of the Week</p>
              </div>
            </div>
          </CleanCard>
        </motion.div>

        {/* Leaderboard List */}
        <div className="space-y-4">
          {leaderboard.length === 0 ? (
            <CleanCard padding="lg" className="text-center">
              <Trophy className={`w-16 h-16 ${isDark ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No leaderboard data available yet. Start carpooling to compete!</p>
            </CleanCard>
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
                  className={`${getRankColor(rank, isDark)} border rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all shadow-sm hover:shadow-md`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-12 flex items-center justify-center">
                      {getRankIcon(rank)}
                    </div>

                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`${isDark ? 'text-gray-100' : 'text-gray-900'} font-bold text-lg truncate`}>{user.name}</h3>
                      <div className={`flex items-center gap-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span className="capitalize">{user.role}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Leaf className="w-3 h-3 text-green-500" />
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
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} ml-1`}>+{userBadges.length - 5}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Weekly Score */}
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <span className="text-3xl font-bold text-green-600">
                          {user.weeklyStats?.weeklyScore || 0}
                        </span>
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Weekly Score</div>
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
        >
          <CleanCard padding="lg" className={`mt-6 ${isDark ? 'bg-teal-900/20 border-teal-800/50' : 'bg-teal-50 border-teal-200'}`}>
            <div className="flex items-start gap-3">
              <Award className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-teal-600'} flex-shrink-0 mt-0.5`} />
              <div className="text-sm">
                <p className={`font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>How Weekly Scores Work</p>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Weekly scores are calculated based on your carpooling activity in the last 7 days.
                  Create rides, join rides, save fuel, and reduce CO₂ emissions to climb the leaderboard!
                </p>
              </div>
            </div>
          </CleanCard>
        </motion.div>
      </div>
    </div>
  );
};