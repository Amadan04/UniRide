/**
 * Live Tracking Page (Driver View)
 *
 * Shows multi-pickup routing with live driver tracking
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Navigation, Users, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LiveMap, Passenger, Location } from '../components/LiveMap';
import { useDriverTracking } from '../hooks/useDriverTracking';
import { GeofenceAlert } from '../services/locationService';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const LiveTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const { rideID } = useParams<{ rideID: string }>();
  const { currentUser } = useAuth();

  const [ride, setRide] = useState<any>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);

  const { isTracking, startTracking, stopTracking, error: trackingError } = useDriverTracking(
    currentUser?.uid || ''
  );

  // Load ride data
  useEffect(() => {
    if (!rideID || !currentUser) return;

    const loadRideData = async () => {
      try {
        // Get ride document
        const rideDoc = await getDoc(doc(db, 'rides', rideID));

        if (!rideDoc.exists()) {
          alert('Ride not found');
          navigate('/');
          return;
        }

        const rideData = { id: rideDoc.id, ...rideDoc.data() };
        setRide(rideData);

        // Get bookings for this ride
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('rideID', '==', rideID),
          where('status', '==', 'active')
        );

        const bookingsSnapshot = await getDocs(bookingsQuery);

        // Build passengers array
        const passengersData: Passenger[] = [];

        console.log('Found bookings:', bookingsSnapshot.docs.length);

        for (const bookingDoc of bookingsSnapshot.docs) {
          const booking = bookingDoc.data();

          console.log('Processing booking:', {
            bookingId: bookingDoc.id,
            riderID: booking.riderID,
            pickup: booking.pickup || rideData.pickup
          });

          // Get passenger user data
          const userQuery = query(
            collection(db, 'users'),
            where('uid', '==', booking.riderID)
          );
          const userSnapshot = await getDocs(userQuery);

          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();

            // Use booking's pickup location if available, otherwise use ride's pickup
            const pickupLat = booking.pickupLat || rideData.pickupLat;
            const pickupLng = booking.pickupLng || rideData.pickupLng;
            const pickupAddress = booking.pickup || rideData.pickup;

            // Validate coordinates exist
            if (pickupLat && pickupLng) {
              passengersData.push({
                id: booking.riderID,
                name: userData.name || 'Passenger',
                pickupLocation: {
                  lat: pickupLat,
                  lng: pickupLng
                },
                pickupAddress: pickupAddress,
                status: 'pending' // Default to pending
              });

              console.log('Added passenger:', userData.name, 'at', pickupAddress);
            } else {
              console.warn('Missing coordinates for passenger:', userData.name);
            }
          }
        }

        console.log('Total passengers loaded:', passengersData.length);
        setPassengers(passengersData);
      } catch (error) {
        console.error('Failed to load ride data:', error);
        alert('Failed to load ride data');
      } finally {
        setIsLoading(false);
      }
    };

    loadRideData();
  }, [rideID, currentUser, navigate]);

  // Auto-start tracking when page loads
  useEffect(() => {
    if (currentUser && !isTracking) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [currentUser]);

  const handlePassengerPickedUp = async (passengerID: string) => {
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
    setAlerts(prev => [alert, ...prev].slice(0, 5)); // Keep last 5 alerts

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading ride data...</div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Ride not found</div>
      </div>
    );
  }

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
                <h1 className="text-xl font-bold text-white">Live Tracking</h1>
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
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto px-4 py-6">
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
            rideID={rideID || ''}
            driverID={currentUser?.uid || ''}
            passengers={passengers}
            destinationCoords={{
              lat: ride.destinationLat,
              lng: ride.destinationLng
            }}
            destination={ride.destination}
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
            <h2 className="text-xl font-bold text-white">Passengers</h2>
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