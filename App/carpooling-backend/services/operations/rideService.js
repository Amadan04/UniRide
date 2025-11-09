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
 * @param {string} rideData.genderPreference - Optional: 'male', 'female', 'any' (default: 'any')
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
      vehicleInfo = {},
      genderPreference = 'any'
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

    // Validate genderPreference
    const validGenderPreferences = ['male', 'female', 'any'];
    if (!validGenderPreferences.includes(genderPreference)) {
      throw new Error('Gender preference must be: male, female, or any');
    }

    // Verify driver exists and has driver role
    const driverDoc = await getDoc(doc(db, COLLECTIONS.USERS, driverID));
    if (!driverDoc.exists()) {
      throw new Error('Driver not found');
    }

    const driverData = driverDoc.data();
    
    // CRITICAL: Only users with role "driver" can create rides
    if (driverData.role !== 'driver') {
      throw new Error('Only users with driver role can create rides');
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
      driverGender: driverData.gender || 'other',
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
      genderPreference, // 'male', 'female', 'any'
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
 * Update ride details
 * @param {string} driverID - Driver's user ID (for authorization)
 * @param {string} rideID - Ride ID
 * @param {Object} updates - Fields to update
 * @param {string} updates.date - Ride date (YYYY-MM-DD)
 * @param {string} updates.time - Ride time (HH:mm)
 * @param {number} updates.totalSeats - Total available seats
 * @param {number} updates.cost - Cost per seat
 * @param {string} updates.notes - Additional notes
 * @param {string} updates.genderPreference - Gender preference
 * @param {Object} updates.vehicleInfo - Vehicle information
 * @returns {Promise<Object>} Result
 */
export const updateRideDetails = async (driverID, rideID, updates) => {
  try {
    // Validate inputs
    if (!driverID || !rideID) {
      throw new Error('Driver ID and Ride ID are required');
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('No updates provided');
    }

    // Get ride document
    const rideDoc = await getDoc(doc(db, COLLECTIONS.RIDES, rideID));

    if (!rideDoc.exists()) {
      throw new Error('Ride not found');
    }

    const rideData = rideDoc.data();

    // Verify the user is the driver
    if (rideData.driverID !== driverID) {
      throw new Error('Only the driver can update ride details');
    }

    // Cannot update completed or cancelled rides
    if (rideData.status === 'completed') {
      throw new Error('Cannot update a completed ride');
    }

    if (rideData.status === 'cancelled') {
      throw new Error('Cannot update a cancelled ride');
    }

    // Build update object
    const updateData = {
      updatedAt: serverTimestamp()
    };

    // Validate and add date/time updates
    if (updates.date || updates.time) {
      const newDate = updates.date || rideData.date;
      const newTime = updates.time || rideData.time;

      const [year, month, day] = newDate.split('-').map(Number);
      const [hours, minutes] = newTime.split(':').map(Number);
      const newRideDateTime = new Date(year, month - 1, day, hours, minutes);

      // Check if new ride date is in the future
      if (newRideDateTime <= new Date()) {
        throw new Error('Ride date and time must be in the future');
      }

      if (updates.date) updateData.date = updates.date;
      if (updates.time) updateData.time = updates.time;
      updateData.rideDateTime = Timestamp.fromDate(newRideDateTime);
    }

    // Validate and add totalSeats update
    if (updates.totalSeats !== undefined) {
      if (updates.totalSeats < 1 || updates.totalSeats > 8) {
        throw new Error('Total seats must be between 1 and 8');
      }

      // Cannot reduce seats below already booked
      const seatsBooked = rideData.totalSeats - rideData.seatsAvailable;
      if (updates.totalSeats < seatsBooked) {
        throw new Error(`Cannot reduce seats below ${seatsBooked} (already booked)`);
      }

      updateData.totalSeats = updates.totalSeats;
      updateData.seatsAvailable = updates.totalSeats - seatsBooked;

      // Update status if necessary
      if (updateData.seatsAvailable === 0) {
        updateData.status = 'full';
      } else if (rideData.status === 'full' && updateData.seatsAvailable > 0) {
        updateData.status = 'active';
      }
    }

    // Validate and add cost update
    if (updates.cost !== undefined) {
      if (updates.cost < 0) {
        throw new Error('Cost cannot be negative');
      }
      updateData.cost = updates.cost;
    }

    // Validate and add genderPreference update
    if (updates.genderPreference !== undefined) {
      const validGenderPreferences = ['male', 'female', 'any'];
      if (!validGenderPreferences.includes(updates.genderPreference)) {
        throw new Error('Gender preference must be: male, female, or any');
      }
      updateData.genderPreference = updates.genderPreference;
    }

    // Add notes update
    if (updates.notes !== undefined) {
      updateData.notes = updates.notes;
    }

    // Validate and add vehicleInfo update
    if (updates.vehicleInfo !== undefined) {
      updateData.vehicleInfo = {
        make: updates.vehicleInfo.make || rideData.vehicleInfo.make || '',
        model: updates.vehicleInfo.model || rideData.vehicleInfo.model || '',
        color: updates.vehicleInfo.color || rideData.vehicleInfo.color || '',
        licensePlate: updates.vehicleInfo.licensePlate || rideData.vehicleInfo.licensePlate || ''
      };
    }

    // Update ride document
    await updateDoc(doc(db, COLLECTIONS.RIDES, rideID), updateData);

    return {
      success: true,
      message: 'Ride details updated successfully',
      updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt')
    };
  } catch (error) {
    console.error('Error updating ride details:', error);
    throw new Error(error.message || 'Failed to update ride details');
  }
};

/**
 * Get rides created by a specific driver
 * @param {string} driverID - Driver's user ID
 * @param {string} status - Optional status filter ('active', 'full', 'completed', 'cancelled')
 * @param {number} limitResults - Maximum number of results (default: 100)
 * @returns {Promise<Object>} Driver's rides
 */
export const getDriverRides = async (driverID, status = null, limitResults = 100) => {
  try {
    if (!driverID) {
      throw new Error('Driver ID is required');
    }

    // Build query constraints
    let constraints = [
      where('driverID', '==', driverID),
      orderBy('rideDateTime', 'desc'),
      limit(limitResults)
    ];

    // Add status filter if provided
    if (status) {
      const validStatuses = ['active', 'full', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status. Must be: active, full, completed, or cancelled');
      }
      
      // Need to rebuild constraints with status filter
      constraints = [
        where('driverID', '==', driverID),
        where('status', '==', status),
        orderBy('rideDateTime', 'desc'),
        limit(limitResults)
      ];
    }

    const driverQuery = query(
      collection(db, COLLECTIONS.RIDES),
      ...constraints
    );

    const querySnapshot = await getDocs(driverQuery);
    const rides = [];

    querySnapshot.forEach((doc) => {
      rides.push({
        ...doc.data(),
        id: doc.id
      });
    });

    return {
      success: true,
      rides,
      count: rides.length
    };
  } catch (error) {
    console.error('Error getting driver rides:', error);
    throw new Error('Failed to fetch driver rides');
  }
};

/**
 * Get available rides with filters
 * @param {Object} filters - Search filters
 * @param {string} filters.pickup - Pickup location (partial match)
 * @param {string} filters.destination - Destination location (partial match)
 * @param {string} filters.date - Ride date (YYYY-MM-DD)
 * @param {string} filters.time - Ride time (HH:mm) - filters rides at or after this time
 * @param {number} filters.seatsNeeded - Minimum seats needed
 * @param {number} filters.maxCost - Maximum cost per seat
 * @param {string} filters.genderPreference - Gender preference filter ('male', 'female', 'any')
 * @param {number} filters.limit - Maximum results to return
 * @returns {Promise<Array>} Array of available rides
 */
export const getAvailableRides = async (filters = {}) => {
  try {
    const {
      pickup,
      destination,
      date,
      time,
      seatsNeeded = 1,
      maxCost,
      genderPreference,
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

    // Client-side filtering for time (if date is also provided)
    if (time && date) {
      rides = rides.filter(ride => {
        return ride.time >= time;
      });
    }

    // Client-side filtering for gender preference
    if (genderPreference && genderPreference !== 'any') {
      const validGenderPreferences = ['male', 'female'];
      if (validGenderPreferences.includes(genderPreference)) {
        rides = rides.filter(ride => {
          return ride.genderPreference === 'any' || ride.genderPreference === genderPreference;
        });
      }
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

/**
 * PLACEHOLDER FOR FUTURE CLOUD FUNCTION
 * 
 * Auto-archive completed rides
 * 
 * This function should be implemented as a Firebase Cloud Function that runs on a schedule
 * (e.g., daily at midnight) to automatically move completed rides older than 30 days
 * from the 'rides' collection to an 'archived_rides' collection.
 * 
 * Recommended implementation:
 * - Use Firebase Cloud Functions with a scheduled trigger (firebase-functions/scheduler)
 * - Query: rides where status == 'completed' AND completedAt < (now - 30 days)
 * - Move matching documents to 'archived_rides' collection
 * - Delete from 'rides' collection
 * - Also archive associated bookings
 * 
 * Example Cloud Function structure:
 * 
 * exports.archiveCompletedRides = functions.pubsub
 *   .schedule('0 0 * * *') // Run daily at midnight
 *   .timeZone('America/New_York')
 *   .onRun(async (context) => {
 *     const thirtyDaysAgo = new Date();
 *     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
 *     
 *     const completedRidesQuery = db.collection('rides')
 *       .where('status', '==', 'completed')
 *       .where('completedAt', '<', thirtyDaysAgo);
 *     
 *     const snapshot = await completedRidesQuery.get();
 *     
 *     const batch = db.batch();
 *     snapshot.forEach(doc => {
 *       // Copy to archived collection
 *       const archivedRef = db.collection('archived_rides').doc(doc.id);
 *       batch.set(archivedRef, { ...doc.data(), archivedAt: FieldValue.serverTimestamp() });
 *       
 *       // Delete from rides collection
 *       batch.delete(doc.ref);
 *     });
 *     
 *     await batch.commit();
 *     console.log(`Archived ${snapshot.size} completed rides`);
 *   });
 */