import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ref, onValue, set } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { rtdb, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Navigation, MapPin } from 'lucide-react';
import { pageTransition } from '../animations/motionVariants';

interface Location {
  lat: number;
  lng: number;
  timestamp: number;
}

interface RideInfo {
  driverId: string;
  driverName: string;
  pickup: string;
  destination: string;
  passengers: { uid: string; name: string }[];
}

export const MapPage: React.FC = () => {
  const { rideID } = useParams<{ rideID: string }>();
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [rideInfo, setRideInfo] = useState<RideInfo | null>(null);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    if (!rideID) return;

    fetchRideInfo();

    const locationRef = ref(rtdb, `locations/${rideID}`);
    const unsubscribe = onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDriverLocation(data);
      }
    });

    return () => unsubscribe();
  }, [rideID]);

  useEffect(() => {
    if (userData?.role === 'driver' && tracking && rideID) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now(),
          };
          const locationRef = ref(rtdb, `locations/${rideID}`);
          set(locationRef, locationData);
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [tracking, rideID, userData]);

  const fetchRideInfo = async () => {
    if (!rideID) return;
    try {
      const rideDoc = await getDoc(doc(db, 'rides', rideID));
      if (rideDoc.exists()) {
        setRideInfo(rideDoc.data() as RideInfo);
      }
    } catch (error) {
      console.error('Error fetching ride info:', error);
    }
  };

  const handleStartTracking = () => {
    if (navigator.geolocation) {
      setTracking(true);
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 dark:from-slate-950 dark:to-blue-950"
      {...pageTransition}
    >
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-cyan-400/30 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/chat/${rideID}`)}
              className="p-2 hover:bg-cyan-400/20 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-cyan-400" />
            </button>
            {rideInfo && (
              <div>
                <h2 className="text-xl font-bold text-white">Live Tracking</h2>
                <p className="text-cyan-300 text-sm">
                  {rideInfo.pickup} → {rideInfo.destination}
                </p>
              </div>
            )}
          </div>

          {userData?.role === 'driver' && (
            <motion.button
              onClick={handleStartTracking}
              disabled={tracking}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                tracking
                  ? 'bg-green-500/20 border border-green-400/30 text-green-400'
                  : 'bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/30'
              } transition`}
              whileHover={{ scale: tracking ? 1 : 1.05 }}
              whileTap={{ scale: tracking ? 1 : 0.95 }}
            >
              <Navigation className="w-5 h-5" />
              {tracking ? 'Tracking Active' : 'Start Tracking'}
            </motion.button>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          <div className="backdrop-blur-xl bg-white/10 border border-cyan-400/30 rounded-2xl p-8 min-h-[600px] flex flex-col items-center justify-center">
            <div className="text-center">
              <MapPin className="w-24 h-24 text-cyan-400 mx-auto mb-6" />

              {driverLocation ? (
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white">Driver Location</h3>
                  <div className="bg-white/5 border border-cyan-400/30 rounded-lg p-6 max-w-md mx-auto">
                    <div className="space-y-3 text-left">
                      <div>
                        <p className="text-cyan-300 text-sm">Latitude</p>
                        <p className="text-white font-mono">{driverLocation.lat.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-cyan-300 text-sm">Longitude</p>
                        <p className="text-white font-mono">{driverLocation.lng.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-cyan-300 text-sm">Last Updated</p>
                        <p className="text-white">
                          {new Date(driverLocation.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    className="w-16 h-16 bg-cyan-500 rounded-full mx-auto"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                  <p className="text-cyan-300">Driver is on the move</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white">Waiting for location data...</h3>
                  <p className="text-cyan-300 max-w-md mx-auto">
                    {userData?.role === 'driver'
                      ? 'Click "Start Tracking" to share your location with passengers'
                      : 'The driver hasn\'t started sharing their location yet'}
                  </p>
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mx-auto mt-6"></div>
                </div>
              )}

              <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-400/20 rounded-lg max-w-md mx-auto">
                <p className="text-sm text-cyan-300">
                  <strong className="text-white">Note:</strong> This is a simplified live tracking view.
                  Real-world implementation would integrate with Google Maps or Mapbox for
                  full map visualization with routes and markers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
