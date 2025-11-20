/**
 * Rider Location Tracker Component
 *
 * Allows riders to share their live location with the driver
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, MapPinOff, Loader2, AlertCircle } from 'lucide-react';
import { useDriverTracking } from '../hooks/useDriverTracking';

interface RiderLocationTrackerProps {
  userID: string;
  rideID: string;
}

export const RiderLocationTracker: React.FC<RiderLocationTrackerProps> = ({
  userID,
  rideID
}) => {
  const { isTracking, currentLocation, error, startTracking, stopTracking } = useDriverTracking(userID);
  const [permissionRequested, setPermissionRequested] = useState(false);

  const handleToggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      setPermissionRequested(true);
      startTracking();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-lg border border-cyan-500/20 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isTracking ? 'bg-green-500/20 border-green-500/50' : 'bg-gray-700/50 border-gray-600/50'
          } border`}>
            {isTracking ? (
              <MapPin className="w-5 h-5 text-green-400" />
            ) : (
              <MapPinOff className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">Location Sharing</h3>
            <p className="text-sm text-gray-400">
              {isTracking ? 'Your location is visible to the driver' : 'Share your location with the driver'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleTracking}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            isTracking
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50'
              : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/50'
          }`}
        >
          {isTracking ? 'Stop Sharing' : 'Start Sharing'}
        </button>
      </div>

      {/* Status Information */}
      {isTracking && currentLocation && (
        <div className="mt-3 pt-3 border-t border-cyan-500/20">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-medium">Live</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400">
              Accuracy: {currentLocation.accuracy ? `${Math.round(currentLocation.accuracy)}m` : 'Unknown'}
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && permissionRequested && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm font-medium">Location Access Error</p>
            <p className="text-red-300 text-xs mt-1">{error}</p>
            <p className="text-gray-400 text-xs mt-2">
              Please allow location access in your browser settings and try again.
            </p>
          </div>
        </motion.div>
      )}

      {/* Privacy Note */}
      {!isTracking && !error && (
        <div className="mt-3 pt-3 border-t border-cyan-500/20">
          <p className="text-xs text-gray-400">
            🔒 Your location is only shared during active rides and will be removed after the ride ends.
          </p>
        </div>
      )}
    </motion.div>
  );
};