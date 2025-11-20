import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, Clock, Users, DollarSign, Star, ArrowLeft, Filter, X, AlertCircle } from 'lucide-react';
import { pageTransition, scaleIn } from '../animations/motionVariants';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { checkRideConflict } from '../services/scheduleExtractor';


interface Ride {
  id?: string; // Firestore document ID
  driverID: string;
  driverName: string;
  driverRating: number;
  driverGender?: string;
  driverUniversity?: string;
  driverAge?: number;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  seatsAvailable: number;
  totalSeats?: number;
  cost: number;
  status: string;
  passengers?: { uid: string; name: string; joinedAt: string }[];
}

export const JoinRidePage: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const toast = useToast();
  const [filters, setFilters] = useState({
    destination: '',
    date: '',
    maxCost: '',
    gender: '',
    university: '',
    minRating: '',
    minSeats: '',
  });

  useEffect(() => {
    console.log('userData:', userData);
    if (userData?.uid) {
      console.log('Fetching rides for user:', userData.uid);
      fetchRides();
    } else {
      console.log('userData or uid not available yet');
    }
  }, [userData?.uid]);

  useEffect(() => {
    applyFilters();
  }, [filters, rides]);

  const fetchRides = async () => {
    try {
      console.log('Starting to fetch rides...');
      const ridesRef = collection(db, 'rides');
      const q = query(
        ridesRef,
        where('status', '==', 'active'),
        where('seatsAvailable', '>', 0)
      );
      const querySnapshot = await getDocs(q);
      console.log('Query snapshot size:', querySnapshot.size);

      const ridesData: Ride[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        console.log('Found ride:', { id: docSnapshot.id, driverID: data.driverID, currentUser: userData?.uid });
        if (data.driverID !== userData?.uid) {
          ridesData.push({ id: docSnapshot.id, ...data } as Ride);
        } else {
          console.log('Filtered out ride because user is the driver');
        }
      });

      console.log('Total rides after filtering:', ridesData.length);
      setRides(ridesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rides:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    console.log('Applying filters to rides:', rides.length);
    let filtered = [...rides];

    if (filters.destination) {
      filtered = filtered.filter((ride) =>
        ride.destination.toLowerCase().includes(filters.destination.toLowerCase())
      );
      console.log('After destination filter:', filtered.length);
    }

    if (filters.date) {
      filtered = filtered.filter((ride) => ride.date === filters.date);
      console.log('After date filter:', filtered.length);
    }

    if (filters.maxCost) {
      filtered = filtered.filter((ride) => ride.cost <= parseFloat(filters.maxCost));
      console.log('After cost filter:', filtered.length);
    }

    if (filters.gender) {
      filtered = filtered.filter((ride) => ride.driverGender === filters.gender);
      console.log('After gender filter:', filtered.length);
    }

    if (filters.university) {
      filtered = filtered.filter((ride) =>
        ride.driverUniversity?.toLowerCase().includes(filters.university.toLowerCase())
      );
      console.log('After university filter:', filtered.length);
    }

    if (filters.minRating) {
      filtered = filtered.filter((ride) => ride.driverRating >= parseFloat(filters.minRating));
      console.log('After rating filter:', filtered.length);
    }

    if (filters.minSeats) {
      filtered = filtered.filter((ride) => ride.seatsAvailable >= parseInt(filters.minSeats));
      console.log('After seats filter:', filtered.length);
    }

    console.log('Final filtered rides:', filtered.length);
    setFilteredRides(filtered);
  };

  const handleJoinRide = async (ride: Ride) => {
    if (!userData || !ride.id) return;

    try {
      console.log('=== JOIN RIDE DEBUG ===');
      console.log('Current ride data:', ride);
      console.log('User data:', userData);

      // Prevent duplicate joining
      if (ride.passengers?.some(p => p.uid === userData.uid)) {
        toast.warning('You have already joined this ride!');
        return;
      }

      // Check if seats are still available
      if (ride.seatsAvailable <= 0) {
        toast.warning('Sorry, this ride is now full!');
        return;
      }

      const rideRef = doc(db, 'rides', ride.id);

      // Get the current ride data to ensure we have the latest passengers array
      const currentPassengers = ride.passengers || [];
      const newPassenger = {
        uid: userData.uid,
        name: userData.name,
        joinedAt: new Date().toISOString(),
      };

      console.log('Current passengers:', currentPassengers);
      console.log('New passenger:', newPassenger);
      console.log('New passengers array:', [...currentPassengers, newPassenger]);
      console.log('New seatsAvailable:', ride.seatsAvailable - 1);

      // Update the ride document with explicit array
      await updateDoc(rideRef, {
        passengers: [...currentPassengers, newPassenger],
        seatsAvailable: ride.seatsAvailable - 1,
      });

      console.log('✅ Ride update successful!');

      // Optional: Create a booking record
      await addDoc(collection(db, 'bookings'), {
        rideId: ride.id,
        riderID: userData.uid,
        riderName: userData.name,
        driverID: ride.driverID,
        driverName: ride.driverName,
        pickup: ride.pickup,
        destination: ride.destination,
        date: ride.date,
        time: ride.time,
        cost: ride.cost,
        seatsBooked: 1,
        status: 'active',
        createdAt: new Date().toISOString(),
      });

      console.log('✅ Booking created successfully!');

      toast.success('Successfully joined the ride!');
      navigate(`/chat/${ride.id}`);
    } catch (error) {
      console.error('❌ Error joining ride:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast.error('Failed to join ride. Please try again.');
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 dark:from-slate-950 dark:to-blue-950 py-12 px-4"
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Filter Rides</h3>
              <button
                onClick={() => setFilters({
                  destination: '',
                  date: '',
                  maxCost: '',
                  gender: '',
                  university: '',
                  minRating: '',
                  minSeats: '',
                })}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-4">
              {/* Row 1: Location & Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-cyan-300 text-sm mb-2">Destination</label>
                  <input
                    type="text"
                    placeholder="Search destination..."
                    value={filters.destination}
                    onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-cyan-300 text-sm mb-2">Date</label>
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-cyan-300 text-sm mb-2">Max Cost ($)</label>
                  <input
                    type="number"
                    placeholder="Any"
                    value={filters.maxCost}
                    onChange={(e) => setFilters({ ...filters, maxCost: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Row 2: Driver Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-cyan-300 text-sm mb-2">Driver Gender</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="" className="bg-slate-900">Any</option>
                    <option value="male" className="bg-slate-900">Male</option>
                    <option value="female" className="bg-slate-900">Female</option>
                    <option value="other" className="bg-slate-900">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-cyan-300 text-sm mb-2">University</label>
                  <input
                    type="text"
                    placeholder="Search university..."
                    value={filters.university}
                    onChange={(e) => setFilters({ ...filters, university: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-cyan-300 text-sm mb-2">Min Rating</label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="" className="bg-slate-900">Any</option>
                    <option value="4.5" className="bg-slate-900">4.5+ ⭐</option>
                    <option value="4.0" className="bg-slate-900">4.0+ ⭐</option>
                    <option value="3.5" className="bg-slate-900">3.5+ ⭐</option>
                    <option value="3.0" className="bg-slate-900">3.0+ ⭐</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Additional Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-cyan-300 text-sm mb-2">Min Seats Available</label>
                  <select
                    value={filters.minSeats}
                    onChange={(e) => setFilters({ ...filters, minSeats: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="" className="bg-slate-900">Any</option>
                    <option value="1" className="bg-slate-900">1+ seat</option>
                    <option value="2" className="bg-slate-900">2+ seats</option>
                    <option value="3" className="bg-slate-900">3+ seats</option>
                    <option value="4" className="bg-slate-900">4+ seats</option>
                  </select>
                </div>
              </div>

              {/* Active Filters Display */}
              {(filters.destination || filters.date || filters.maxCost || filters.gender || filters.university || filters.minRating || filters.minSeats) && (
                <div className="pt-4 border-t border-cyan-400/20">
                  <p className="text-cyan-300 text-sm mb-2">Active Filters:</p>
                  <div className="flex flex-wrap gap-2">
                    {filters.destination && (
                      <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded-full text-cyan-300 text-xs">
                        To: {filters.destination}
                      </span>
                    )}
                    {filters.date && (
                      <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded-full text-cyan-300 text-xs">
                        Date: {filters.date}
                      </span>
                    )}
                    {filters.maxCost && (
                      <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded-full text-cyan-300 text-xs">
                        Max: ${filters.maxCost}
                      </span>
                    )}
                    {filters.gender && (
                      <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded-full text-cyan-300 text-xs capitalize">
                        Gender: {filters.gender}
                      </span>
                    )}
                    {filters.university && (
                      <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded-full text-cyan-300 text-xs">
                        Uni: {filters.university}
                      </span>
                    )}
                    {filters.minRating && (
                      <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded-full text-cyan-300 text-xs">
                        Rating: {filters.minRating}+
                      </span>
                    )}
                    {filters.minSeats && (
                      <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded-full text-cyan-300 text-xs">
                        Seats: {filters.minSeats}+
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <h1 className="text-4xl font-bold text-white mb-8">Available Rides</h1>

        {!userData || loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
          </div>
        ) : filteredRides.length === 0 ? (
          <motion.div
            className="text-center py-12 backdrop-blur-xl bg-white/5 border border-cyan-400/20 rounded-2xl"
            initial={scaleIn.initial}
            animate={scaleIn.animate}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Users className="w-16 h-16 text-cyan-400 mx-auto mb-4 opacity-50" />
            <p className="text-xl text-cyan-300">No rides available matching your criteria</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRides.map((ride, index) => {
              // Get day name from date (e.g., "2025-11-20" -> "wednesday")
              const rideDate = new Date(ride.date);
              const dayName = rideDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

              // Check schedule conflict
              const classSchedule = userData?.classSchedule || {};
              const conflictStatus = checkRideConflict(ride.time, dayName, classSchedule);

              // Get tag info
              const getTagInfo = () => {
                switch (conflictStatus) {
                  case 'conflicts':
                    return { label: 'Conflicts With Class', color: 'bg-red-500/20 border-red-500 text-red-300', icon: '🔴' };
                  case 'close':
                    return { label: 'Close to Class Time', color: 'bg-yellow-500/20 border-yellow-500 text-yellow-300', icon: '🟡' };
                  case 'between':
                    return { label: 'Between Classes', color: 'bg-yellow-500/20 border-yellow-500 text-yellow-300', icon: '🟡' };
                  case 'after':
                    return { label: 'After Classes', color: 'bg-green-500/20 border-green-500 text-green-300', icon: '🟢' };
                  default:
                    return null;
                }
              };

              const tagInfo = getTagInfo();

              return (
              <motion.div
                key={ride.id}
                className="backdrop-blur-xl bg-white/10 border border-cyan-400/30 rounded-2xl p-6 hover:border-cyan-400 transition"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                {/* Schedule Tag */}
                {tagInfo && (
                  <div className={`mb-3 px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${tagInfo.color}`}>
                    <span>{tagInfo.icon}</span>
                    <span>{tagInfo.label}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{ride.driverName}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-cyan-300 text-sm">{ride.driverRating.toFixed(1)}</span>
                      </div>
                      {ride.driverGender && (
                        <span className="text-cyan-300/70 text-xs capitalize">
                          {ride.driverGender === 'male' ? '♂' : ride.driverGender === 'female' ? '♀' : '⚧'} {ride.driverGender}
                        </span>
                      )}
                    </div>
                    {ride.driverUniversity && (
                      <p className="text-cyan-300/70 text-xs mt-1 truncate max-w-[200px]">
                        🎓 {ride.driverUniversity}
                      </p>
                    )}
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

                  <div 
                    className="flex items-center gap-2 text-cyan-300 cursor-pointer hover:text-cyan-400 transition"
                    onClick={() => {
                      setSelectedRide(ride);
                      setShowPassengerModal(true);
                    }}
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-sm">
                      {ride.seatsAvailable} {ride.seatsAvailable === 1 ? 'seat' : 'seats'} available
                    </span>
                  </div>
                </div>

                <motion.button
                  onClick={() => handleJoinRide(ride)}
                  disabled={ride.seatsAvailable <= 0}
                  className={`w-full py-3 font-semibold rounded-lg transition ${
                    ride.seatsAvailable <= 0
                      ? 'bg-gray-500/30 text-gray-400 cursor-not-allowed border border-gray-500/50'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/50'
                  }`}
                  whileHover={ride.seatsAvailable > 0 ? { scale: 1.02 } : {}}
                  whileTap={ride.seatsAvailable > 0 ? { scale: 0.98 } : {}}
                >
                  {ride.seatsAvailable <= 0 ? 'Ride Full' : 'Join Ride'}
                </motion.button>
              </motion.div>
            );
            })}
          </div>
        )}
      </div>
      {/* Passenger List Modal */}
      <AnimatePresence>
        {showPassengerModal && selectedRide && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPassengerModal(false)}
          >
            <motion.div
              className="backdrop-blur-xl bg-white/10 border border-cyan-400/30 rounded-2xl p-6 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">Passengers</h3>
                <button
                  onClick={() => setShowPassengerModal(false)}
                  className="text-cyan-400 hover:text-cyan-300 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3">
                {selectedRide.passengers && selectedRide.passengers.length > 0 ? (
                  selectedRide.passengers.map((passenger, index) => (
                    <motion.div
                      key={passenger.uid}
                      className="bg-white/5 border border-cyan-400/20 rounded-lg p-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">{passenger.name}</p>
                          <p className="text-cyan-300/70 text-sm">
                            Joined {new Date(passenger.joinedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <Users className="w-5 h-5 text-cyan-400" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-cyan-400/50 mx-auto mb-2" />
                    <p className="text-cyan-300/70">No passengers yet</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-cyan-400/20">
                <p className="text-cyan-300 text-sm text-center">
                  {selectedRide.seatsAvailable} {selectedRide.seatsAvailable === 1 ? 'seat' : 'seats'} remaining
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};