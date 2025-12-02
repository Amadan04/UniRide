import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, Users, DollarSign, ArrowLeft, MapPinned } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { useToast } from '../../../context/ToastContext';
import { LocationPicker } from '../../../components/LocationPicker';
import { CleanCard } from '../components/CleanCard';
import { CleanButton } from '../components/CleanButton';
import { CleanInput } from '../components/CleanInput';
import confetti from 'canvas-confetti';
import { useUITheme } from '../../../context/UIThemeContext';

export const CleanCreateRidePage: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useUITheme();
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [formData, setFormData] = useState({
    pickup: '',
    pickupLat: 0,
    pickupLng: 0,
    destination: '',
    destinationLat: 0,
    destinationLng: 0,
    pickupType: 'single' as 'single' | 'multi' | 'both',
    date: '',
    time: '',
    totalSeats: '',
    cost: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rideData = {
        driverID: userData?.uid,
        driverName: userData?.name,
        driverRating: userData?.avgRating || 5.0,
        driverGender: userData?.gender || 'not-specified',
        driverUniversity: userData?.university || 'Unknown',
        driverAge: userData?.age || 0,
        pickup: formData.pickup,
        pickupLat: formData.pickupLat,
        pickupLng: formData.pickupLng,
        destination: formData.destination,
        destinationLat: formData.destinationLat,
        destinationLng: formData.destinationLng,
        pickupType: formData.pickupType,
        date: formData.date,
        time: formData.time,
        totalSeats: parseInt(formData.totalSeats),
        seatsAvailable: parseInt(formData.totalSeats),
        cost: parseFloat(formData.cost),
        passengers: [],
        status: 'active',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'rides'), rideData);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#14b8a6', '#06b6d4', '#0891b2'],
      });

      setTimeout(() => {
        navigate(`/chat/${docRef.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error creating ride:', error);
      toast.error('Failed to create ride. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} py-12 px-4`}>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <CleanCard padding="lg">
          <h1 className={`text-4xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>Create a Ride</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-8`}>Fill in the details to offer your ride</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2 text-sm font-medium`}>Pickup Location</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <CleanInput
                      type="text"
                      name="pickup"
                      value={formData.pickup}
                      onChange={handleChange}
                      required
                      placeholder="Enter pickup location"
                      icon={<MapPin className="w-5 h-5" />}
                    />
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => setShowPickupPicker(true)}
                    className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Pick location on map"
                  >
                    <MapPinned className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              <div>
                <label className={`block ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2 text-sm font-medium`}>Destination</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <CleanInput
                      type="text"
                      name="destination"
                      value={formData.destination}
                      onChange={handleChange}
                      required
                      placeholder="Enter destination"
                      icon={<MapPin className="w-5 h-5" />}
                    />
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => setShowDestinationPicker(true)}
                    className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Pick location on map"
                  >
                    <MapPinned className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Pickup Type Selection */}
            <div>
              <label className={`block ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-3 text-sm font-medium`}>Pickup Type</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.button
                  type="button"
                  onClick={() => setFormData({ ...formData, pickupType: 'single' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.pickupType === 'single'
                      ? `${isDark ? 'bg-teal-900/30 border-teal-500' : 'bg-teal-50 border-teal-500'} shadow-lg`
                      : `${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${isDark ? 'hover:border-teal-400' : 'hover:border-teal-300'}`
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-teal-500 mx-auto mb-2" />
                    <h3 className={`${isDark ? 'text-gray-100' : 'text-gray-900'} font-semibold mb-1`}>Single Pickup</h3>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>All passengers meet at your pickup location</p>
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => setFormData({ ...formData, pickupType: 'multi' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.pickupType === 'multi'
                      ? `${isDark ? 'bg-teal-900/30 border-teal-500' : 'bg-teal-50 border-teal-500'} shadow-lg`
                      : `${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${isDark ? 'hover:border-teal-400' : 'hover:border-teal-300'}`
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <h3 className={`${isDark ? 'text-gray-100' : 'text-gray-900'} font-semibold mb-1`}>Multiple Pickups</h3>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>Passengers can choose their own pickup locations</p>
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => setFormData({ ...formData, pickupType: 'both' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.pickupType === 'both'
                      ? `${isDark ? 'bg-teal-900/30 border-teal-500' : 'bg-teal-50 border-teal-500'} shadow-lg`
                      : `${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${isDark ? 'hover:border-teal-400' : 'hover:border-teal-300'}`
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-teal-500 mx-auto mb-2" />
                    <h3 className={`${isDark ? 'text-gray-100' : 'text-gray-900'} font-semibold mb-1`}>Both Options</h3>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>Passengers can choose either option</p>
                  </div>
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2 text-sm font-medium`}>Date</label>
                <CleanInput
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  icon={<Calendar className="w-5 h-5" />}
                />
              </div>

              <div>
                <label className={`block ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2 text-sm font-medium`}>Time</label>
                <CleanInput
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  icon={<Clock className="w-5 h-5" />}
                />
              </div>

              <div>
                <label className={`block ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2 text-sm font-medium`}>Total Seats</label>
                <CleanInput
                  type="number"
                  name="totalSeats"
                  value={formData.totalSeats}
                  onChange={handleChange}
                  required
                  min="1"
                  max="8"
                  placeholder="Number of seats"
                  icon={<Users className="w-5 h-5" />}
                />
              </div>

              <div>
                <label className={`block ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2 text-sm font-medium`}>Cost per Seat ($)</label>
                <CleanInput
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="Cost per seat"
                  icon={<DollarSign className="w-5 h-5" />}
                />
              </div>
            </div>

            <CleanButton
              type="submit"
              disabled={loading}
              fullWidth
              size="lg"
            >
              {loading ? 'Creating Ride...' : 'Create Ride'}
            </CleanButton>
          </form>
        </CleanCard>
      </div>

      {/* Location Pickers */}
      <LocationPicker
        isOpen={showPickupPicker}
        onClose={() => setShowPickupPicker(false)}
        onSelect={(location) => {
          setFormData({
            ...formData,
            pickup: location.address,
            pickupLat: location.lat,
            pickupLng: location.lng,
          });
          setShowPickupPicker(false);
        }}
        title="Select Pickup Location"
        initialLocation={formData.pickupLat && formData.pickupLng ? {
          address: formData.pickup,
          lat: formData.pickupLat,
          lng: formData.pickupLng,
        } : undefined}
      />

      <LocationPicker
        isOpen={showDestinationPicker}
        onClose={() => setShowDestinationPicker(false)}
        onSelect={(location) => {
          setFormData({
            ...formData,
            destination: location.address,
            destinationLat: location.lat,
            destinationLng: location.lng,
          });
          setShowDestinationPicker(false);
        }}
        title="Select Destination"
        initialLocation={formData.destinationLat && formData.destinationLng ? {
          address: formData.destination,
          lat: formData.destinationLat,
          lng: formData.destinationLng,
        } : undefined}
      />
    </div>
  );
};