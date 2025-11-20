/**
 * Custom Hook for Driver Location Tracking
 *
 * Starts GPS tracking and sends location updates to Realtime DB
 */

import { useEffect, useState, useCallback } from 'react';
import {
  startLocationTracking,
  stopLocationTracking,
  LocationData
} from '../services/locationService';

interface UseDriverTrackingResult {
  isTracking: boolean;
  currentLocation: LocationData | null;
  error: string | null;
  startTracking: () => void;
  stopTracking: () => void;
}

export function useDriverTracking(userID: string): UseDriverTrackingResult {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cleanupFn, setCleanupFn] = useState<(() => void) | null>(null);

  const startTracking = useCallback(() => {
    if (isTracking) return;

    setError(null);
    setIsTracking(true);

    const cleanup = startLocationTracking(
      userID,
      (location) => {
        setCurrentLocation(location);
        setError(null);
      },
      (err) => {
        let errorMessage = 'Unknown error';

        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable';
            break;
          case err.TIMEOUT:
            errorMessage = 'Location request timeout';
            break;
        }

        setError(errorMessage);
        console.error('Geolocation error:', errorMessage);
      }
    );

    setCleanupFn(() => cleanup);
  }, [userID, isTracking]);

  const stopTracking = useCallback(async () => {
    if (!isTracking) return;

    if (cleanupFn) {
      cleanupFn();
      setCleanupFn(null);
    }

    await stopLocationTracking(userID);
    setIsTracking(false);
    setCurrentLocation(null);
  }, [userID, isTracking, cleanupFn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupFn) {
        cleanupFn();
      }
      stopLocationTracking(userID);
    };
  }, [userID, cleanupFn]);

  return {
    isTracking,
    currentLocation,
    error,
    startTracking,
    stopTracking
  };
}