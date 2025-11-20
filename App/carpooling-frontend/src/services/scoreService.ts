/**
 * Carpool Score Service
 *
 * Handles all score calculations, stats updates, and badge assignments
 */

import { doc, getDoc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface UserStats {
  ridesJoined: number;
  ridesCreated: number;
  passengersCarried: number;
  totalDistanceKm: number;
  fuelSaved: number;
  co2Saved: number;
  moneySaved: number;
  score: number;
  weeklyScore: number;
  badges: string[];
  lastUpdated: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'driver' | 'rider' | 'both';
}

// Haversine formula to calculate distance between two coordinates
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

// Calculate environmental and cost savings
export function calculateSavings(totalDistanceKm: number) {
  const fuelSavedL = totalDistanceKm / 14; // 14 km per liter average
  const co2SavedKG = fuelSavedL * 2.31;
  const moneySaved = fuelSavedL * 0.20; // BHD per liter

  return { fuelSavedL, co2SavedKG, moneySaved };
}

// Calculate carpool score
export function calculateScore(stats: Partial<UserStats>): number {
  const {
    ridesJoined = 0,
    ridesCreated = 0,
    passengersCarried = 0,
    fuelSaved = 0,
    co2Saved = 0
  } = stats;

  const scoreRaw =
    ridesJoined * 5 +
    ridesCreated * 8 +
    passengersCarried * 3 +
    fuelSaved * 10 +
    co2Saved * 3;

  const finalScore = Math.min(100, Math.round(scoreRaw / 6));

  return finalScore;
}

// Get user level based on score
export function getUserLevel(score: number): string {
  if (score < 25) return 'New';
  if (score < 50) return 'Active';
  if (score < 75) return 'Experienced';
  return 'Veteran';
}

// Badge definitions
export const BADGES: Badge[] = [
  // Driver Badges
  {
    id: 'trusted_driver',
    name: 'Trusted Driver',
    description: '5+ successful rides with low cancellations',
    icon: '🏆',
    type: 'driver'
  },
  {
    id: 'eco_driver',
    name: 'Eco Driver',
    description: 'Saved over 10kg of CO₂',
    icon: '🌿',
    type: 'driver'
  },
  {
    id: 'veteran_driver',
    name: 'Veteran Driver',
    description: 'Created 20+ rides',
    icon: '⭐',
    type: 'driver'
  },
  {
    id: 'campus_hero',
    name: 'Campus Hero',
    description: 'Carried 10+ passengers in a week',
    icon: '🎓',
    type: 'driver'
  },
  {
    id: 'on_time_driver',
    name: 'On-Time Driver',
    description: 'Consistently punctual',
    icon: '⏰',
    type: 'driver'
  },

  // Rider Badges
  {
    id: 'active_rider',
    name: 'Active Rider',
    description: 'Joined 5+ rides',
    icon: '🚗',
    type: 'rider'
  },
  {
    id: 'eco_rider',
    name: 'Eco Rider',
    description: 'Saved over 5kg of CO₂',
    icon: '♻️',
    type: 'rider'
  },
  {
    id: 'community_rider',
    name: 'Community Rider',
    description: 'Shared rides with 10+ unique people',
    icon: '👥',
    type: 'rider'
  },
  {
    id: 'green_student',
    name: 'Green Student',
    description: 'Traveled 15+ km via carpool',
    icon: '🌍',
    type: 'rider'
  },
  {
    id: 'fast_booker',
    name: 'Fast Booker',
    description: 'Quickly joined 3 rides',
    icon: '⚡',
    type: 'rider'
  }
];

// Get user badges based on stats
export async function getUserBadges(userID: string, stats: UserStats): Promise<string[]> {
  const badges: string[] = [];

  try {
    // Get user role
    const userDoc = await getDoc(doc(db, 'users', userID));
    const userData = userDoc.data();
    const userRole = userData?.role || 'rider';

    // Driver Badges
    if (userRole === 'driver') {
      // Trusted Driver: 5+ rides created
      if (stats.ridesCreated >= 5) {
        badges.push('trusted_driver');
      }

      // Eco Driver: >10kg CO₂ saved
      if (stats.co2Saved > 10) {
        badges.push('eco_driver');
      }

      // Veteran Driver: 20+ rides created
      if (stats.ridesCreated >= 20) {
        badges.push('veteran_driver');
      }

      // Campus Hero: Check weekly passengers carried
      const weeklyStats = await getWeeklyStats(userID);
      if (weeklyStats.passengersCarried >= 10) {
        badges.push('campus_hero');
      }

      // On-Time Driver: Check ride punctuality (simplified)
      if (stats.ridesCreated >= 10) {
        badges.push('on_time_driver');
      }
    }

    // Rider Badges
    if (userRole === 'rider') {
      // Active Rider: 5+ rides joined
      if (stats.ridesJoined >= 5) {
        badges.push('active_rider');
      }

      // Eco Rider: >5kg CO₂ saved
      if (stats.co2Saved > 5) {
        badges.push('eco_rider');
      }

      // Green Student: 15+ km traveled
      if (stats.totalDistanceKm >= 15) {
        badges.push('green_student');
      }

      // Community Rider: Simplified check
      if (stats.ridesJoined >= 10) {
        badges.push('community_rider');
      }

      // Fast Booker: Check recent bookings (simplified)
      if (stats.ridesJoined >= 3) {
        badges.push('fast_booker');
      }
    }
  } catch (error) {
    console.error('Error getting badges:', error);
  }

  return badges;
}

// Get weekly stats (last 7 days)
export async function getWeeklyStats(userID: string): Promise<Partial<UserStats>> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let weeklyRidesJoined = 0;
  let weeklyRidesCreated = 0;
  let weeklyPassengersCarried = 0;
  let weeklyDistanceKm = 0;

  try {
    // Get ALL rides by this driver, then filter in memory
    const ridesCreatedQuery = query(
      collection(db, 'rides'),
      where('driverID', '==', userID)
    );
    const ridesCreatedSnapshot = await getDocs(ridesCreatedQuery);

    // Filter rides created in last 7 days in memory
    ridesCreatedSnapshot.forEach(doc => {
      const ride = doc.data();
      const rideDate = ride.createdAt?.toDate ? ride.createdAt.toDate() : new Date(ride.createdAt);

      if (rideDate >= sevenDaysAgo) {
        weeklyRidesCreated++;
        weeklyPassengersCarried += (ride.passengers?.length || 0);

        // Calculate distance
        if (ride.pickupLat && ride.pickupLng && ride.destinationLat && ride.destinationLng) {
          const distance = calculateDistance(
            ride.pickupLat,
            ride.pickupLng,
            ride.destinationLat,
            ride.destinationLng
          );
          weeklyDistanceKm += distance;
        }
      }
    });

    // Get bookings from last 7 days
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('riderID', '==', userID),
      where('status', '==', 'active')
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);

    for (const bookingDoc of bookingsSnapshot.docs) {
      const booking = bookingDoc.data();
      const bookingDate = new Date(booking.createdAt);

      if (bookingDate >= sevenDaysAgo) {
        weeklyRidesJoined++;

        // Get ride details for distance
        if (booking.rideID) {
          const rideDoc = await getDoc(doc(db, 'rides', booking.rideID));
          if (rideDoc.exists()) {
            const ride = rideDoc.data();
            if (ride.pickupLat && ride.pickupLng && ride.destinationLat && ride.destinationLng) {
              const distance = calculateDistance(
                ride.pickupLat,
                ride.pickupLng,
                ride.destinationLat,
                ride.destinationLng
              );
              weeklyDistanceKm += distance;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error getting weekly stats:', error);
  }

  const savings = calculateSavings(weeklyDistanceKm);

  return {
    ridesJoined: weeklyRidesJoined,
    ridesCreated: weeklyRidesCreated,
    passengersCarried: weeklyPassengersCarried,
    totalDistanceKm: weeklyDistanceKm,
    ...savings
  };
}

// Update user stats after ride completion
export async function updateUserStats(userID: string): Promise<void> {
  try {
    console.log('Updating stats for user:', userID);

    // Get all rides created by user
    const ridesCreatedQuery = query(
      collection(db, 'rides'),
      where('driverID', '==', userID)
    );
    const ridesCreatedSnapshot = await getDocs(ridesCreatedQuery);
    const ridesCreated = ridesCreatedSnapshot.size;

    // Count total passengers carried
    let passengersCarried = 0;
    let totalDistanceKm = 0;

    ridesCreatedSnapshot.forEach(doc => {
      const ride = doc.data();
      passengersCarried += (ride.passengers?.length || 0);

      // Calculate distance
      if (ride.pickupLat && ride.pickupLng && ride.destinationLat && ride.destinationLng) {
        const distance = calculateDistance(
          ride.pickupLat,
          ride.pickupLng,
          ride.destinationLat,
          ride.destinationLng
        );
        totalDistanceKm += distance;
      }
    });

    // Get all bookings by user
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('riderID', '==', userID),
      where('status', '==', 'active')
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const ridesJoined = bookingsSnapshot.size;

    // Calculate distance from bookings
    for (const bookingDoc of bookingsSnapshot.docs) {
      const booking = bookingDoc.data();
      if (booking.rideID) {
        const rideDoc = await getDoc(doc(db, 'rides', booking.rideID));
        if (rideDoc.exists()) {
          const ride = rideDoc.data();
          if (ride.pickupLat && ride.pickupLng && ride.destinationLat && ride.destinationLng) {
            const distance = calculateDistance(
              ride.pickupLat,
              ride.pickupLng,
              ride.destinationLat,
              ride.destinationLng
            );
            totalDistanceKm += distance;
          }
        }
      }
    }

    // Calculate savings
    const { fuelSavedL, co2SavedKG, moneySaved } = calculateSavings(totalDistanceKm);

    // Calculate scores
    const stats: Partial<UserStats> = {
      ridesJoined,
      ridesCreated,
      passengersCarried,
      totalDistanceKm,
      fuelSaved: fuelSavedL,
      co2Saved: co2SavedKG,
      moneySaved
    };

    const score = calculateScore(stats);

    // Get weekly stats
    const weeklyStats = await getWeeklyStats(userID);
    const weeklyScore = calculateScore(weeklyStats);

    // Get badges
    const badges = await getUserBadges(userID, {
      ...stats as UserStats,
      score,
      weeklyScore,
      badges: [],
      lastUpdated: new Date().toISOString()
    });

    // Update user document
    const userRef = doc(db, 'users', userID);
    await updateDoc(userRef, {
      stats: {
        ridesJoined,
        ridesCreated,
        passengersCarried,
        totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
        fuelSaved: Math.round(fuelSavedL * 10) / 10,
        co2Saved: Math.round(co2SavedKG * 10) / 10,
        moneySaved: Math.round(moneySaved * 100) / 100,
        score,
        weeklyScore,
        badges,
        lastUpdated: new Date().toISOString()
      }
    });

    console.log('✅ User stats updated successfully');
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
}

// Initialize stats for new user
export async function initializeUserStats(userID: string): Promise<void> {
  const userRef = doc(db, 'users', userID);
  await updateDoc(userRef, {
    stats: {
      ridesJoined: 0,
      ridesCreated: 0,
      passengersCarried: 0,
      totalDistanceKm: 0,
      fuelSaved: 0,
      co2Saved: 0,
      moneySaved: 0,
      score: 0,
      weeklyScore: 0,
      badges: [],
      lastUpdated: new Date().toISOString()
    }
  });
}