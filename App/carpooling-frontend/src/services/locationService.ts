/**
 * Location Tracking Service
 *
 * Handles live GPS tracking for drivers and riders
 * Stores location data in Firebase Realtime Database
 */

import { ref, set, onValue, off, get } from 'firebase/database';
import { rtdb } from '../firebase';

export interface LocationData {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
}

export interface GeofenceAlert {
  type: 'nearby' | 'arrived';
  distance: number;
  targetName: string;
}

/**
 * Start tracking user's location and update Realtime DB
 */
export function startLocationTracking(
  userID: string,
  onLocationUpdate?: (location: LocationData) => void,
  onError?: (error: GeolocationPositionError) => void
): () => void {
  if (!navigator.geolocation) {
    console.error('Geolocation not supported');
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const locationData: LocationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now(),
        accuracy: position.coords.accuracy
      };

      // Update Realtime Database
      const locationRef = ref(rtdb, `locations/${userID}`);
      set(locationRef, locationData).catch((error) => {
        console.error('Failed to update location:', error);
      });

      // Callback for local updates
      if (onLocationUpdate) {
        onLocationUpdate(locationData);
      }
    },
    (error) => {
      console.error('Geolocation error:', error);
      if (onError) {
        onError(error);
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    }
  );

  // Return cleanup function
  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}

/**
 * Listen to another user's location updates
 */
export function subscribeToUserLocation(
  userID: string,
  onLocationUpdate: (location: LocationData | null) => void
): () => void {
  const locationRef = ref(rtdb, `locations/${userID}`);

  const unsubscribe = onValue(
    locationRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        onLocationUpdate(data as LocationData);
      } else {
        onLocationUpdate(null);
      }
    },
    (error) => {
      console.error('Failed to subscribe to location:', error);
      onLocationUpdate(null);
    }
  );

  // Return cleanup function
  return () => {
    off(locationRef);
  };
}

/**
 * Get user's current location once (no subscription)
 */
export async function getUserLocation(userID: string): Promise<LocationData | null> {
  try {
    const locationRef = ref(rtdb, `locations/${userID}`);
    const snapshot = await get(locationRef);

    if (snapshot.exists()) {
      return snapshot.val() as LocationData;
    }

    return null;
  } catch (error) {
    console.error('Failed to get user location:', error);
    return null;
  }
}

/**
 * Get user's current position using browser geolocation (one-time)
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  });
}

/**
 * Stop tracking user's location (remove from Realtime DB)
 */
export async function stopLocationTracking(userID: string): Promise<void> {
  try {
    const locationRef = ref(rtdb, `locations/${userID}`);
    await set(locationRef, null);
  } catch (error) {
    console.error('Failed to stop location tracking:', error);
  }
}

/**
 * Calculate distance between two locations (Haversine formula)
 */
export function calculateDistance(
  loc1: { lat: number; lng: number },
  loc2: { lat: number; lng: number }
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (loc1.lat * Math.PI) / 180;
  const φ2 = (loc2.lat * Math.PI) / 180;
  const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

/**
 * Check if location is within geofence radius
 */
export function isWithinGeofence(
  currentLocation: { lat: number; lng: number },
  targetLocation: { lat: number; lng: number },
  radiusMeters: number
): boolean {
  const distance = calculateDistance(currentLocation, targetLocation);
  return distance <= radiusMeters;
}

/**
 * Check geofence alerts for proximity to target
 */
export function checkGeofenceAlert(
  currentLocation: { lat: number; lng: number },
  targetLocation: { lat: number; lng: number },
  targetName: string,
  previousAlert?: string
): GeofenceAlert | null {
  const distance = calculateDistance(currentLocation, targetLocation);

  // Check for "arrived" alert (within 100m)
  if (distance <= 100 && previousAlert !== 'arrived') {
    return {
      type: 'arrived',
      distance,
      targetName
    };
  }

  // Check for "nearby" alert (within 500m)
  if (distance <= 500 && distance > 100 && previousAlert !== 'nearby') {
    return {
      type: 'nearby',
      distance,
      targetName
    };
  }

  return null;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}