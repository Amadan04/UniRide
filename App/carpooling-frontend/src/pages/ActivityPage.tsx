import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Clock, Star, ArrowLeft, MessageSquare, X, Users, Edit, CheckCircle, XCircle } from 'lucide-react';
import { pageTransition, staggerContainer, scaleIn } from '../animations/motionVariants';
import { useToast } from '../context/ToastContext';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

interface Ride {
  id: string;
  driverID: string;
  driverName: string;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  cost: number;
  status: string;
  passengers?: { uid: string; name: string }[];
}

export const ActivityPage: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [activeRides, setActiveRides] = useState<Ride[]>([]);
  const [completedRides, setCompletedRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingRide, setRatingRide] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const toast = useToast();
  const [review, setReview] = useState('');
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editCost, setEditCost] = useState('');
  const [editTime, setEditTime] = useState('');

  

  useEffect(() => {
    fetchRides();
  }, [userData]);

  const fetchRides = async () => {
    if (!userData) return;

    try {
      const ridesRef = collection(db, 'rides');
      const active: Ride[] = [];
      const completed: Ride[] = [];

      if (userData.role === 'driver') {
        const q = query(ridesRef, where('driverID', '==', userData.uid));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
          const rideData = { id: doc.id, ...doc.data() } as Ride;
          if (rideData.status === 'active') {
            active.push(rideData);
          } else if (rideData.status === 'completed') {
            completed.push(rideData);
          }
        });
      } else {
        const allRidesSnapshot = await getDocs(ridesRef);

        allRidesSnapshot.forEach((doc) => {
          const rideData = { id: doc.id, ...doc.data() } as Ride;
          const isPassenger = rideData.passengers?.some((p) => p.uid === userData.uid);

          if (isPassenger) {
            if (rideData.status === 'active') {
              active.push(rideData);
            } else if (rideData.status === 'completed') {
              completed.push(rideData);
            }
          }
        });
      }

      setActiveRides(active);
      setCompletedRides(completed);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rides:', error);
      setLoading(false);
    }
  };

  const handleSubmitRating = async (rideId: string) => {
    if (!userData) return;

    try {
      const ratingData = {
        rideId,
        ratedBy: userData.uid,
        raterName: userData.name,
        rating,
        review,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(collection(db, 'ratings')), ratingData);

      toast.success('Rating submitted successfully!');
      setRatingRide(null);
      setRating(5);
      setReview('');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating. Please try again.');
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedRide) return;
    try {
      await updateDoc(doc(db, 'rides', selectedRide.id), {
        status: 'completed'
      });
      toast.success('Ride marked as complete!');
      setShowManageModal(false);
      fetchRides();
    } catch (error) {
      console.error('Error marking ride complete:', error);
      toast.error('Failed to mark ride complete');
    }
  };

  const handleEditRide = async () => {
    if (!selectedRide) return;
    try {
      const updates: any = {};
      if (editCost) updates.cost = parseFloat(editCost);
      if (editTime) updates.time = editTime;
      
      await updateDoc(doc(db, 'rides', selectedRide.id), updates);
      toast.success('Ride updated successfully!');
      setShowManageModal(false);
      setEditMode(false);
      fetchRides();
    } catch (error) {
      console.error('Error updating ride:', error);
      toast.error('Failed to update ride');
    }
  };

  const handleCancelRide = async () => {
    if (!selectedRide) return;
    if (!confirm('Are you sure you want to cancel this ride?')) return;
    
    try {
      await updateDoc(doc(db, 'rides', selectedRide.id), {
        status: 'cancelled'
      });
      toast.success('Ride cancelled successfully!');
      setShowManageModal(false);
      fetchRides();
    } catch (error) {
      console.error('Error cancelling ride:', error);
      toast.error('Failed to cancel ride');
    }
  };

  const RideCard: React.FC<{ ride: Ride; isCompleted?: boolean }> = ({ ride, isCompleted }) => (
    <motion.div
      className="backdrop-blur-xl bg-white/10 border border-cyan-400/30 rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">{ride.driverName}</h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isCompleted
              ? 'bg-green-500/20 text-green-400'
              : 'bg-cyan-500/20 text-cyan-400'
          }`}
        >
          {isCompleted ? 'Completed' : 'Active'}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-2">
          <MapPin className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-cyan-300/70">Route</p>
            <p className="text-white">
              {ride.pickup} → {ride.destination}
            </p>
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

        <div className="text-cyan-300">
          <span className="text-2xl font-bold text-white">${ride.cost}</span> per seat
        </div>
      </div>

      <div className="flex gap-2">
        {!isCompleted && (
          <motion.button
            onClick={() => navigate(`/chat/${ride.id}`)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MessageSquare className="w-5 h-5" />
            Chat
          </motion.button>
        )}

        {!isCompleted && userData?.role === 'driver' && (
          <motion.button
            onClick={() => {
              setSelectedRide(ride);
              setEditCost(ride.cost.toString());
              setEditTime(ride.time);
              setShowManageModal(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Edit className="w-5 h-5" />
            Manage
          </motion.button>
        )}

        {isCompleted && userData?.role === 'rider' && ratingRide !== ride.id && (
          <motion.button
            onClick={() => setRatingRide(ride.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Star className="w-5 h-5" />
            Rate Ride
          </motion.button>
        )}
      </div>

      {ratingRide === ride.id && (
        <motion.div
          className="mt-4 p-4 bg-white/5 border border-cyan-400/30 rounded-lg"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className="mb-3">
            <label className="block text-cyan-300 mb-2 text-sm">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-400'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-cyan-300 mb-2 text-sm">Review (Optional)</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 resize-none"
              rows={3}
              placeholder="Share your experience..."
            />
          </div>

          <div className="flex gap-2">
            <motion.button
              onClick={() => handleSubmitRating(ride.id)}
              className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Submit
            </motion.button>
            <motion.button
              onClick={() => {
                setRatingRide(null);
                setRating(5);
                setReview('');
              }}
              className="px-4 py-2 bg-white/5 border border-cyan-400/30 text-cyan-400 rounded-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 dark:from-slate-950 dark:to-blue-950 py-12 px-4"
      {...pageTransition}
    >
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <h1 className="text-4xl font-bold text-white mb-8">My Activity</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Active Rides</h2>
              {activeRides.length === 0 ? (
                <motion.div
                  className="text-center py-8 backdrop-blur-xl bg-white/5 border border-cyan-400/20 rounded-2xl"
                  {...scaleIn}
                >
                  <p className="text-cyan-300">No active rides</p>
                </motion.div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {activeRides.map((ride) => (
                    <RideCard key={ride.id} ride={ride} />
                  ))}
                </motion.div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Ride History</h2>
              {completedRides.length === 0 ? (
                <motion.div
                  className="text-center py-8 backdrop-blur-xl bg-white/5 border border-cyan-400/20 rounded-2xl"
                  {...scaleIn}
                >
                  <p className="text-cyan-300">No completed rides</p>
                </motion.div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {completedRides.map((ride) => (
                    <RideCard key={ride.id} ride={ride} isCompleted />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Manage Ride Modal */}
      <AnimatePresence>
        {showManageModal && selectedRide && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowManageModal(false);
              setEditMode(false);
            }}
          >
            <motion.div
              className="backdrop-blur-xl bg-white/10 border border-cyan-400/30 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">Manage Ride</h3>
                <button
                  onClick={() => {
                    setShowManageModal(false);
                    setEditMode(false);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Ride Details */}
              <div className="mb-4 p-4 bg-white/5 border border-cyan-400/20 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-cyan-300/70 text-sm">Route</p>
                    <p className="text-white">{selectedRide.pickup} → {selectedRide.destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-cyan-300 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{selectedRide.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{selectedRide.time}</span>
                  </div>
                </div>
              </div>

              {/* Passengers List */}
              <div className="mb-4">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Passengers ({selectedRide.passengers?.length || 0})
                </h4>
                <div className="space-y-2">
                  {selectedRide.passengers && selectedRide.passengers.length > 0 ? (
                    selectedRide.passengers.map((passenger, index) => (
                      <div
                        key={passenger.uid}
                        className="bg-white/5 border border-cyan-400/20 rounded-lg p-3"
                      >
                        <p className="text-white text-sm">{passenger.name}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-cyan-300/70 text-sm text-center py-4">No passengers yet</p>
                  )}
                </div>
              </div>

              {/* Edit Mode */}
              {editMode ? (
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-cyan-300 text-sm mb-1">Cost ($)</label>
                    <input
                      type="number"
                      value={editCost}
                      onChange={(e) => setEditCost(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-cyan-300 text-sm mb-1">Time</label>
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditRide}
                      className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:opacity-90 transition"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="flex-1 py-2 bg-white/10 text-cyan-300 rounded-lg font-semibold hover:bg-white/20 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <motion.button
                    onClick={handleMarkComplete}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:opacity-90 transition"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <CheckCircle className="w-5 h-5" />
                    Mark Complete
                  </motion.button>

                  <motion.button
                    onClick={() => setEditMode(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Edit className="w-5 h-5" />
                    Edit Cost/Time
                  </motion.button>

                  <motion.button
                    onClick={handleCancelRide}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-lg hover:opacity-90 transition"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <XCircle className="w-5 h-5" />
                    Cancel Ride
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
