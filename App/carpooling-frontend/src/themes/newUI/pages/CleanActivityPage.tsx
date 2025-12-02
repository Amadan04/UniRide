import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { useUITheme } from '../../../context/UIThemeContext';
import { Calendar, MapPin, Clock, Star, ArrowLeft, MessageSquare, X, Users, Edit, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { updateUserStats } from '../../../services/scoreService';
import { CleanCard } from '../components/CleanCard';
import { CleanButton } from '../components/CleanButton';

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

export const CleanActivityPage: React.FC = () => {
  const { userData } = useAuth();
  const { isDark } = useUITheme();
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

  useEffect(() => {
    const checkPendingRatings = async () => {
      if (!userData || completedRides.length === 0 || userData.role !== 'rider') return;

      const unratedRides = [];

      for (const ride of completedRides) {
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

      if (unratedRides.length > 0 && !showRatingPrompt) {
        setPendingRatingRide(unratedRides[0]);
        setShowRatingPrompt(true);
      }
    };

    checkPendingRatings();
  }, [completedRides, userData]);

  useEffect(() => {
    const autoCompleteExpiredRides = async () => {
      if (!userData) return;

      const now = new Date();
      const expiredRides = activeRides.filter(ride => {
        const rideDateTime = new Date(`${ride.date} ${ride.time}`);
        const hoursSinceRide = (now.getTime() - rideDateTime.getTime()) / (1000 * 60 * 60);
        return hoursSinceRide >= 2;
      });

      if (expiredRides.length === 0) return;

      try {
        for (const ride of expiredRides) {
          await updateDoc(doc(db, 'rides', ride.id), {
            status: 'completed',
            completedAt: new Date().toISOString(),
            autoCompleted: true
          });

          try {
            await updateUserStats(ride.driverID);
          } catch (error) {
            console.error(`Error updating stats for driver ${ride.driverID}:`, error);
          }

          if (ride.passengers && ride.passengers.length > 0) {
            for (const passenger of ride.passengers) {
              try {
                await updateUserStats(passenger.uid);
              } catch (error) {
                console.error(`Error updating stats for passenger ${passenger.uid}:`, error);
              }
            }
          }
        }

        if (expiredRides.length > 0) {
          console.log(`Auto-completed ${expiredRides.length} expired rides and updated user stats`);
          fetchRides();
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
      const existingRatingQuery = query(
        collection(db, 'ratings'),
        where('rideID', '==', rideId),
        where('fromUserID', '==', userData.uid)
      );
      const existingRatingSnapshot = await getDocs(existingRatingQuery);

      if (!existingRatingSnapshot.empty) {
        toast.warning('You have already rated this ride!');
        setRatingRide(null);
        setShowRatingPrompt(false);
        setPendingRatingRide(null);
        return;
      }

      const ride = completedRides.find(r => r.id === rideId);
      if (!ride) {
        toast.error('Ride not found');
        return;
      }

      let toUserID: string;
      let toUserName: string;

      if (userData.role === 'rider') {
        toUserID = ride.driverID;
        toUserName = ride.driverName;
      } else {
        toast.error('Please select which passenger to rate from the ride details');
        return;
      }

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

      await setDoc(doc(db, 'ratings', ratingID), ratingData);

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

      setShowRatingPrompt(false);
      setPendingRatingRide(null);

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
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      await updateUserStats(selectedRide.driverID);

      if (selectedRide.passengers && selectedRide.passengers.length > 0) {
        for (const passenger of selectedRide.passengers) {
          try {
            await updateUserStats(passenger.uid);
          } catch (error) {
            console.error(`Error updating stats for passenger ${passenger.uid}:`, error);
          }
        }
      }

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
      const ride = activeRides.find(r => r.id === rideId);
      if (!ride) {
        toast.error('Ride not found');
        return;
      }

      const rideDateTime = new Date(`${ride.date} ${ride.time}`);
      const now = new Date();
      const hoursUntilRide = (rideDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilRide < 2) {
        toast.error('Cancellations must be made at least 2 hours before ride time');
        return;
      }

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

      await updateDoc(doc(db, 'bookings', bookingDoc.id), {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

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
    <CleanCard padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h3
          onClick={() => navigate(`/user-stats/${ride.driverID}`)}
          className={`text-xl font-bold hover:text-teal-600 cursor-pointer transition ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}
        >
          {ride.driverName}
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isCompleted
              ? 'bg-green-100 text-green-700'
              : 'bg-teal-100 text-teal-700'
          }`}
        >
          {isCompleted ? 'Completed' : 'Active'}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-2">
          <MapPin className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Route</p>
            <p className={isDark ? 'text-gray-100' : 'text-gray-900'}>
              {ride.pickup} → {ride.destination}
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{ride.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{ride.time}</span>
          </div>
        </div>

        <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          <span className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>${ride.cost}</span> per seat
        </div>
      </div>

      <div className="flex gap-2">
        {!isCompleted && (
          <CleanButton
            onClick={() => navigate(`/chat/${ride.id}`)}
            variant="secondary"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            Chat
          </CleanButton>
        )}

        {!isCompleted && userData?.role === 'driver' && (
          <CleanButton
            onClick={() => {
              setSelectedRide(ride);
              setEditCost(ride.cost.toString());
              setEditTime(ride.time);
              setShowManageModal(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Edit className="w-5 h-5" />
            Manage
          </CleanButton>
        )}

        {!isCompleted && userData?.role === 'rider' && (
          <CleanButton
            onClick={() => handleCancelBooking(ride.id)}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
          >
            <XCircle className="w-5 h-5" />
            Cancel Booking
          </CleanButton>
        )}

        {isCompleted && userData?.role === 'rider' && ratingRide !== ride.id && (
          <CleanButton
            onClick={() => setRatingRide(ride.id)}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            <Star className="w-5 h-5" />
            Rate Ride
          </CleanButton>
        )}
      </div>

      {ratingRide === ride.id && (
        <motion.div
          className={`mt-4 p-4 rounded-lg ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
          }`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className="mb-3">
            <label className={`block mb-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Rating</label>
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
                        : isDark ? 'text-gray-600' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className={`block mb-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Review (Optional)</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:border-teal-500 resize-none ${
                isDark
                  ? 'bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500'
                  : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
              rows={3}
              placeholder="Share your experience..."
            />
          </div>

          <div className="flex gap-2">
            <CleanButton
              onClick={() => handleSubmitRating(ride.id)}
              className="flex-1"
            >
              Submit
            </CleanButton>
            <button
              onClick={() => {
                setRatingRide(null);
                setRating(5);
                setReview('');
              }}
              className={`px-4 py-2 rounded-lg transition ${
                isDark
                  ? 'bg-gray-700 border border-gray-600 hover:bg-gray-600'
                  : 'bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </CleanCard>
  );

  return (
    <div className={`min-h-screen py-12 px-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <h1 className={`text-4xl font-bold mb-8 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>My Activity</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Active Rides</h2>
              {activeRides.length === 0 ? (
                <CleanCard padding="lg" className="text-center">
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No active rides</p>
                </CleanCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeRides.map((ride) => (
                    <RideCard key={ride.id} ride={ride} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Ride History</h2>
              {completedRides.length === 0 ? (
                <CleanCard padding="lg" className="text-center">
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No completed rides</p>
                </CleanCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedRides.map((ride) => (
                    <RideCard key={ride.id} ride={ride} isCompleted />
                  ))}
                </div>
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
              className={`rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-xl ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Manage Ride</h3>
                <button
                  onClick={() => {
                    setShowManageModal(false);
                    setEditMode(false);
                  }}
                  className={`transition ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className={`mb-4 p-4 rounded-lg ${
                isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-start gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Route</p>
                    <p className={isDark ? 'text-gray-100' : 'text-gray-900'}>{selectedRide.pickup} → {selectedRide.destination}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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

              <div className="mb-4">
                <h4 className={`font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  <Users className="w-5 h-5 text-teal-500" />
                  Passengers ({selectedRide.passengers?.length || 0})
                </h4>
                <div className="space-y-2">
                  {selectedRide.passengers && selectedRide.passengers.length > 0 ? (
                    selectedRide.passengers.map((passenger, index) => (
                      <div
                        key={passenger.uid}
                        onClick={() => {
                          setShowManageModal(false);
                          navigate(`/user-stats/${passenger.uid}`);
                        }}
                        className={`rounded-lg p-3 cursor-pointer transition ${
                          isDark
                            ? 'bg-gray-700 border border-gray-600 hover:bg-gray-600'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <p className={`text-sm hover:text-teal-600 transition ${
                          isDark ? 'text-gray-100' : 'text-gray-900'
                        }`}>{passenger.name}</p>
                      </div>
                    ))
                  ) : (
                    <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No passengers yet</p>
                  )}
                </div>
              </div>

              {editMode ? (
                <div className="space-y-3 mb-4">
                  <div>
                    <label className={`block text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Cost ($)</label>
                    <input
                      type="number"
                      value={editCost}
                      onChange={(e) => setEditCost(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:border-teal-500 ${
                        isDark
                          ? 'bg-gray-700 border border-gray-600 text-gray-100'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Time</label>
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:border-teal-500 ${
                        isDark
                          ? 'bg-gray-700 border border-gray-600 text-gray-100'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditRide}
                      className="flex-1 py-2 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className={`flex-1 py-2 rounded-lg font-semibold transition ${
                        isDark
                          ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <CleanButton
                    onClick={handleMarkComplete}
                    fullWidth
                    className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Mark Complete
                  </CleanButton>

                  <CleanButton
                    onClick={() => setEditMode(true)}
                    fullWidth
                    variant="secondary"
                    className="flex items-center justify-center gap-2"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Cost/Time
                  </CleanButton>

                  <CleanButton
                    onClick={handleCancelRide}
                    fullWidth
                    className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600"
                  >
                    <XCircle className="w-5 h-5" />
                    Cancel Ride
                  </CleanButton>
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
              className={`rounded-2xl p-8 max-w-lg w-full shadow-2xl ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
                  <Star className="w-8 h-8 text-white fill-white" />
                </div>
                <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Rate Your Ride!</h2>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>How was your recent trip?</p>
              </div>

              <div className={`rounded-xl p-4 mb-6 ${
                isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Route</p>
                    <p className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      {pendingRatingRide.pickup} → {pendingRatingRide.destination}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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

              <div className="mb-6">
                <label className={`block font-semibold mb-3 text-center ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
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
                            ? 'text-yellow-400 fill-yellow-400'
                            : isDark
                            ? 'text-gray-600 hover:text-yellow-300'
                            : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>
                <p className={`text-center text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {rating === 5 && 'Excellent!'}
                  {rating === 4 && 'Great'}
                  {rating === 3 && 'Good'}
                  {rating === 2 && 'Okay'}
                  {rating === 1 && 'Poor'}
                </p>
              </div>

              <div className="mb-6">
                <label className={`block font-semibold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Comments <span className={`text-sm font-normal ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>(Optional)</span>
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:border-teal-500 resize-none transition ${
                    isDark
                      ? 'bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500'
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                  rows={3}
                  placeholder="Share your experience..."
                />
              </div>

              <div className="flex gap-3">
                <CleanButton
                  onClick={() => handleSubmitRating(pendingRatingRide.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  Submit Rating
                </CleanButton>
                <button
                  onClick={() => {
                    setShowRatingPrompt(false);
                    setPendingRatingRide(null);
                    setRating(5);
                    setReview('');
                  }}
                  className={`px-6 py-3 font-semibold rounded-lg transition ${
                    isDark
                      ? 'bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Skip
                </button>
              </div>

              <p className={`text-center text-xs mt-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Your feedback helps build a safer community
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};