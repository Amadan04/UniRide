/**
 * Rating Service
 * 
 * Handles all rating operations including submitting ratings, calculating averages,
 * and retrieving user ratings.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';

/**
 * Generate a unique rating ID
 * @returns {string} Unique rating ID
 */
const generateRatingId = () => {
  return `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Submit a rating for a user after a ride
 * @param {Object} ratingData - Rating information
 * @param {string} ratingData.rideID - Ride ID
 * @param {string} ratingData.fromUserID - User giving the rating
 * @param {string} ratingData.toUserID - User receiving the rating
 * @param {number} ratingData.rating - Rating value (1-5)
 * @param {string} ratingData.comment - Optional comment
 * @returns {Promise<Object>} Rating result
 */
export const rateUser = async (ratingData) => {
  try {
    const {
      rideID,
      fromUserID,
      toUserID,
      rating,
      comment = ''
    } = ratingData;

    // Validate required fields
    if (!rideID || !fromUserID || !toUserID || rating === undefined) {
      throw new Error('Missing required fields for rating');
    }

    // Validate rating value
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new Error('Rating must be an integer between 1 and 5');
    }

    // Can't rate yourself
    if (fromUserID === toUserID) {
      throw new Error('You cannot rate yourself');
    }

    // Verify ride exists
    const rideDoc = await getDoc(doc(db, COLLECTIONS.RIDES, rideID));
    if (!rideDoc.exists()) {
      throw new Error('Ride not found');
    }

    const rideData = rideDoc.data();

    // Verify ride is completed
    if (rideData.status !== 'completed') {
      throw new Error('You can only rate users after the ride is completed');
    }

    // Verify both users were part of the ride
    const isFromUserDriver = rideData.driverID === fromUserID;
    const isToUserDriver = rideData.driverID === toUserID;
    const isFromUserRider = rideData.riders.includes(fromUserID);
    const isToUserRider = rideData.riders.includes(toUserID);

    if (!(isFromUserDriver || isFromUserRider)) {
      throw new Error('You were not part of this ride');
    }

    if (!(isToUserDriver || isToUserRider)) {
      throw new Error('The user you are trying to rate was not part of this ride');
    }

    // Check if user has already rated this person for this ride
    const existingRatingQuery = query(
      collection(db, COLLECTIONS.RATINGS),
      where('rideID', '==', rideID),
      where('fromUserID', '==', fromUserID),
      where('toUserID', '==', toUserID)
    );

    const existingRatings = await getDocs(existingRatingQuery);
    if (!existingRatings.empty) {
      throw new Error('You have already rated this user for this ride');
    }

    // Get user info for context
    const fromUserDoc = await getDoc(doc(db, COLLECTIONS.USERS, fromUserID));
    const toUserDoc = await getDoc(doc(db, COLLECTIONS.USERS, toUserID));

    if (!fromUserDoc.exists() || !toUserDoc.exists()) {
      throw new Error('User not found');
    }

    const fromUserData = fromUserDoc.data();
    const toUserData = toUserDoc.data();

    // Create rating using transaction to update avgRating atomically
    const ratingID = generateRatingId();
    
    await runTransaction(db, async (transaction) => {
      // Create rating document
      const ratingRef = doc(db, COLLECTIONS.RATINGS, ratingID);
      const ratingDocData = {
        ratingID,
        rideID,
        fromUserID,
        fromUserName: fromUserData.name,
        toUserID,
        toUserName: toUserData.name,
        rating,
        comment: comment.trim(),
        rideDate: rideData.date,
        rideRoute: `${rideData.pickup} → ${rideData.destination}`,
        createdAt: serverTimestamp()
      };

      transaction.set(ratingRef, ratingDocData);

      // Update rated user's average rating
      const toUserRef = doc(db, COLLECTIONS.USERS, toUserID);
      const currentAvgRating = toUserData.avgRating || 0;
      const currentRatingsCount = toUserData.ratingsCount || 0;

      const newRatingsCount = currentRatingsCount + 1;
      const newAvgRating = ((currentAvgRating * currentRatingsCount) + rating) / newRatingsCount;

      transaction.update(toUserRef, {
        avgRating: parseFloat(newAvgRating.toFixed(2)),
        ratingsCount: newRatingsCount,
        updatedAt: serverTimestamp()
      });
    });

    return {
      success: true,
      message: 'Rating submitted successfully',
      ratingID
    };
  } catch (error) {
    console.error('Error submitting rating:', error);
    throw new Error(error.message || 'Failed to submit rating');
  }
};

/**
 * Get all ratings for a specific user
 * @param {string} userID - User ID
 * @param {number} limitResults - Maximum number of ratings to return
 * @returns {Promise<Object>} User ratings
 */
export const getUserRatings = async (userID, limitResults = 50) => {
  try {
    const ratingsQuery = query(
      collection(db, COLLECTIONS.RATINGS),
      where('toUserID', '==', userID),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(ratingsQuery);
    const ratings = [];

    querySnapshot.forEach((doc) => {
      ratings.push({
        ...doc.data(),
        id: doc.id
      });
    });

    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
      distribution[r.rating]++;
    });

    // Get user's current average
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userID));
    const userData = userDoc.exists() ? userDoc.data() : null;

    return {
      success: true,
      ratings: ratings.slice(0, limitResults),
      totalRatings: ratings.length,
      avgRating: userData?.avgRating || 0,
      distribution
    };
  } catch (error) {
    console.error('Error getting user ratings:', error);
    throw new Error('Failed to fetch user ratings');
  }
};

/**
 * Get ratings given by a specific user
 * @param {string} userID - User ID
 * @param {number} limitResults - Maximum number of ratings to return
 * @returns {Promise<Array>} Ratings given by user
 */
export const getRatingsGivenByUser = async (userID, limitResults = 50) => {
  try {
    const ratingsQuery = query(
      collection(db, COLLECTIONS.RATINGS),
      where('fromUserID', '==', userID),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(ratingsQuery);
    const ratings = [];

    querySnapshot.forEach((doc) => {
      ratings.push({
        ...doc.data(),
        id: doc.id
      });
    });

    return {
      success: true,
      ratings: ratings.slice(0, limitResults),
      count: ratings.length
    };
  } catch (error) {
    console.error('Error getting ratings given by user:', error);
    throw new Error('Failed to fetch ratings');
  }
};

/**
 * Get ratings for a specific ride
 * @param {string} rideID - Ride ID
 * @returns {Promise<Array>} Ride ratings
 */
export const getRideRatings = async (rideID) => {
  try {
    const ratingsQuery = query(
      collection(db, COLLECTIONS.RATINGS),
      where('rideID', '==', rideID),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(ratingsQuery);
    const ratings = [];

    querySnapshot.forEach((doc) => {
      ratings.push({
        ...doc.data(),
        id: doc.id
      });
    });

    return {
      success: true,
      ratings,
      count: ratings.length
    };
  } catch (error) {
    console.error('Error getting ride ratings:', error);
    throw new Error('Failed to fetch ride ratings');
  }
};

/**
 * Check if user can rate another user for a specific ride
 * @param {string} rideID - Ride ID
 * @param {string} fromUserID - User who wants to rate
 * @param {string} toUserID - User to be rated
 * @returns {Promise<Object>} Whether rating is allowed and reason if not
 */
export const canUserRate = async (rideID, fromUserID, toUserID) => {
  try {
    // Check if ride exists and is completed
    const rideDoc = await getDoc(doc(db, COLLECTIONS.RIDES, rideID));
    if (!rideDoc.exists()) {
      return {
        canRate: false,
        reason: 'Ride not found'
      };
    }

    const rideData = rideDoc.data();

    if (rideData.status !== 'completed') {
      return {
        canRate: false,
        reason: 'Ride must be completed before rating'
      };
    }

    // Check if both users were part of the ride
    const isFromUserDriver = rideData.driverID === fromUserID;
    const isToUserDriver = rideData.driverID === toUserID;
    const isFromUserRider = rideData.riders.includes(fromUserID);
    const isToUserRider = rideData.riders.includes(toUserID);

    if (!(isFromUserDriver || isFromUserRider)) {
      return {
        canRate: false,
        reason: 'You were not part of this ride'
      };
    }

    if (!(isToUserDriver || isToUserRider)) {
      return {
        canRate: false,
        reason: 'User was not part of this ride'
      };
    }

    // Check if already rated
    const existingRatingQuery = query(
      collection(db, COLLECTIONS.RATINGS),
      where('rideID', '==', rideID),
      where('fromUserID', '==', fromUserID),
      where('toUserID', '==', toUserID)
    );

    const existingRatings = await getDocs(existingRatingQuery);
    if (!existingRatings.empty) {
      return {
        canRate: false,
        reason: 'You have already rated this user for this ride'
      };
    }

    return {
      canRate: true,
      reason: null
    };
  } catch (error) {
    console.error('Error checking if user can rate:', error);
    return {
      canRate: false,
      reason: 'Error checking rating eligibility'
    };
  }
};

/**
 * Get pending ratings for a user (rides they completed but haven't rated others)
 * @param {string} userID - User ID
 * @returns {Promise<Array>} Pending rating opportunities
 */
export const getPendingRatings = async (userID) => {
  try {
    // Get all completed rides where user was involved
    const userRidesQuery = query(
      collection(db, COLLECTIONS.RIDES),
      where('status', '==', 'completed')
    );

    const ridesSnapshot = await getDocs(userRidesQuery);
    const completedRides = [];

    ridesSnapshot.forEach((doc) => {
      const ride = doc.data();
      const isDriver = ride.driverID === userID;
      const isRider = ride.riders.includes(userID);

      if (isDriver || isRider) {
        completedRides.push({
          ...ride,
          id: doc.id,
          userRole: isDriver ? 'driver' : 'rider'
        });
      }
    });

    // Get all ratings given by this user
    const givenRatings = await getRatingsGivenByUser(userID, 1000);
    const ratedRides = new Set(givenRatings.ratings.map(r => `${r.rideID}_${r.toUserID}`));

    // Find rides where user hasn't rated all participants
    const pendingRatings = [];

    for (const ride of completedRides) {
      const usersToRate = [];

      if (ride.userRole === 'rider' && !ratedRides.has(`${ride.rideID}_${ride.driverID}`)) {
        // Rider should rate driver
        const driverDoc = await getDoc(doc(db, COLLECTIONS.USERS, ride.driverID));
        if (driverDoc.exists()) {
          usersToRate.push({
            userID: ride.driverID,
            userName: driverDoc.data().name,
            userRole: 'driver'
          });
        }
      } else if (ride.userRole === 'driver') {
        // Driver should rate all riders
        for (const riderID of ride.riders) {
          if (!ratedRides.has(`${ride.rideID}_${riderID}`)) {
            const riderDoc = await getDoc(doc(db, COLLECTIONS.USERS, riderID));
            if (riderDoc.exists()) {
              usersToRate.push({
                userID: riderID,
                userName: riderDoc.data().name,
                userRole: 'rider'
              });
            }
          }
        }
      }

      if (usersToRate.length > 0) {
        pendingRatings.push({
          rideID: ride.rideID,
          date: ride.date,
          route: `${ride.pickup} → ${ride.destination}`,
          usersToRate
        });
      }
    }

    return {
      success: true,
      pendingRatings,
      count: pendingRatings.length
    };
  } catch (error) {
    console.error('Error getting pending ratings:', error);
    throw new Error('Failed to fetch pending ratings');
  }
};

/**
 * Get rating statistics for a user
 * @param {string} userID - User ID
 * @returns {Promise<Object>} Rating statistics
 */
export const getRatingStats = async (userID) => {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userID));
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    // Get all ratings
    const { ratings, distribution } = await getUserRatings(userID, 1000);

    // Calculate percentages
    const total = ratings.length;
    const percentages = {};
    for (let i = 1; i <= 5; i++) {
      percentages[i] = total > 0 ? Math.round((distribution[i] / total) * 100) : 0;
    }

    return {
      success: true,
      stats: {
        avgRating: userData.avgRating || 0,
        totalRatings: userData.ratingsCount || 0,
        distribution,
        percentages,
        recentRatings: ratings.slice(0, 5)
      }
    };
  } catch (error) {
    console.error('Error getting rating stats:', error);
    throw new Error('Failed to fetch rating statistics');
  }
};

/**
 * Manually recalculate average rating for a user (admin function)
 * Used if ratings get out of sync
 * @param {string} userID - User ID
 * @returns {Promise<Object>} Updated rating info
 */
export const recalculateUserRating = async (userID) => {
  try {
    const ratingsQuery = query(
      collection(db, COLLECTIONS.RATINGS),
      where('toUserID', '==', userID)
    );

    const querySnapshot = await getDocs(ratingsQuery);
    const ratings = [];

    querySnapshot.forEach((doc) => {
      ratings.push(doc.data());
    });

    const totalRatings = ratings.length;
    let sumRatings = 0;

    ratings.forEach(r => {
      sumRatings += r.rating;
    });

    const avgRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    // Update user document
    await updateDoc(doc(db, COLLECTIONS.USERS, userID), {
      avgRating: parseFloat(avgRating.toFixed(2)),
      ratingsCount: totalRatings,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      avgRating: parseFloat(avgRating.toFixed(2)),
      ratingsCount: totalRatings,
      message: 'User rating recalculated successfully'
    };
  } catch (error) {
    console.error('Error recalculating user rating:', error);
    throw new Error('Failed to recalculate rating');
  }
};
