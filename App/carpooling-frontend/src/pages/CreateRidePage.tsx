import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, Users, DollarSign, ArrowLeft } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { pageTransition, scaleIn } from '../animations/motionVariants';
import confetti from 'canvas-confetti';
import { auth, db } from "../firebase";


export const CreateRidePage: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pickup: '',
    destination: '',
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
      driverID: userData?.uid,                 // ✅ matches rule exactly
      driverName: userData?.name,
      driverRating: userData?.rating || 5.0,
      pickup: formData.pickup,
      destination: formData.destination,
      date: formData.date,
      time: formData.time,
      totalSeats: parseInt(formData.totalSeats),
      seatsAvailable: parseInt(formData.totalSeats), // ✅ matches rule exactly
      cost: parseFloat(formData.cost),
      passengers: [],
      status: 'active',                        // ✅ required by rule
      createdAt: serverTimestamp(),
    };

    console.log("rideData:", rideData);

    const docRef = await addDoc(collection(db, 'rides'), rideData);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22d3ee', '#06b6d4', '#0891b2'],
    });

    setTimeout(() => {
      navigate(`/chat/${docRef.id}`);
    }, 1500);
  } catch (error) {
    console.error('Error creating ride:', error);
    alert('Failed to create ride. Please try again.');
    setLoading(false);
  }
};


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 dark:from-slate-950 dark:to-blue-950 py-12 px-4"
      {...pageTransition}
    >
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <motion.div
          className="backdrop-blur-xl bg-white/10 border border-cyan-400/30 rounded-2xl shadow-2xl p-8"
          {...scaleIn}
        >
          <h1 className="text-4xl font-bold text-white mb-2">Create a Ride</h1>
          <p className="text-cyan-300 mb-8">Fill in the details to offer your ride</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-cyan-300 mb-2 text-sm font-medium">Pickup Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <input
                    type="text"
                    name="pickup"
                    value={formData.pickup}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 transition"
                    placeholder="Enter pickup location"
                  />
                </div>
              </div>

              <div>
                <label className="block text-cyan-300 mb-2 text-sm font-medium">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 transition"
                    placeholder="Enter destination"
                  />
                </div>
              </div>

              <div>
                <label className="block text-cyan-300 mb-2 text-sm font-medium">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-cyan-300 mb-2 text-sm font-medium">Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-cyan-300 mb-2 text-sm font-medium">Total Seats</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <input
                    type="number"
                    name="totalSeats"
                    value={formData.totalSeats}
                    onChange={handleChange}
                    required
                    min="1"
                    max="8"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 transition"
                    placeholder="Number of seats"
                  />
                </div>
              </div>

              <div>
                <label className="block text-cyan-300 mb-2 text-sm font-medium">Cost per Seat ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 transition"
                    placeholder="Cost per seat"
                  />
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-cyan-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? 'Creating Ride...' : 'Create Ride'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};
