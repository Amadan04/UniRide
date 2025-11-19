import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ref, onValue, set } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { rtdb, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Navigation, MapPin } from 'lucide-react';
import { pageTransition } from '../animations/motionVariants';
import { useToast } from '../context/ToastContext';
import { LiveMap } from '../components/LiveMap';

interface Location {
  lat: number;
  lng: number;
  timestamp: number;
  heading?: number;
  speed?: number;
}

interface RideInfo {
  driverID: string;
  driverName: string;
  pickup: string;
  destination: string;
  passengers: { uid: string; name: string }[];
}

export const MapPage: React.FC = () => {
  const { rideID } = useParams<{ rideID: string }>();
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [rideInfo, setRideInfo] = useState<RideInfo | null>(null);
  const [tracking, setTracking] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  // Fetch ride info to get driverID
  useEffect(() => {
    if (!rideID) return;
    fetchRideInfo();
  }, [rideID]);

  // Subscribe to driver's location (using driverID, not rideID)
  useEffect(() => {
    if (!rideInfo?.driverID) return;

    const locationRef = ref(rtdb, `locations/${rideInfo.driverID}`);
    const unsubscribe = onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDriverLocation(data);
      }
    });

    return () => unsubscribe();
  }, [rideInfo?.driverID]);

  // Driver tracking (write to own UID path)
  useEffect(() => {
    if (!currentUser || !userData || userData.role !== 'driver' || !tracking) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: any = {
  lat: position.coords.latitude,
  lng: position.coords.longitude,
  timestamp: Date.now()
};

// Only add heading if it exists
if (position.coords.heading !== null && position.coords.heading !== undefined) {
  locationData.heading = position.coords.heading;
}

// Only add speed if it exists
if (position.coords.speed !== null && position.coords.speed !== undefined) {
  locationData.speed = position.coords.speed;
}
        
        // ✅ Write to /locations/{currentUser.uid}
        const locationRef = ref(rtdb, `locations/${currentUser.uid}`);
        set(locationRef, locationData).catch((error) => {
          console.error('Error updating location:', error);
          toastError('Failed to update location');
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        // Only show error if tracking is still active
        if (tracking) {
          toastError('Location tracking error');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 30000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking, currentUser, userData, toastError]);

  const fetchRideInfo = async () => {
    if (!rideID) return;
    try {
      const rideDoc = await getDoc(doc(db, 'rides', rideID));
      if (rideDoc.exists()) {
        const data = rideDoc.data();
        setRideInfo({
          driverID: data.driverID,
          driverName: data.driverName,
          pickup: data.pickup,
          destination: data.destination,
          passengers: data.passengers || []
        });
      }
    } catch (error) {
      console.error('Error fetching ride info:', error);
      toastError('Failed to load ride info');
    }
  };

  const handleStartTracking = async () => {
    if (!navigator.geolocation) {
      toastError('Geolocation is not supported by your browser');
      return;
    }

    setRequestingPermission(true);
    try {
      // First, explicitly request permission by getting current position
      // This triggers the permission dialog on mobile devices
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Successfully got permission and initial position
            console.log('Location permission granted:', position.coords);
            resolve();
          },
          (error) => {
            console.error('Location permission error:', error);

            // Provide specific error messages
            switch (error.code) {
              case error.PERMISSION_DENIED:
                toastError('Location permission denied. Please enable location access in your browser settings.');
                break;
              case error.POSITION_UNAVAILABLE:
                toastError('Location information unavailable. Please check your device settings.');
                break;
              case error.TIMEOUT:
                toastError('Location request timed out. Please try again.');
                break;
              default:
                toastError('Unable to get location. Please check your settings.');
            }
            reject(error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 30000
          }
        );
      });

      // If we get here, permission was granted
      setTracking(true);
      toastSuccess('Location tracking started');
    } catch (error) {
      console.error('Failed to start tracking:', error);
      // Error toast already shown in the geolocation error handler
    } finally {
      setRequestingPermission(false);
    }
  };

  const handleStopTracking = () => {
    setTracking(false);
    toastSuccess('Location tracking stopped');
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
              onClick={tracking ? handleStopTracking : handleStartTracking}
              disabled={requestingPermission}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                tracking
                  ? 'bg-green-500/20 border border-green-400/30 text-green-400'
                  : 'bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/30'
              } transition disabled:opacity-50 disabled:cursor-not-allowed`}
              whileHover={{ scale: requestingPermission ? 1 : 1.05 }}
              whileTap={{ scale: requestingPermission ? 1 : 0.95 }}
            >
              <Navigation className={`w-5 h-5 ${requestingPermission ? 'animate-spin' : ''}`} />
              {requestingPermission ? 'Requesting Permission...' : tracking ? 'Tracking Active' : 'Start Tracking'}
            </motion.button>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          {driverLocation ? (
            <div className="space-y-4">
              <LiveMap 
                driverLocation={driverLocation}
                pickup={rideInfo?.pickup}
                destination={rideInfo?.destination}
              />
              
              <div className="backdrop-blur-xl bg-white/10 border border-cyan-400/30 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-cyan-300 text-sm">Latitude</p>
                    <p className="text-white font-mono text-sm">{driverLocation.lat.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-cyan-300 text-sm">Longitude</p>
                    <p className="text-white font-mono text-sm">{driverLocation.lng.toFixed(6)}</p>
                  </div>
                  {driverLocation.speed !== undefined && (
                    <div>
                      <p className="text-cyan-300 text-sm">Speed</p>
                      <p className="text-white font-mono text-sm">{(driverLocation.speed * 3.6).toFixed(1)} km/h</p>
                    </div>
                  )}
                  <div>
                    <p className="text-cyan-300 text-sm">Updated</p>
                    <p className="text-white text-sm">
                      {new Date(driverLocation.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="backdrop-blur-xl bg-white/10 border border-cyan-400/30 rounded-2xl p-8 min-h-[600px] flex flex-col items-center justify-center">
              <MapPin className="w-24 h-24 text-cyan-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Waiting for location data...</h3>
              <p className="text-cyan-300 max-w-md mx-auto text-center">
                {userData?.role === 'driver'
                  ? 'Click "Start Tracking" to share your location with passengers'
                  : "The driver hasn't started sharing their location yet"}
              </p>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mx-auto mt-6"></div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};