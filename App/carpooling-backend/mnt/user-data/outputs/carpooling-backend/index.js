/**
 * University Carpooling App - Backend Services Index
 * 
 * Central export file for all backend services.
 * Import from this file in your React Native app.
 * 
 * Usage:
 * import { createUser, loginUser, createRide, bookSeat } from './backend';
 */

// Firebase Configuration
export { default as app, auth, db, realtimeDb, storage, functions, COLLECTIONS, REALTIME_PATHS } from './services/firebase';

// Authentication Service
export {
  createUser,
  loginUser,
  logoutUser,
  resetPassword,
  getCurrentUser,
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  onAuthStateChange,
  updateFCMToken
} from './services/authService';

// Ride Service
export {
  createRide,
  getAvailableRides,
  getRideById,
  getMyRides,
  updateRideStatus,
  cancelRide,
  completeRide,
  searchRidesByLocation
} from './services/rideService';

// Booking Service
export {
  bookSeat,
  cancelBooking,
  getBookingById,
  getMyBookings,
  getRideBookings,
  completeBooking,
  getBookingStats,
  hasUserBookedRide
} from './services/bookingService';

// Rating Service
export {
  rateUser,
  getUserRatings,
  getRatingsGivenByUser,
  getRideRatings,
  canUserRate,
  getPendingRatings,
  getRatingStats,
  recalculateUserRating
} from './services/ratingService';

// Notification Service
export {
  NOTIFICATION_TYPES,
  createNotificationPayload,
  createEmailPayload,
  getNotificationPreferences
} from './services/notificationService';

// Location Service
export {
  updateDriverLocation,
  getDriverLocation,
  subscribeToLocationUpdates,
  stopLocationTracking,
  calculateDistanceToPickup,
  calculateETA,
  isDriverNearPickup
} from './services/locationService';

// Chat Service
export {
  sendMessage,
  sendSystemMessage,
  getChatMessages,
  subscribeToMessages,
  getUnreadCount,
  markMessagesAsRead,
  deleteMessage,
  getUserChats
} from './services/chatService';

/**
 * Quick Start Guide
 * 
 * 1. Configure Firebase:
 *    - Update services/firebase.js with your Firebase config
 * 
 * 2. Authentication Example:
 *    const user = await createUser({
 *      email: 'user@example.com',
 *      password: 'password123',
 *      name: 'John Doe',
 *      phone: '+1234567890',
 *      role: 'driver'
 *    });
 * 
 * 3. Create a Ride:
 *    const ride = await createRide({
 *      driverID: user.user.uid,
 *      pickup: 'University',
 *      destination: 'Mall',
 *      pickupLat: 40.7128,
 *      pickupLng: -74.0060,
 *      destinationLat: 40.7580,
 *      destinationLng: -73.9855,
 *      date: '2024-12-25',
 *      time: '14:30',
 *      totalSeats: 4,
 *      cost: 5
 *    });
 * 
 * 4. Book a Ride:
 *    const booking = await bookSeat(ride.ride.rideID, riderID, 2);
 * 
 * 5. Live Location:
 *    const unsubscribe = subscribeToLocationUpdates(rideID, (location) => {
 *      console.log('Driver at:', location.lat, location.lng);
 *    });
 * 
 * 6. Chat:
 *    await sendMessage(rideID, userID, 'On my way!');
 *    
 *    const unsubscribe = await subscribeToMessages(rideID, userID, (msg) => {
 *      console.log('New message:', msg.message.text);
 *    });
 */
