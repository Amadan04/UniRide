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
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [pendingRatingRide, setPendingRatingRide] = useState<Ride | null>(null);



  useEffect(() => {
    fetchRides();
  }, [userData]);

  // Check for pending ratings when completed rides load
  useEffect(() => {
    const checkPendingRatings = async () => {
      // Only show rating prompt for riders (passengers), not drivers
      if (!userData || completedRides.length === 0 || userData.role !== 'rider') return;

      // Find rides that haven't been rated yet
      const unratedRides = [];

      for (const ride of completedRides) {
        // Check if user has already rated this ride
        const ratingsRef = collection(db, 'ratings');
        const ratingQuery = query(
          ratingsRef,
          where('rideID', '==', ride.id),
          where('fromUserID', '==', userData.uid)
        );

        const ratingSnapshot = await getDocs(ratingQuery);

        if (ratingSnapshot.empty) {
          unratedRides.push(ride);
        }
      }

      // Show popup if there are unrated rides
      if (unratedRides.length > 0 && !showRatingPrompt) {
        setPendingRatingRide(unratedRides[0]); // Show first unrated ride
        setShowRatingPrompt(true);
      }
    };

    checkPendingRatings();
  }, [completedRides, userData]);

  // Auto-complete expired rides when page loads
  useEffect(() => {
    const autoCompleteExpiredRides = async () => {
      if (!userData) return;

      const now = new Date();
      const expiredRides = activeRides.filter(ride => {
        const rideDateTime = new Date(`${ride.date} ${ride.time}`);
        const hoursSinceRide = (now.getTime() - rideDateTime.getTime()) / (1000 * 60 * 60);
        return hoursSinceRide >= 2; // Complete if 2+ hours past ride time
      });

      if (expiredRides.length === 0) return;

      try {
        for (const ride of expiredRides) {
          await updateDoc(doc(db, 'rides', ride.id), {
            status: 'completed',
            completedAt: new Date().toISOString(),
            autoCompleted: true
          });
        }

        if (expiredRides.length > 0) {
          console.log(`Auto-completed ${expiredRides.length} expired rides`);
          fetchRides(); // Refresh the ride list
        }
      } catch (error) {
        console.error('Error auto-completing rides:', error);
      }
    };

    if (activeRides.length > 0) {
      autoCompleteExpiredRides();
    }
  }, [activeRides, userData]);

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
      // Find the ride to get driver info
      const ride = completedRides.find(r => r.id === rideId);
      if (!ride) {
        toast.error('Ride not found');
        return;
      }

      // Determine who to rate (if you're rider, rate driver; if you're driver, you'd need to select which rider)
      let toUserID: string;
      let toUserName: string;

      if (userData.role === 'rider') {
        // Rider rates the driver
        toUserID = ride.driverID;
        toUserName = ride.driverName;
      } else {
        // For drivers rating riders, you need UI to select which rider to rate
        // For now, we'll just show an error - this needs a proper UI update
        toast.error('Please select which passenger to rate from the ride details');
        return;
      }

      // Generate rating ID matching backend pattern
      const ratingID = `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const ratingData = {
        ratingID,
        rideID: rideId,
        fromUserID: userData.uid,
        fromUserName: userData.name,
        toUserID,
        toUserName,
        rating,
        comment: review,
        rideDate: ride.date,
        rideRoute: `${ride.pickup} → ${ride.destination}`,
        createdAt: new Date().toISOString(),
      };

      // Use the ratingID as document ID to match backend pattern
      await setDoc(doc(db, 'ratings', ratingID), ratingData);

      // Update the rated user's rating statistics
      const toUserRef = doc(db, 'users', toUserID);
      const toUserQuery = query(collection(db, 'users'), where('uid', '==', toUserID));
      const toUserSnapshot = await getDocs(toUserQuery);

      if (!toUserSnapshot.empty) {
        const toUserData = toUserSnapshot.docs[0].data();
        const currentAvgRating = toUserData.avgRating || 0;
        const currentRatingsCount = toUserData.ratingsCount || 0;

        const newRatingsCount = currentRatingsCount + 1;
        const newAvgRating = ((currentAvgRating * currentRatingsCount) + rating) / newRatingsCount;

        await updateDoc(toUserRef, {
          avgRating: parseFloat(newAvgRating.toFixed(2)),
          ratingsCount: newRatingsCount,
          updatedAt: new Date().toISOString()
        });
      }

      toast.success('Rating submitted successfully!');
      setRatingRide(null);
      setRating(5);
      setReview('');

      // Close the rating prompt modal if open
      setShowRatingPrompt(false);
      setPendingRatingRide(null);

      // Refresh rides to update any displayed ratings
      await fetchRides();
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

  const handleCancelBooking = async (rideId: string) => {
    if (!userData) return;
    if (!confirm('Are you sure you want to cancel this booking? You must cancel at least 2 hours before the ride.')) return;

    try {
      // Find the ride to get details
      const ride = activeRides.find(r => r.id === rideId);
      if (!ride) {
        toast.error('Ride not found');
        return;
      }

      // Check 2-hour cancellation window
      const rideDateTime = new Date(`${ride.date} ${ride.time}`);
      const now = new Date();
      const hoursUntilRide = (rideDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilRide < 2) {
        toast.error('Cancellations must be made at least 2 hours before ride time');
        return;
      }

      // Find the booking for this user and ride
      const bookingsRef = collection(db, 'bookings');
      const bookingQuery = query(
        bookingsRef,
        where('rideID', '==', rideId),
        where('riderID', '==', userData.uid),
        where('status', '==', 'active')
      );
      const bookingSnapshot = await getDocs(bookingQuery);

      if (bookingSnapshot.empty) {
        toast.error('No active booking found for this ride');
        return;
      }

      const bookingDoc = bookingSnapshot.docs[0];
      const bookingData = bookingDoc.data();

      // Update booking status to cancelled
      await updateDoc(doc(db, 'bookings', bookingDoc.id), {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Update ride: return seats and remove rider
      const rideRef = doc(db, 'rides', rideId);
      const rideDoc = await getDocs(query(collection(db, 'rides'), where('__name__', '==', rideId)));

      if (!rideDoc.empty) {
        const currentRideData = rideDoc.docs[0].data();
        const newSeatsAvailable = (currentRideData.seatsAvailable || 0) + (bookingData.seatsBooked || 1);
        const updatedPassengers = (currentRideData.passengers || []).filter((p: any) => p.uid !== userData.uid);
        const newStatus = currentRideData.status === 'full' ? 'active' : currentRideData.status;

        await updateDoc(rideRef, {
          seatsAvailable: newSeatsAvailable,
          passengers: updatedPassengers,
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
      }

      // Update user's total rides taken count
      const userRef = doc(db, 'users', userData.uid);
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', userData.uid)));

      if (!userDoc.empty) {
        const currentUserData = userDoc.docs[0].data();
        const newTotalRidesTaken = Math.max(0, (currentUserData.totalRidesTaken || 0) - 1);

        await updateDoc(userRef, {
          totalRidesTaken: newTotalRidesTaken,
          updatedAt: new Date().toISOString()
        });
      }

      toast.success('Booking cancelled successfully!');
      fetchRides();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking. Please try again.');
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

        {!isCompleted && userData?.role === 'rider' && (
          <motion.button
            onClick={() => handleCancelBooking(ride.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <XCircle className="w-5 h-5" />
            Cancel Booking
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

      {/* Rating Prompt Modal */}
      <AnimatePresence>
        {showRatingPrompt && pendingRatingRide && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="backdrop-blur-xl bg-gradient-to-br from-blue-900/90 to-purple-900/90 border border-cyan-400/50 rounded-2xl p-8 max-w-lg w-full shadow-2xl"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
                  <Star className="w-8 h-8 text-white fill-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Rate Your Ride!</h2>
                <p className="text-cyan-200">How was your recent trip?</p>
              </div>

              {/* Ride Info */}
              <div className="bg-white/10 border border-cyan-400/30 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-cyan-300 text-sm">Route</p>
                    <p className="text-white font-medium">
                      {pendingRatingRide.pickup} → {pendingRatingRide.destination}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-cyan-300 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{pendingRatingRide.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{pendingRatingRide.time}</span>
                  </div>
                </div>
              </div>

              {/* Rating Stars */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3 text-center">
                  Tap to rate your experience
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Star
                        className={`w-12 h-12 transition-all ${
                          star <= rating
                            ? 'text-yellow-400 fill-yellow-400 drop-shadow-lg'
                            : 'text-gray-400 hover:text-yellow-300'
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>
                <p className="text-center text-cyan-300 text-sm mt-2">
                  {rating === 5 && '⭐ Excellent!'}
                  {rating === 4 && '😊 Great'}
                  {rating === 3 && '👍 Good'}
                  {rating === 2 && '😐 Okay'}
                  {rating === 1 && '😞 Poor'}
                </p>
              </div>

              {/* Review (Optional) */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-2">
                  Comments <span className="text-cyan-300 text-sm font-normal">(Optional)</span>
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 focus:bg-white/15 resize-none transition"
                  rows={3}
                  placeholder="Share your experience..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={() => handleSubmitRating(pendingRatingRide.id)}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg shadow-lg"
                  whileHover={{ scale: 1.02, boxShadow: '0 10px 40px rgba(16, 185, 129, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  Submit Rating
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowRatingPrompt(false);
                    setPendingRatingRide(null);
                    setRating(5);
                    setReview('');
                  }}
                  className="px-6 py-3 bg-white/10 border border-cyan-400/30 text-cyan-300 font-semibold rounded-lg"
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  Skip
                </motion.button>
              </div>

              {/* Note */}
              <p className="text-center text-cyan-300/70 text-xs mt-4">
                💡 Your feedback helps build a safer community
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
