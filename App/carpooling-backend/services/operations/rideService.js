/**
 * Ride Service
 * 
 * Handles all ride operations including creating rides, searching for rides,
 * getting ride details, and managing ride status.
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
  limit,
  serverTimestamp,
  Timestamp,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';

/**
 * Generate a unique ride ID
 * @returns {string} Unique ride ID
 */
const generateRideId = () => {
  return `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a new ride
 * @param {Object} rideData - Ride information
 * @param {string} rideData.driverID - Driver's user ID
 * @param {string} rideData.pickup - Pickup location name
 * @param {string} rideData.destination - Destination location name
 * @param {number} rideData.pickupLat - Pickup latitude
 * @param {number} rideData.pickupLng - Pickup longitude
 * @param {number} rideData.destinationLat - Destination latitude
 * @param {number} rideData.destinationLng - Destination longitude
 * @param {string} rideData.date - Ride date (YYYY-MM-DD)
 * @param {string} rideData.time - Ride time (HH:mm)
 * @param {number} rideData.totalSeats - Total available seats
 * @param {number} rideData.cost - Cost per seat
 * @returns {Promise<Object>} Created ride object
 */
export const createRide = async (rideData) => {
  try {
    const {
      driverID,
      pickup,
      destination,
      pickupLat,
      pickupLng,
      destinationLat,
      destinationLng,
      date,
      time,
      totalSeats,
      cost,
      notes = '',
      vehicleInfo = {}
    } = rideData;

    // Validate required fields
    if (!driverID || !pickup || !destination || !date || !time || !totalSeats || cost === undefined) {
      throw new Error('Missing required fields for creating a ride');
    }

    // Validate coordinates
    if (
      pickupLat === undefined || pickupLng === undefined ||
      destinationLat === undefined || destinationLng === undefined
    ) {
      throw new Error('Pickup and destination coordinates are required');
    }

    // Validate seats and cost
    if (totalSeats < 1 || totalSeats > 8) {
      throw new Error('Total seats must be between 1 and 8');
    }

    if (cost < 0) {
      throw new Error('Cost cannot be negative');
    }

    // Verify driver exists and has driver role
    const driverDoc = await getDoc(doc(db, COLLECTIONS.USERS, driverID));
    if (!driverDoc.exists()) {
      throw new Error('Driver not found');
    }

    const driverData = driverDoc.data();
    if (driverData.role !== 'driver') {
      throw new Error('User must have driver role to create rides');
    }

    // Parse date and time to create timestamp
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const rideDateTime = new Date(year, month - 1, day, hours, minutes);

    // Check if ride date is in the future
    if (rideDateTime <= new Date()) {
      throw new Error('Ride date and time must be in the future');
    }

    // Generate ride ID
    const rideID = generateRideId();

    // Create ride document
    const rideDocData = {
      rideID,
      driverID,
      driverName: driverData.name,
      driverPhone: driverData.phone,
      driverRating: driverData.avgRating,
      driverProfilePic: driverData.profilePic || '',
      pickup,
      destination,
      pickupLat,
      pickupLng,
      destinationLat,
      destinationLng,
      date,
      time,
      rideDateTime: Timestamp.fromDate(rideDateTime),
      totalSeats,
      seatsAvailable: totalSeats,
      cost,
      riders: [], // Array of rider IDs who booked
      status: 'active', // active, full, completed, cancelled
      notes,
      vehicleInfo: {
        make: vehicleInfo.make || '',
        model: vehicleInfo.model || '',
        color: vehicleInfo.color || '',
        licensePlate: vehicleInfo.licensePlate || ''
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, COLLECTIONS.RIDES, rideID), rideDocData);

    // Update driver's total rides offered count
    await updateDoc(doc(db, COLLECTIONS.USERS, driverID), {
      totalRidesOffered: increment(1),
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      ride: rideDocData
    };
  } catch (error) {
    console.error('Error creating ride:', error);
    throw new Error(error.message || 'Failed to create ride');
  }
};

/**
 * Get available rides with filters
 * @param {Object} filters - Search filters
 * @param {string} filters.pickup - Pickup location (partial match)
 * @param {string} filters.destination - Destination location (partial match)
 * @param {string} filters.date - Ride date (YYYY-MM-DD)
 * @param {number} filters.seatsNeeded - Minimum seats needed
 * @param {number} filters.maxCost - Maximum cost per seat
 * @param {number} filters.limit - Maximum results to return
 * @returns {Promise<Array>} Array of available rides
 */
export const getAvailableRides = async (filters = {}) => {
  try {
    const {
      pickup,
      destination,
      date,
      seatsNeeded = 1,
      maxCost,
      limitResults = 50
    } = filters;

    // Build query
    let ridesQuery = collection(db, COLLECTIONS.RIDES);
    let constraints = [];

    // Only get active rides
    constraints.push(where('status', '==', 'active'));

    // Filter by date if provided
    if (date) {
      constraints.push(where('date', '==', date));
    } else {
      // Only get future rides
      const now = Timestamp.now();
      constraints.push(where('rideDateTime', '>', now));
    }

    // Filter by available seats
    constraints.push(where('seatsAvailable', '>=', seatsNeeded));

    // Filter by max cost if provided
    if (maxCost !== undefined && maxCost > 0) {
      constraints.push(where('cost', '<=', maxCost));
    }

    // Order by ride date/time
    constraints.push(orderBy('rideDateTime', 'asc'));

    // Limit results
    constraints.push(limit(limitResults));

    // Execute query
    const q = query(ridesQuery, ...constraints);
    const querySnapshot = await getDocs(q);

    let rides = [];
    querySnapshot.forEach((doc) => {
      rides.push({
        ...doc.data(),
        id: doc.id
      });
    });

    // Client-side filtering for location (Firestore doesn't support LIKE queries)
    if (pickup) {
      rides = rides.filter(ride =>
        ride.pickup.toLowerCase().includes(pickup.toLowerCase())
      );
    }

    if (destination) {
      rides = rides.filter(ride =>
        ride.destination.toLowerCase().includes(destination.toLowerCase())
      );
    }

    return {
      success: true,
      rides,
      count: rides.length
    };
  } catch (error) {
    console.error('Error getting available rides:', error);
    throw new Error('Failed to fetch available rides');
  }
};

/**
 * Get ride by ID
 * @param {string} rideID - Ride ID
 * @returns {Promise<Object>} Ride data
 */
export const getRideById = async (rideID) => {
  try {
    const rideDoc = await getDoc(doc(db, COLLECTIONS.RIDES, rideID));

    if (!rideDoc.exists()) {
      throw new Error('Ride not found');
    }

    return {
      success: true,
      ride: {
        ...rideDoc.data(),
        id: rideDoc.id
      }
    };
  } catch (error) {
    console.error('Error getting ride:', error);
    throw new Error(error.message || 'Failed to fetch ride details');
  }
};

/**
 * Get rides for a specific user (as driver or rider)
 * @param {string} uid - User ID
 * @param {string} type - 'driver', 'rider', or 'all'
 * @returns {Promise<Object>} User's rides
 */
export const getMyRides = async (uid, type = 'all') => {
  try {
    let driverRides = [];
    let riderRides = [];

    // Get rides where user is driver
    if (type === 'driver' || type === 'all') {
      const driverQuery = query(
        collection(db, COLLECTIONS.RIDES),
        where('driverID', '==', uid),
        orderBy('rideDateTime', 'desc'),
        limit(100)
      );

      const driverSnapshot = await getDocs(driverQuery);
      driverSnapshot.forEach((doc) => {
        driverRides.push({
          ...doc.data(),
          id: doc.id,
          userRole: 'driver'
        });
      });
    }

    // Get rides where user is a rider (booked)
    if (type === 'rider' || type === 'all') {
      const riderQuery = query(
        collection(db, COLLECTIONS.RIDES),
        where('riders', 'array-contains', uid),
        orderBy('rideDateTime', 'desc'),
        limit(100)
      );

      const riderSnapshot = await getDocs(riderQuery);
      riderSnapshot.forEach((doc) => {
        riderRides.push({
          ...doc.data(),
          id: doc.id,
          userRole: 'rider'
        });
      });
    }

    // Combine and sort by date
    const allRides = [...driverRides, ...riderRides].sort((a, b) => {
      return b.rideDateTime.toMillis() - a.rideDateTime.toMillis();
    });

    return {
      success: true,
      rides: allRides,
      driverRides,
      riderRides
    };
  } catch (error) {
    console.error('Error getting user rides:', error);
    throw new Error('Failed to fetch your rides');
  }
};

/**
 * Update ride status
 * @param {string} rideID - Ride ID
 * @param {string} status - New status (active, full, completed, cancelled)
 * @param {string} driverID - Driver ID (for authorization)
 * @returns {Promise<Object>} Updated ride
 */
export const updateRideStatus = async (rideID, status, driverID) => {
  try {
    const validStatuses = ['active', 'full', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status. Must be: active, full, completed, or cancelled');
    }

    const rideDoc = await getDoc(doc(db, COLLECTIONS.RIDES, rideID));

    if (!rideDoc.exists()) {
      throw new Error('Ride not found');
    }

    const rideData = rideDoc.data();

    // Verify the user is the driver
    if (rideData.driverID !== driverID) {
      throw new Error('Only the driver can update ride status');
    }

    // Update ride status
    await updateDoc(doc(db, COLLECTIONS.RIDES, rideID), {
      status,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      message: `Ride status updated to ${status}`
    };
  } catch (error) {
    console.error('Error updating ride status:', error);
    throw new Error(error.message || 'Failed to update ride status');
  }
};

/**
 * Cancel ride
 * @param {string} rideID - Ride ID
 * @param {string} driverID - Driver ID (for authorization)
 * @returns {Promise<Object>} Result
 */
export const cancelRide = async (rideID, driverID) => {
  try {
    const rideDoc = await getDoc(doc(db, COLLECTIONS.RIDES, rideID));

    if (!rideDoc.exists()) {
      throw new Error('Ride not found');
    }

    const rideData = rideDoc.data();

    // Verify the user is the driver
    if (rideData.driverID !== driverID) {
      throw new Error('Only the driver can cancel the ride');
    }

    // Check if ride is already completed or cancelled
    if (rideData.status === 'completed') {
      throw new Error('Cannot cancel a completed ride');
    }

    if (rideData.status === 'cancelled') {
      throw new Error('Ride is already cancelled');
    }

    // Update ride status to cancelled
    await updateDoc(doc(db, COLLECTIONS.RIDES, rideID), {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });

    // Note: Cloud Function will handle notifying all riders about cancellation

    return {
      success: true,
      message: 'Ride cancelled successfully. All riders have been notified.'
    };
  } catch (error) {
    console.error('Error cancelling ride:', error);
    throw new Error(error.message || 'Failed to cancel ride');
  }
};

/**
 * Mark ride as completed
 * @param {string} rideID - Ride ID
 * @param {string} driverID - Driver ID (for authorization)
 * @returns {Promise<Object>} Result
 */
export const completeRide = async (rideID, driverID) => {
  try {
    const rideDoc = await getDoc(doc(db, COLLECTIONS.RIDES, rideID));

    if (!rideDoc.exists()) {
      throw new Error('Ride not found');
    }

    const rideData = rideDoc.data();

    // Verify the user is the driver
    if (rideData.driverID !== driverID) {
      throw new Error('Only the driver can complete the ride');
    }

    // Update ride status to completed
    await updateDoc(doc(db, COLLECTIONS.RIDES, rideID), {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      message: 'Ride marked as completed'
    };
  } catch (error) {
    console.error('Error completing ride:', error);
    throw new Error(error.message || 'Failed to complete ride');
  }
};

/**
 * Search rides by geographic proximity (client-side filtering after initial query)
 * @param {Object} params - Search parameters
 * @param {number} params.lat - User's latitude
 * @param {number} params.lng - User's longitude
 * @param {number} params.radiusKm - Search radius in kilometers
 * @param {string} params.type - 'pickup' or 'destination'
 * @param {string} params.date - Optional date filter
 * @returns {Promise<Array>} Nearby rides
 */
export const searchRidesByLocation = async (params) => {
  try {
    const { lat, lng, radiusKm = 5, type = 'pickup', date } = params;

    // Get all available rides
    const { rides } = await getAvailableRides({ date, limitResults: 100 });

    // Filter by distance using Haversine formula
    const nearbyRides = rides.filter(ride => {
      const rideLat = type === 'pickup' ? ride.pickupLat : ride.destinationLat;
      const rideLng = type === 'pickup' ? ride.pickupLng : ride.destinationLng;

      const distance = calculateDistance(lat, lng, rideLat, rideLng);
      return distance <= radiusKm;
    });

    // Sort by distance
    nearbyRides.sort((a, b) => {
      const distA = calculateDistance(
        lat, lng,
        type === 'pickup' ? a.pickupLat : a.destinationLat,
        type === 'pickup' ? a.pickupLng : a.destinationLng
      );
      const distB = calculateDistance(
        lat, lng,
        type === 'pickup' ? b.pickupLat : b.destinationLat,
        type === 'pickup' ? b.pickupLng : b.destinationLng
      );
      return distA - distB;
    });

    return {
      success: true,
      rides: nearbyRides,
      count: nearbyRides.length
    };
  } catch (error) {
    console.error('Error searching rides by location:', error);
    throw new Error('Failed to search rides by location');
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};
