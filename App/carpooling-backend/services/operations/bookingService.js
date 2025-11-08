/**
 * Booking Service
 * 
 * Handles all booking operations including creating bookings, cancelling bookings,
 * and managing seat availability.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  runTransaction
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';

/**
 * Generate a unique booking ID
 * @returns {string} Unique booking ID
 */
const generateBookingId = () => {
  return `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Book seats in a ride
 * @param {string} rideID - Ride ID
 * @param {string} riderID - Rider's user ID
 * @param {number} seatsBooked - Number of seats to book (default: 1)
 * @returns {Promise<Object>} Booking details
 */
export const bookSeat = async (rideID, riderID, seatsBooked = 1) => {
  try {
    // Validate inputs
    if (!rideID || !riderID) {
      throw new Error('Ride ID and Rider ID are required');
    }

    if (seatsBooked < 1 || seatsBooked > 4) {
      throw new Error('You can book between 1 and 4 seats');
    }

    // Verify rider exists
    const riderDoc = await getDoc(doc(db, COLLECTIONS.USERS, riderID));
    if (!riderDoc.exists()) {
      throw new Error('Rider not found');
    }

    const riderData = riderDoc.data();

    // Use a transaction to ensure atomic updates
    const bookingID = generateBookingId();
    
    const result = await runTransaction(db, async (transaction) => {
      // Get ride document
      const rideRef = doc(db, COLLECTIONS.RIDES, rideID);
      const rideDoc = await transaction.get(rideRef);

      if (!rideDoc.exists()) {
        throw new Error('Ride not found');
      }

      const rideData = rideDoc.data();

      // Validate ride is bookable
      if (rideData.status === 'cancelled') {
        throw new Error('This ride has been cancelled');
      }

      if (rideData.status === 'completed') {
        throw new Error('This ride has already been completed');
      }

      if (rideData.status === 'full') {
        throw new Error('This ride is full');
      }

      // Check if rider is the driver
      if (rideData.driverID === riderID) {
        throw new Error('You cannot book your own ride');
      }

      // Check if rider has already booked this ride
      if (rideData.riders.includes(riderID)) {
        throw new Error('You have already booked this ride');
      }

      // Check if enough seats available
      if (rideData.seatsAvailable < seatsBooked) {
        throw new Error(`Only ${rideData.seatsAvailable} seat(s) available`);
      }

      // Check if ride is in the past
      const rideDateTime = rideData.rideDateTime.toDate();
      if (rideDateTime <= new Date()) {
        throw new Error('Cannot book a ride that has already started');
      }

      // Create booking document
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingID);
      const bookingData = {
        bookingID,
        rideID,
        riderID,
        riderName: riderData.name,
        riderPhone: riderData.phone,
        riderProfilePic: riderData.profilePic || '',
        driverID: rideData.driverID,
        pickup: rideData.pickup,
        destination: rideData.destination,
        date: rideData.date,
        time: rideData.time,
        seatsBooked,
        costPerSeat: rideData.cost,
        totalCost: rideData.cost * seatsBooked,
        status: 'active', // active, cancelled, completed
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      transaction.set(bookingRef, bookingData);

      // Update ride: decrement seats, add rider
      const newSeatsAvailable = rideData.seatsAvailable - seatsBooked;
      const newStatus = newSeatsAvailable === 0 ? 'full' : 'active';

      transaction.update(rideRef, {
        seatsAvailable: newSeatsAvailable,
        riders: arrayUnion(riderID),
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Update rider's total rides taken count
      const riderRef = doc(db, COLLECTIONS.USERS, riderID);
      transaction.update(riderRef, {
        totalRidesTaken: increment(1),
        updatedAt: serverTimestamp()
      });

      return {
        booking: bookingData,
        newSeatsAvailable,
        rideFull: newSeatsAvailable === 0
      };
    });

    return {
      success: true,
      booking: result.booking,
      message: 'Booking confirmed successfully',
      rideFull: result.rideFull
    };
  } catch (error) {
    console.error('Error booking seat:', error);
    throw new Error(error.message || 'Failed to book seat');
  }
};

/**
 * Cancel a booking
 * @param {string} bookingID - Booking ID
 * @param {string} riderID - Rider's user ID (for authorization)
 * @returns {Promise<Object>} Cancellation result
 */
export const cancelBooking = async (bookingID, riderID) => {
  try {
    // Validate inputs
    if (!bookingID || !riderID) {
      throw new Error('Booking ID and Rider ID are required');
    }

    // Use a transaction to ensure atomic updates
    const result = await runTransaction(db, async (transaction) => {
      // Get booking document
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingID);
      const bookingDoc = await transaction.get(bookingRef);

      if (!bookingDoc.exists()) {
        throw new Error('Booking not found');
      }

      const bookingData = bookingDoc.data();

      // Verify the user is the one who made the booking
      if (bookingData.riderID !== riderID) {
        throw new Error('You can only cancel your own bookings');
      }

      // Check if booking is already cancelled
      if (bookingData.status === 'cancelled') {
        throw new Error('Booking is already cancelled');
      }

      // Check if booking is completed
      if (bookingData.status === 'completed') {
        throw new Error('Cannot cancel a completed booking');
      }

      // Get ride document
      const rideRef = doc(db, COLLECTIONS.RIDES, bookingData.rideID);
      const rideDoc = await transaction.get(rideRef);

      if (!rideDoc.exists()) {
        throw new Error('Associated ride not found');
      }

      const rideData = rideDoc.data();

      // Check if ride has already been completed or cancelled
      if (rideData.status === 'completed') {
        throw new Error('Cannot cancel booking for a completed ride');
      }

      // Calculate cancellation window (e.g., must cancel at least 2 hours before)
      const rideDateTime = rideData.rideDateTime.toDate();
      const now = new Date();
      const hoursUntilRide = (rideDateTime - now) / (1000 * 60 * 60);

      if (hoursUntilRide < 2) {
        throw new Error('Cancellations must be made at least 2 hours before ride time');
      }

      // Update booking status
      transaction.update(bookingRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update ride: increment seats, remove rider, update status if was full
      const newSeatsAvailable = rideData.seatsAvailable + bookingData.seatsBooked;
      const newStatus = rideData.status === 'full' ? 'active' : rideData.status;

      transaction.update(rideRef, {
        seatsAvailable: newSeatsAvailable,
        riders: arrayRemove(riderID),
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Update rider's total rides taken count
      const riderRef = doc(db, COLLECTIONS.USERS, riderID);
      transaction.update(riderRef, {
        totalRidesTaken: increment(-1),
        updatedAt: serverTimestamp()
      });

      return {
        seatsFreed: bookingData.seatsBooked,
        refundAmount: bookingData.totalCost
      };
    });

    return {
      success: true,
      message: 'Booking cancelled successfully',
      seatsFreed: result.seatsFreed,
      refundAmount: result.refundAmount
    };
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw new Error(error.message || 'Failed to cancel booking');
  }
};

/**
 * Get booking by ID
 * @param {string} bookingID - Booking ID
 * @returns {Promise<Object>} Booking details
 */
export const getBookingById = async (bookingID) => {
  try {
    const bookingDoc = await getDoc(doc(db, COLLECTIONS.BOOKINGS, bookingID));

    if (!bookingDoc.exists()) {
      throw new Error('Booking not found');
    }

    return {
      success: true,
      booking: {
        ...bookingDoc.data(),
        id: bookingDoc.id
      }
    };
  } catch (error) {
    console.error('Error getting booking:', error);
    throw new Error(error.message || 'Failed to fetch booking details');
  }
};

/**
 * Get all bookings for a specific user (as rider)
 * @param {string} riderID - Rider's user ID
 * @param {string} status - Filter by status (optional: 'active', 'cancelled', 'completed')
 * @returns {Promise<Array>} User's bookings
 */
export const getMyBookings = async (riderID, status = null) => {
  try {
    let constraints = [
      where('riderID', '==', riderID),
      orderBy('createdAt', 'desc')
    ];

    // Add status filter if provided
    if (status && ['active', 'cancelled', 'completed'].includes(status)) {
      constraints = [
        where('riderID', '==', riderID),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      ];
    }

    const bookingsQuery = query(
      collection(db, COLLECTIONS.BOOKINGS),
      ...constraints
    );

    const querySnapshot = await getDocs(bookingsQuery);
    const bookings = [];

    querySnapshot.forEach((doc) => {
      bookings.push({
        ...doc.data(),
        id: doc.id
      });
    });

    return {
      success: true,
      bookings,
      count: bookings.length
    };
  } catch (error) {
    console.error('Error getting user bookings:', error);
    throw new Error('Failed to fetch your bookings');
  }
};

/**
 * Get all bookings for a specific ride (for driver to see who booked)
 * @param {string} rideID - Ride ID
 * @param {string} driverID - Driver ID (for authorization)
 * @returns {Promise<Array>} Ride bookings
 */
export const getRideBookings = async (rideID, driverID) => {
  try {
    // Verify the user is the driver of this ride
    const rideDoc = await getDoc(doc(db, COLLECTIONS.RIDES, rideID));

    if (!rideDoc.exists()) {
      throw new Error('Ride not found');
    }

    const rideData = rideDoc.data();

    if (rideData.driverID !== driverID) {
      throw new Error('Only the driver can view ride bookings');
    }

    // Get all active bookings for this ride
    const bookingsQuery = query(
      collection(db, COLLECTIONS.BOOKINGS),
      where('rideID', '==', rideID),
      where('status', '==', 'active'),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(bookingsQuery);
    const bookings = [];

    querySnapshot.forEach((doc) => {
      bookings.push({
        ...doc.data(),
        id: doc.id
      });
    });

    return {
      success: true,
      bookings,
      count: bookings.length,
      totalSeatsBooked: bookings.reduce((sum, b) => sum + b.seatsBooked, 0)
    };
  } catch (error) {
    console.error('Error getting ride bookings:', error);
    throw new Error(error.message || 'Failed to fetch ride bookings');
  }
};

/**
 * Mark booking as completed (called when ride is completed)
 * @param {string} bookingID - Booking ID
 * @returns {Promise<Object>} Result
 */
export const completeBooking = async (bookingID) => {
  try {
    const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingID);
    const bookingDoc = await getDoc(bookingRef);

    if (!bookingDoc.exists()) {
      throw new Error('Booking not found');
    }

    const bookingData = bookingDoc.data();

    if (bookingData.status === 'cancelled') {
      throw new Error('Cannot complete a cancelled booking');
    }

    if (bookingData.status === 'completed') {
      return {
        success: true,
        message: 'Booking already marked as completed'
      };
    }

    await updateDoc(bookingRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      message: 'Booking completed successfully'
    };
  } catch (error) {
    console.error('Error completing booking:', error);
    throw new Error(error.message || 'Failed to complete booking');
  }
};

/**
 * Get booking statistics for a user
 * @param {string} uid - User ID
 * @returns {Promise<Object>} Booking statistics
 */
export const getBookingStats = async (uid) => {
  try {
    const bookingsQuery = query(
      collection(db, COLLECTIONS.BOOKINGS),
      where('riderID', '==', uid)
    );

    const querySnapshot = await getDocs(bookingsQuery);
    
    let stats = {
      total: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      totalSpent: 0
    };

    querySnapshot.forEach((doc) => {
      const booking = doc.data();
      stats.total++;
      stats[booking.status]++;
      
      if (booking.status === 'completed') {
        stats.totalSpent += booking.totalCost;
      }
    });

    return {
      success: true,
      stats
    };
  } catch (error) {
    console.error('Error getting booking stats:', error);
    throw new Error('Failed to fetch booking statistics');
  }
};

/**
 * Check if user has booked a specific ride
 * @param {string} rideID - Ride ID
 * @param {string} riderID - Rider ID
 * @returns {Promise<Object>} Booking status
 */
export const hasUserBookedRide = async (rideID, riderID) => {
  try {
    const bookingsQuery = query(
      collection(db, COLLECTIONS.BOOKINGS),
      where('rideID', '==', rideID),
      where('riderID', '==', riderID),
      where('status', '==', 'active')
    );

    const querySnapshot = await getDocs(bookingsQuery);

    return {
      success: true,
      hasBooked: !querySnapshot.empty,
      booking: querySnapshot.empty ? null : {
        ...querySnapshot.docs[0].data(),
        id: querySnapshot.docs[0].id
      }
    };
  } catch (error) {
    console.error('Error checking booking status:', error);
    throw new Error('Failed to check booking status');
  }
};
