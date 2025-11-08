/**
 * Location Tracking Service
 * 
 * Handles real-time location tracking for active rides using Firebase Realtime Database.
 * Drivers update their location, and riders can subscribe to location updates.
 */

import { ref, set, get, onValue, off, serverTimestamp } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { realtimeDb, db, REALTIME_PATHS, COLLECTIONS } from './firebase';

/**
 * Start tracking location for a ride (driver calls this)
 * @param {string} rideID - Ride ID
 * @param {string} driverID - Driver's user ID
 * @param {number} lat - Current latitude
 * @param {number} lng - Current longitude
 * @param {number} heading - Direction in degrees (0-360)
 * @param {number} speed - Speed in km/h
 * @returns {Promise<Object>} Success status
 */
export const updateDriverLocation = async (rideID, driverID, lat, lng, heading = 0, speed = 0) => {
  try {
    // Validate inputs
    if (!rideID || !driverID || lat === undefined || lng === undefined) {
      throw new Error('Missing required location data');
    }

    // Verify the ride exists and the user is the driver
    const rideDoc = await getDoc(doc(db, COLLECTIONS.RIDES, rideID));
    
    if (!rideDoc.exists()) {
      throw new Error('Ride not found');
    }

    const rideData = rideDoc.data();
    
    if (rideData.driverID !== driverID) {
      throw new Error('Only the driver can update location for this ride');
    }

    if (rideData.status === 'cancelled' || rideData.status === 'completed') {
      throw new Error('Cannot update location for cancelled or completed rides');
    }

    // Create location data
    const locationData = {
      lat,
      lng,
      heading,
      speed,
      updatedAt: serverTimestamp(),
      timestamp: Date.now()
    };

    // Update location in Realtime Database
    const locationRef = ref(realtimeDb, `${REALTIME_PATHS.RIDE_LOCATIONS}/${rideID}`);
    await set(locationRef, locationData);

    return {
      success: true,
      message: 'Location updated successfully'
    };
  } catch (error) {
    console.error('Error updating driver location:', error);
    throw new Error(error.message || 'Failed to update location');
  }
};

/**
 * Get current driver location for a ride (one-time fetch)
 * @param {string} rideID - Ride ID
 * @returns {Promise<Object>} Current location data
 */
export const getDriverLocation = async (rideID) => {
  try {
    const locationRef = ref(realtimeDb, `${REALTIME_PATHS.RIDE_LOCATIONS}/${rideID}`);
    const snapshot = await get(locationRef);

    if (!snapshot.exists()) {
      return {
        success: false,
        message: 'Location not available yet',
        location: null
      };
    }

    const locationData = snapshot.val();

    return {
      success: true,
      location: locationData
    };
  } catch (error) {
    console.error('Error getting driver location:', error);
    throw new Error('Failed to fetch driver location');
  }
};

/**
 * Subscribe to real-time location updates (riders call this)
 * @param {string} rideID - Ride ID
 * @param {Function} callback - Callback function to receive location updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToLocationUpdates = (rideID, callback) => {
  try {
    const locationRef = ref(realtimeDb, `${REALTIME_PATHS.RIDE_LOCATIONS}/${rideID}`);

    // Listen for value changes
    const unsubscribe = onValue(
      locationRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const locationData = snapshot.val();
          callback({
            success: true,
            location: locationData
          });
        } else {
          callback({
            success: false,
            message: 'Location not available',
            location: null
          });
        }
      },
      (error) => {
        console.error('Error listening to location updates:', error);
        callback({
          success: false,
          error: error.message,
          location: null
        });
      }
    );

    // Return unsubscribe function
    return () => {
      off(locationRef);
    };
  } catch (error) {
    console.error('Error subscribing to location updates:', error);
    throw new Error('Failed to subscribe to location updates');
  }
};

/**
 * Stop tracking location for a ride (driver calls this when ride ends)
 * @param {string} rideID - Ride ID
 * @param {string} driverID - Driver's user ID
 * @returns {Promise<Object>} Success status
 */
export const stopLocationTracking = async (rideID, driverID) => {
  try {
    // Verify the ride exists and the user is the driver
    const rideDoc = await getDoc(doc(db, COLLECTIONS.RIDES, rideID));
    
    if (!rideDoc.exists()) {
      throw new Error('Ride not found');
    }

    const rideData = rideDoc.data();
    
    if (rideData.driverID !== driverID) {
      throw new Error('Only the driver can stop location tracking');
    }

    // Remove location data from Realtime Database
    const locationRef = ref(realtimeDb, `${REALTIME_PATHS.RIDE_LOCATIONS}/${rideID}`);
    await set(locationRef, null);

    return {
      success: true,
      message: 'Location tracking stopped'
    };
  } catch (error) {
    console.error('Error stopping location tracking:', error);
    throw new Error(error.message || 'Failed to stop location tracking');
  }
};

/**
 * Calculate distance between driver and pickup point
 * @param {number} driverLat - Driver's current latitude
 * @param {number} driverLng - Driver's current longitude
 * @param {number} pickupLat - Pickup point latitude
 * @param {number} pickupLng - Pickup point longitude
 * @returns {number} Distance in kilometers
 */
export const calculateDistanceToPickup = (driverLat, driverLng, pickupLat, pickupLng) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(pickupLat - driverLat);
  const dLon = toRad(pickupLng - driverLng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(driverLat)) * Math.cos(toRad(pickupLat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate ETA based on distance and average speed
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} averageSpeedKmh - Average speed in km/h (default: 40)
 * @returns {number} ETA in minutes
 */
export const calculateETA = (distanceKm, averageSpeedKmh = 40) => {
  const hours = distanceKm / averageSpeedKmh;
  return Math.round(hours * 60); // Convert to minutes
};

/**
 * Check if driver is near pickup location
 * @param {string} rideID - Ride ID
 * @param {number} thresholdKm - Distance threshold in km (default: 0.5km)
 * @returns {Promise<Object>} Whether driver is nearby
 */
export const isDriverNearPickup = async (rideID, thresholdKm = 0.5) => {
  try {
    // Get ride details
    const rideDoc = await getDoc(doc(db, COLLECTIONS.RIDES, rideID));
    
    if (!rideDoc.exists()) {
      throw new Error('Ride not found');
    }

    const rideData = rideDoc.data();

    // Get current driver location
    const { location } = await getDriverLocation(rideID);

    if (!location) {
      return {
        success: false,
        isNear: false,
        message: 'Driver location not available'
      };
    }

    // Calculate distance
    const distance = calculateDistanceToPickup(
      location.lat,
      location.lng,
      rideData.pickupLat,
      rideData.pickupLng
    );

    const isNear = distance <= thresholdKm;
    const eta = calculateETA(distance, location.speed || 40);

    return {
      success: true,
      isNear,
      distance: parseFloat(distance.toFixed(2)),
      eta,
      message: isNear ? 'Driver is nearby!' : `Driver is ${distance.toFixed(1)}km away`
    };
  } catch (error) {
    console.error('Error checking driver proximity:', error);
    throw new Error('Failed to check driver location');
  }
};

// Helper function
const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};
