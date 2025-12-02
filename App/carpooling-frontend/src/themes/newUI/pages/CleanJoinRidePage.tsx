import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { Filter, Search } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { motion } from 'framer-motion';
import { checkRideConflict } from '../../../services/scheduleExtractor';
import { CleanHeader } from '../components/CleanHeader';
import { CleanButton } from '../components/CleanButton';
import { CleanInput } from '../components/CleanInput';
import { CleanCard } from '../components/CleanCard';
import { RideCard } from '../components/RideCard';
import { useUITheme } from '../../../context/UIThemeContext';

interface Ride {
  id?: string;
  driverID: string;
  driverName: string;
  driverRating: number;
  driverGender?: string;
  driverUniversity?: string;
  driverAge?: number;
  pickup: string;
  pickupLat?: number;
  pickupLng?: number;
  destination: string;
  destinationLat?: number;
  destinationLng?: number;
  pickupType?: 'single' | 'multi' | 'both';
  date: string;
  time: string;
  seatsAvailable: number;
  totalSeats?: number;
  cost: number;
  status: string;
  passengers?: { uid: string; name: string; joinedAt: string }[];
}

export const CleanJoinRidePage: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useUITheme();
  const [rides, setRides] = useState<Ride[]>([]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  const [filters, setFilters] = useState({
    destination: '',
    date: '',
    maxCost: '',
    gender: '',
    university: '',
    minRating: '',
  });

  useEffect(() => {
    if (userData?.uid) {
      fetchRides();
    }
  }, [userData?.uid]);

  useEffect(() => {
    applyFilters();
  }, [filters, rides, searchQuery]);

  const fetchRides = async () => {
    try {
      const ridesRef = collection(db, 'rides');
      const q = query(
        ridesRef,
        where('status', '==', 'active'),
        where('seatsAvailable', '>', 0)
      );
      const querySnapshot = await getDocs(q);

      const ridesData: Ride[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data.driverID === userData?.uid) return;
        if (data.passengers && Array.isArray(data.passengers) && data.passengers.some((p: any) => p.uid === userData?.uid)) return;
        ridesData.push({ id: docSnapshot.id, ...data } as Ride);
      });

      setRides(ridesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rides:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rides];

    if (searchQuery) {
      filtered = filtered.filter((ride) =>
        ride.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.pickup.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.destination) {
      filtered = filtered.filter((ride) =>
        ride.destination.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }

    if (filters.date) {
      filtered = filtered.filter((ride) => ride.date === filters.date);
    }

    if (filters.maxCost) {
      filtered = filtered.filter((ride) => ride.cost <= parseFloat(filters.maxCost));
    }

    if (filters.gender) {
      filtered = filtered.filter((ride) => ride.driverGender === filters.gender);
    }

    if (filters.university) {
      filtered = filtered.filter((ride) =>
        ride.driverUniversity?.toLowerCase().includes(filters.university.toLowerCase())
      );
    }

    if (filters.minRating) {
      filtered = filtered.filter((ride) => ride.driverRating >= parseFloat(filters.minRating));
    }

    setFilteredRides(filtered);
  };

  const handleJoinRide = async (ride: Ride) => {
    if (!userData || !ride.id) return;

    if (ride.passengers?.some(p => p.uid === userData.uid)) {
      toast.warning('You have already joined this ride!');
      return;
    }

    if (ride.seatsAvailable <= 0) {
      toast.warning('Sorry, this ride is now full!');
      return;
    }

    try {
      const rideRef = doc(db, 'rides', ride.id);
      const currentPassengers = ride.passengers || [];
      const newPassenger = {
        uid: userData.uid,
        name: userData.name,
        joinedAt: new Date().toISOString(),
      };

      await updateDoc(rideRef, {
        passengers: [...currentPassengers, newPassenger],
        seatsAvailable: ride.seatsAvailable - 1,
      });

      const bookingData: any = {
        rideID: ride.id,
        riderID: userData.uid,
        riderName: userData.name,
        driverID: ride.driverID,
        driverName: ride.driverName,
        pickup: ride.pickup,
        pickupLat: ride.pickupLat,
        pickupLng: ride.pickupLng,
        destination: ride.destination,
        date: ride.date,
        time: ride.time,
        cost: ride.cost,
        seatsBooked: 1,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      toast.success('Successfully joined the ride!');
      navigate(`/chat/${ride.id}`);
    } catch (error) {
      console.error('Error joining ride:', error);
      toast.error('Failed to join ride. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <CleanHeader
        title="Find a Ride"
        showBack
        onBack={() => navigate('/')}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="mb-6 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <CleanInput
                type="text"
                placeholder="Search destination or pickup..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-5 h-5" />}
              />
            </div>
            <CleanButton
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              icon={<Filter className="w-5 h-5" />}
            >
              Filters
            </CleanButton>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <CleanCard padding="md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <CleanInput
                    type="text"
                    placeholder="Destination"
                    value={filters.destination}
                    onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
                  />
                  <CleanInput
                    type="date"
                    placeholder="Date"
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                  />
                  <CleanInput
                    type="number"
                    placeholder="Max Cost"
                    value={filters.maxCost}
                    onChange={(e) => setFilters({ ...filters, maxCost: e.target.value })}
                  />
                </div>
              </CleanCard>
            </motion.div>
          )}
        </div>

        {/* Rides Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
          </div>
        ) : filteredRides.length === 0 ? (
          <CleanCard padding="lg" className="text-center">
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No rides available matching your criteria</p>
          </CleanCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRides.map((ride, index) => {
              const rideDate = new Date(ride.date);
              const dayName = rideDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
              const classSchedule = userData?.classSchedule || {};
              const conflictStatus = checkRideConflict(ride.time, dayName, classSchedule);

              let tag;
              if (conflictStatus === 'conflicts') {
                tag = { label: 'Conflicts with Class', color: 'red' as const };
              } else if (conflictStatus === 'close' || conflictStatus === 'between') {
                tag = { label: 'Close to Class', color: 'yellow' as const };
              } else if (conflictStatus === 'after') {
                tag = { label: 'After Classes', color: 'green' as const };
              }

              return (
                <motion.div
                  key={ride.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <RideCard
                    ride={ride}
                    onJoin={() => handleJoinRide(ride)}
                    onViewDetails={() => navigate(`/user-stats/${ride.driverID}`)}
                    tag={tag}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};