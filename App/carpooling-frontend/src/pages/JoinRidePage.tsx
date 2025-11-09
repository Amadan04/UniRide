import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, Clock, Users, DollarSign, Star, ArrowLeft, Filter } from 'lucide-react';
import { pageTransition, staggerContainer, scaleIn } from '../animations/motionVariants';

interface Ride {
  id: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  availableSeats: number;
  cost: number;
  status: string;
}

export const JoinRidePage: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    destination: '',
    date: '',
    maxCost: '',
  });

  useEffect(() => {
    fetchRides();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, rides]);

  const fetchRides = async () => {
    try {
      const ridesRef = collection(db, 'rides');
      const q = query(ridesRef, where('status', '==', 'active'), where('availableSeats', '>', 0));
      const querySnapshot = await getDocs(q);

      const ridesData: Ride[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.driverId !== userData?.uid) {
          ridesData.push({ id: doc.id, ...data } as Ride);
        }
      });

      setRides(ridesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rides:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rides];

    if (filters.destination) {
      filtered = filtered.filter((ride) =>
        ride.destination.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }

    if (filters.date) {
      filtered = filtered.filter((ride) => ride.date === filters.date);
    }

    if (filters.maxCost) {
      filtered = filtered.filter((ride) => ride.cost <= parseFloat(filters.maxCost));
    }

    setFilteredRides(filtered);
  };

  const handleJoinRide = async (rideId: string) => {
    if (!userData) return;

    try {
      const rideRef = doc(db, 'rides', rideId);
      await updateDoc(rideRef, {
        passengers: arrayUnion({
          uid: userData.uid,
          name: userData.name,
          joinedAt: new Date().toISOString(),
        }),
        availableSeats: filteredRides.find((r) => r.id === rideId)!.availableSeats - 1,
      });

      alert('Successfully joined the ride!');
      navigate(`/chat/${rideId}`);
    } catch (error) {
      console.error('Error joining ride:', error);
      alert('Failed to join ride. Please try again.');
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 dark:from-slate-950 dark:to-blue-950 py-12 px-4"
      {...pageTransition}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-400/30 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {showFilters && (
          <motion.div
            className="backdrop-blur-xl bg-white/10 border border-cyan-400/30 rounded-2xl p-6 mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 className="text-xl font-bold text-white mb-4">Filter Rides</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Destination"
                value={filters.destination}
                onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
                className="px-4 py-2 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400"
              />
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="px-4 py-2 bg-white/5 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              />
              <input
                type="number"
                placeholder="Max Cost"
                value={filters.maxCost}
                onChange={(e) => setFilters({ ...filters, maxCost: e.target.value })}
                className="px-4 py-2 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </motion.div>
        )}

        <h1 className="text-4xl font-bold text-white mb-8">Available Rides</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
          </div>
        ) : filteredRides.length === 0 ? (
          <motion.div
            className="text-center py-12 backdrop-blur-xl bg-white/5 border border-cyan-400/20 rounded-2xl"
            {...scaleIn}
          >
            <Users className="w-16 h-16 text-cyan-400 mx-auto mb-4 opacity-50" />
            <p className="text-xl text-cyan-300">No rides available matching your criteria</p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {filteredRides.map((ride, index) => (
              <motion.div
                key={ride.id}
                className="backdrop-blur-xl bg-white/10 border border-cyan-400/30 rounded-2xl p-6 hover:border-cyan-400 transition"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{ride.driverName}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-cyan-300 text-sm">{ride.driverRating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-cyan-400">${ride.cost}</div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2 text-cyan-300">
                    <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-cyan-300/70">From</p>
                      <p className="text-white">{ride.pickup}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-cyan-300">
                    <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-cyan-300/70">To</p>
                      <p className="text-white">{ride.destination}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-cyan-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{ride.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{ride.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-cyan-300">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{ride.availableSeats} seats available</span>
                  </div>
                </div>

                <motion.button
                  onClick={() => handleJoinRide(ride.id)}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Join Ride
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
