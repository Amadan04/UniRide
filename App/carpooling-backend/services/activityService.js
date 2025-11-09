/**
 * Activity Service
 * Manages user ride activity, history, and ride archival operations
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase.js';

/**
 * Get user's ride activity including rides as driver and passenger
 * @param {string} userID - The user's unique identifier
 * @param {number} limit - Maximum number of activities to return (default: 10)
 * @returns {Promise<{success: boolean, data?: Array, message?: string, error?: any}>}
 */
export const getUserActivity = async (userID, limit = 10) => {
  try {
    // Input validation
    if (!userID || typeof userID !== 'string') {
      console.error('[ActivityService] Invalid userID provided:', userID);
      return {
        success: false,
        message: 'Invalid user ID provided',
      };
    }

    if (typeof limit !== 'number' || limit < 1 || limit > 100) {
      console.error('[ActivityService] Invalid limit provided:', limit);
      return {
        success: false,
        message: 'Limit must be a number between 1 and 100',
      };
    }

    console.log(`[ActivityService] Fetching activity for user: ${userID}, limit: ${limit}`);

    // Fetch rides where user is the driver
    const driverRidesQuery = query(
      collection(db, COLLECTIONS.RIDES),
      where('driverID', '==', userID),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const driverRidesSnapshot = await getDocs(driverRidesQuery);
    const driverRides = driverRidesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      type: 'driver',
      timestamp: doc.data().createdAt?.toDate?.() || doc.data().createdAt || new Date(),
    }));

    console.log(`[ActivityService] Found ${driverRides.length} rides as driver`);

    // Fetch bookings where user is a passenger
    const passengerBookingsQuery = query(
      collection(db, COLLECTIONS.BOOKINGS),
      where('userID', '==', userID),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const passengerBookingsSnapshot = await getDocs(passengerBookingsQuery);
    const passengerBookings = passengerBookingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      type: 'passenger',
      timestamp: doc.data().createdAt?.toDate?.() || doc.data().createdAt || new Date(),
    }));

    console.log(`[ActivityService] Found ${passengerBookings.length} bookings as passenger`);

    // Merge and sort by timestamp (newest first)
    const allActivities = [...driverRides, ...passengerBookings].sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return timeB - timeA;
    });

    // Limit the combined results
    const limitedActivities = allActivities.slice(0, limit);

    console.log(`[ActivityService] Successfully retrieved ${limitedActivities.length} activities for user: ${userID}`);

    return {
      success: true,
      data: limitedActivities,
      message: 'User activity retrieved successfully',
    };
  } catch (error) {
    console.error('[ActivityService] Error fetching user activity:', error);
    return {
      success: false,
      message: 'Failed to fetch user activity',
      error: error.message || error,
    };
  }
};

/**
 * Archive old completed rides based on age
 * @param {number} days - Number of days to consider a ride old (default: 30)
 * @returns {Promise<{success: boolean, count?: number, message?: string, error?: any}>}
 */
export const archiveOldRides = async (days = 30) => {
  try {
    // Input validation
    if (typeof days !== 'number' || days < 1) {
      console.error('[ActivityService] Invalid days value provided:', days);
      return {
        success: false,
        message: 'Days must be a positive number',
      };
    }

    console.log(`[ActivityService] Starting archive process for rides older than ${days} days`);

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    console.log(`[ActivityService] Cutoff date: ${cutoffDate.toISOString()}`);

    // Query for completed rides older than cutoff date
    const oldRidesQuery = query(
      collection(db, COLLECTIONS.RIDES),
      where('status', '==', 'completed'),
      where('updatedAt', '<', cutoffTimestamp)
    );

    const oldRidesSnapshot = await getDocs(oldRidesQuery);

    if (oldRidesSnapshot.empty) {
      console.log('[ActivityService] No old rides found to archive');
      return {
        success: true,
        count: 0,
        message: 'No old rides found to archive',
      };
    }

    console.log(`[ActivityService] Found ${oldRidesSnapshot.size} rides to archive`);

    // Archive each ride
    let archivedCount = 0;
    const archivePromises = oldRidesSnapshot.docs.map(async (rideDoc) => {
      try {
        const rideRef = doc(db, COLLECTIONS.RIDES, rideDoc.id);
        await updateDoc(rideRef, {
          archived: true,
          archivedAt: Timestamp.now(),
        });
        archivedCount++;
        console.log(`[ActivityService] Archived ride: ${rideDoc.id}`);
      } catch (error) {
        console.error(`[ActivityService] Failed to archive ride ${rideDoc.id}:`, error);
      }
    });

    await Promise.all(archivePromises);

    console.log(`[ActivityService] Successfully archived ${archivedCount} rides`);

    return {
      success: true,
      count: archivedCount,
      message: `Successfully archived ${archivedCount} ride(s)`,
    };
  } catch (error) {
    console.error('[ActivityService] Error archiving old rides:', error);
    return {
      success: false,
      message: 'Failed to archive old rides',
      error: error.message || error,
    };
  }
};

/**
 * Generate and store a snapshot of user's ride history for faster access
 * @param {string} userID - The user's unique identifier
 * @returns {Promise<{success: boolean, snapshotID?: string, data?: Object, message?: string, error?: any}>}
 */
export const getUserHistorySnapshot = async (userID) => {
  try {
    // Input validation
    if (!userID || typeof userID !== 'string') {
      console.error('[ActivityService] Invalid userID provided:', userID);
      return {
        success: false,
        message: 'Invalid user ID provided',
      };
    }

    console.log(`[ActivityService] Generating history snapshot for user: ${userID}`);

    // Fetch recent activity (last 20 items for snapshot)
    const activityResult = await getUserActivity(userID, 20);

    if (!activityResult.success) {
      console.error('[ActivityService] Failed to fetch activity for snapshot:', activityResult.message);
      return {
        success: false,
        message: 'Failed to fetch user activity for snapshot',
        error: activityResult.error,
      };
    }

    const activities = activityResult.data || [];

    // Generate summary statistics
    const summary = {
      totalActivities: activities.length,
      ridesAsDriver: activities.filter((a) => a.type === 'driver').length,
      ridesAsPassenger: activities.filter((a) => a.type === 'passenger').length,
      completedRides: activities.filter((a) => a.status === 'completed').length,
      cancelledRides: activities.filter((a) => a.status === 'cancelled').length,
      lastActivityDate: activities.length > 0 ? activities[0].timestamp : null,
    };

    // Create snapshot document
    const snapshotData = {
      userID,
      summary,
      recentActivities: activities.slice(0, 10), // Store top 10 most recent
      generatedAt: Timestamp.now(),
    };

    // Store in user's history subcollection
    const historyRef = collection(db, `users/${userID}/history`);
    const snapshotDoc = await addDoc(historyRef, snapshotData);

    console.log(`[ActivityService] History snapshot created with ID: ${snapshotDoc.id}`);

    return {
      success: true,
      snapshotID: snapshotDoc.id,
      data: snapshotData,
      message: 'History snapshot created successfully',
    };
  } catch (error) {
    console.error('[ActivityService] Error creating history snapshot:', error);
    return {
      success: false,
      message: 'Failed to create history snapshot',
      error: error.message || error,
    };
  }
};

export default {
  getUserActivity,
  archiveOldRides,
  getUserHistorySnapshot,
};