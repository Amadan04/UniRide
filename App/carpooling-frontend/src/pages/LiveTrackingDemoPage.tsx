/**
 * Live Tracking Demo Page
 *
 * Test page with fake passenger data for testing multi-pickup routing
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Navigation, Users, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LiveMap, Passenger, Location } from '../components/LiveMap';
import { useDriverTracking } from '../hooks/useDriverTracking';
import { GeofenceAlert } from '../services/locationService';

export const LiveTrackingDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Fake passengers for testing (Dammam area)
  const [passengers, setPassengers] = useState<Passenger[]>([
    {
      id: 'passenger1',
      name: 'Ahmed Ali',
      pickupLocation: { lat: 26.4207, lng: 50.0888 }, // Dammam University
      pickupAddress: 'Imam Abdulrahman Bin Faisal University - Gate 1',
      status: 'pending'
    },
    {
      id: 'passenger2',
      name: 'Sara Mohammed',
      pickupLocation: { lat: 26.4250, lng: 50.0920 }, // Nearby location
      pickupAddress: 'Al Faisaliah District',
      status: 'pending'
    },
    {
      id: 'passenger3',
      name: 'Omar Hassan',
      pickupLocation: { lat: 26.4280, lng: 50.0950 }, // Another nearby location
      pickupAddress: 'Al Shatea District',
      status: 'pending'
    }
  ]);

  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const destinationCoords: Location = { lat: 26.4300, lng: 50.1000 }; // King Fahd Airport area

  const { isTracking, startTracking, stopTracking, error: trackingError } = useDriverTracking(
    currentUser?.uid || ''
  );

  // Auto-start tracking when page loads
  useEffect(() => {
    if (currentUser && !isTracking) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [currentUser]);

  const handlePassengerPickedUp = (passengerID: string) => {
    // Update passenger status
    setPassengers(prev =>
      prev.map(p =>
        p.id === passengerID ? { ...p, status: 'picked_up' as const } : p
      )
    );

    console.log(`Passenger ${passengerID} picked up`);
  };

  const handleGeofenceAlert = (alert: GeofenceAlert) => {
    // Add alert to list
    setAlerts(prev => [alert, ...prev].slice(0, 5));

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      const title = alert.type === 'arrived'
        ? `You've arrived at ${alert.targetName}'s pickup!`
        : `Approaching ${alert.targetName}'s pickup`;

      new Notification(title, {
        body: `Distance: ${Math.round(alert.distance)}m`,
        icon: '/icon.png'
      });
    }
  };

  const handleResetPassengers = () => {
    setPassengers(prev => prev.map(p => ({ ...p, status: 'pending' as const })));
    setAlerts([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900 to-gray-900">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-gray-900/50 backdrop-blur-lg border-b border-cyan-500/20 sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-cyan-400" />
            </button>
            <div className="flex items-center gap-3">
              <Navigation className="w-8 h-8 text-cyan-400" />
              <div>
                <h1 className="text-xl font-bold text-white">Live Tracking Demo</h1>
                <p className="text-sm text-cyan-400">
                  {passengers.filter(p => p.status === 'pending').length} pickup{passengers.filter(p => p.status === 'pending').length !== 1 ? 's' : ''} remaining
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isTracking ? (
              <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/50 rounded-lg px-4 py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-semibold text-sm">Tracking Active</span>
              </div>
            ) : (
              <button
                onClick={startTracking}
                className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors font-semibold"
              >
                Start Tracking
              </button>
            )}
            <button
              onClick={handleResetPassengers}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Reset Demo
            </button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Instructions Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-blue-400 font-semibold mb-1">Testing Instructions</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• <strong>Desktop:</strong> Open DevTools (F12) → Sensors → Override location to simulate driving</li>
                <li>• <strong>Mobile:</strong> Allow location permission and move around to test</li>
                <li>• The map shows 3 fake passengers with numbered pickup markers (①, ②, ③)</li>
                <li>• Move close to a pickup location to trigger geofencing alerts</li>
                <li>• Passengers auto-picked-up when you're within 50m for 10 seconds</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Tracking Error Alert */}
        {trackingError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-semibold mb-1">Location Tracking Error</h3>
              <p className="text-red-300 text-sm">{trackingError}</p>
              <p className="text-gray-400 text-xs mt-2">
                Please enable location permissions in your browser settings.
              </p>
            </div>
          </motion.div>
        )}

        {/* Recent Alerts */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 space-y-2"
          >
            {alerts.map((alert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-4 rounded-xl border flex items-center gap-3 ${
                  alert.type === 'arrived'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-yellow-500/10 border-yellow-500/30'
                }`}
              >
                {alert.type === 'arrived' ? '✅' : '⚠️'}
                <div className="flex-1">
                  <p className={`font-semibold ${
                    alert.type === 'arrived' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {alert.type === 'arrived'
                      ? `Arrived at ${alert.targetName}'s pickup!`
                      : `Approaching ${alert.targetName}'s pickup`
                    }
                  </p>
                  <p className="text-sm text-gray-400">{Math.round(alert.distance)}m away</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Live Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <LiveMap
            rideID="demo-ride"
            driverID={currentUser?.uid || 'demo-driver'}
            passengers={passengers}
            destinationCoords={destinationCoords}
            destination="King Fahd International Airport"
            onPassengerPickedUp={handlePassengerPickedUp}
            onGeofenceAlert={handleGeofenceAlert}
          />
        </motion.div>

        {/* Passengers List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-gray-800/50 backdrop-blur-lg border border-cyan-500/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Passengers (Demo Data)</h2>
          </div>

          <div className="space-y-3">
            {passengers.map((passenger, index) => (
              <div
                key={passenger.id}
                className={`p-4 rounded-lg border flex items-center justify-between ${
                  passenger.status === 'picked_up'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-cyan-500/10 border-cyan-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    passenger.status === 'picked_up'
                      ? 'bg-green-500 text-white'
                      : 'bg-cyan-500 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{passenger.name}</p>
                    <p className="text-sm text-gray-400">{passenger.pickupAddress}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Lat: {passenger.pickupLocation.lat.toFixed(4)}, Lng: {passenger.pickupLocation.lng.toFixed(4)}
                    </p>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  passenger.status === 'picked_up'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {passenger.status === 'picked_up' ? 'Picked Up' : 'Pending'}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};