import { ref, set, update, get, remove } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { realtimeDb, db, COLLECTIONS } from '../config/firebase.js';

/**
 * Updates the driver's real-time location for an active ride
 * @param {string} rideID - The ride identifier
 * @param {string} driverID - The driver's user ID
 * @param {number} lat - Latitude coordinate
 * @param {number} lng - Longitude coordinate
 * @returns {Promise<object>} Success status and message
 */
export const updateDriverLocation = async (rideID, driverID, lat, lng) => {
  try {
    // Validate input parameters
    if (!rideID || !driverID) {
      throw new Error('rideID and driverID are required');
    }

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new Error('Invalid coordinates: lat and lng must be numbers');
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Invalid coordinates: lat must be between -90 and 90, lng must be between -180 and 180');
    }

    // Verify the ride exists and belongs to the driver
    const rideRef = doc(db, COLLECTIONS.RIDES, rideID);
    const rideSnap = await getDoc(rideRef);

    if (!rideSnap.exists()) {
      throw new Error('Ride not found');
    }

    const rideData = rideSnap.data();
    
    if (rideData.driverID !== driverID) {
      throw new Error('Unauthorized: This ride does not belong to the specified driver');
    }

    // Update driver location in Realtime Database
    const driverLocationRef = ref(realtimeDb, `tracking/${rideID}/driverLocation`);
    const locationData = {
      lat,
      lng,
      lastUpdated: Date.now()
    };

    await set(driverLocationRef, locationData);

    return {
      success: true,
      message: 'Driver location updated successfully',
      data: locationData
    };
  } catch (error) {
    console.error('Error updating driver location:', error);
    throw error;
  }
};

/**
 * Retrieves the driver's current location for a ride
 * @param {string} rideID - The ride identifier
 * @returns {Promise<object>} Driver location data or null if not found
 */
export const getDriverLocation = async (rideID) => {
  try {
    // Validate input
    if (!rideID) {
      throw new Error('rideID is required');
    }

    // Fetch driver location from Realtime Database
    const driverLocationRef = ref(realtimeDb, `tracking/${rideID}/driverLocation`);
    const snapshot = await get(driverLocationRef);

    if (!snapshot.exists()) {
      return {
        success: true,
        message: 'No location data found for this ride',
        data: null
      };
    }

    const locationData = snapshot.val();

    return {
      success: true,
      message: 'Driver location retrieved successfully',
      data: locationData
    };
  } catch (error) {
    console.error('Error getting driver location:', error);
    throw error;
  }
};

/**
 * Updates a passenger's real-time location for an active ride
 * @param {string} rideID - The ride identifier
 * @param {string} userID - The passenger's user ID
 * @param {number} lat - Latitude coordinate
 * @param {number} lng - Longitude coordinate
 * @returns {Promise<object>} Success status and message
 */
export const updatePassengerLocation = async (rideID, userID, lat, lng) => {
  try {
    // Validate input parameters
    if (!rideID || !userID) {
      throw new Error('rideID and userID are required');
    }

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new Error('Invalid coordinates: lat and lng must be numbers');
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Invalid coordinates: lat must be between -90 and 90, lng must be between -180 and 180');
    }

    // Verify the ride exists and user is a passenger
    const rideRef = doc(db, COLLECTIONS.RIDES, rideID);
    const rideSnap = await getDoc(rideRef);

    if (!rideSnap.exists()) {
      throw new Error('Ride not found');
    }

    const rideData = rideSnap.data();
    const isPassenger = rideData.passengers?.some(p => p.userID === userID);

    if (!isPassenger) {
      throw new Error('Unauthorized: User is not a passenger on this ride');
    }

    // Update passenger location in Realtime Database
    const passengerLocationRef = ref(realtimeDb, `tracking/${rideID}/passengers/${userID}`);
    const locationData = {
      lat,
      lng,
      lastUpdated: Date.now()
    };

    await set(passengerLocationRef, locationData);

    return {
      success: true,
      message: 'Passenger location updated successfully',
      data: locationData
    };
  } catch (error) {
    console.error('Error updating passenger location:', error);
    throw error;
  }
};

/**
 * Clears all tracking data for a completed or cancelled ride
 * @param {string} rideID - The ride identifier
 * @returns {Promise<object>} Success status and message
 */
export const clearTrackingData = async (rideID) => {
  try {
    // Validate input
    if (!rideID) {
      throw new Error('rideID is required');
    }

    // Remove all tracking data for the ride
    const trackingRef = ref(realtimeDb, `tracking/${rideID}`);
    await remove(trackingRef);

    return {
      success: true,
      message: 'Tracking data cleared successfully'
    };
  } catch (error) {
    console.error('Error clearing tracking data:', error);
    throw error;
  }
};

/**
 * Gets all passenger locations for a ride
 * @param {string} rideID - The ride identifier
 * @returns {Promise<object>} Object containing all passenger locations
 */
export const getAllPassengerLocations = async (rideID) => {
  try {
    // Validate input
    if (!rideID) {
      throw new Error('rideID is required');
    }

    // Fetch all passenger locations from Realtime Database
    const passengersRef = ref(realtimeDb, `tracking/${rideID}/passengers`);
    const snapshot = await get(passengersRef);

    if (!snapshot.exists()) {
      return {
        success: true,
        message: 'No passenger location data found for this ride',
        data: {}
      };
    }

    const passengersData = snapshot.val();

    return {
      success: true,
      message: 'Passenger locations retrieved successfully',
      data: passengersData
    };
  } catch (error) {
    console.error('Error getting passenger locations:', error);
    throw error;
  }
};