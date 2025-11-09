/**
 * Authentication Service
 * 
 * Handles all authentication operations including signup, login, logout,
 * password reset, and user profile management.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from './firebase';

// Initialize persistent session
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting persistence:', error);
});

/**
 * Role Enforcement Helpers
 */

/**
 * Check if user is a driver
 * @param {Object} user - User object with role field
 * @returns {boolean} True if user is a driver
 */
export const isDriver = (user) => {
  return user?.role === 'driver';
};

/**
 * Check if user is a rider
 * @param {Object} user - User object with role field
 * @returns {boolean} True if user is a rider
 */
export const isRider = (user) => {
  return user?.role === 'rider';
};

/**
 * Create a new user account
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.name - User full name
 * @param {string} userData.phone - User phone number
 * @param {string} userData.role - User role (driver or rider)
 * @param {string} [userData.gender] - User gender (optional)
 * @param {number} [userData.age] - User age (optional)
 * @param {string} [userData.university] - User university (optional)
 * @param {string} [userData.profilePic] - User profile picture URL (optional)
 * @returns {Promise<Object>} Created user object
 */
export const createUser = async (userData) => {
  try {
    const { 
      email, 
      password, 
      name, 
      phone, 
      role = 'rider', 
      profilePic = '',
      gender = '',
      age = null,
      university = ''
    } = userData;

    // Validate required fields
    if (!email || !password || !name || !phone) {
      throw new Error('Missing required fields: email, password, name, and phone are required');
    }

    // Validate role
    if (!['driver', 'rider'].includes(role)) {
      throw new Error('Role must be either "driver" or "rider"');
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update auth profile with name
    await updateProfile(user, {
      displayName: name,
      photoURL: profilePic || null
    });

    // Create user document in Firestore
    const userDocData = {
      uid: user.uid,
      name,
      email,
      phone,
      role,
      gender,
      age,
      university,
      avgRating: 0,
      ratingsCount: 0,
      profilePic: profilePic || '',
      verified: false,
      emailVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Additional useful fields
      totalRidesOffered: 0, // For drivers
      totalRidesTaken: 0,   // For riders
      fcmToken: null,       // For push notifications
      isActive: true
    };

    await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userDocData);

    // Send email verification
    await sendEmailVerification(user);

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        ...userDocData
      },
      message: 'Account created successfully. Please check your email to verify your account.'
    };
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle specific Firebase auth errors
    let errorMessage = error.message;
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    }

    throw new Error(errorMessage);
  }
};

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Logged in user object with Firestore data
 */
export const loginUser = async (email, password) => {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if email is verified
    if (!user.emailVerified) {
      // Sign out the user
      await signOut(auth);
      throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
    }

    // Get user data from Firestore
    const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error('User profile not found. Please contact support.');
    }

    const userData = userDoc.data();

    // Check if account is active
    if (userData.isActive === false) {
      await signOut(auth);
      throw new Error('This account has been deactivated. Please contact support to reactivate.');
    }

    // Update emailVerified status in Firestore if it's different
    if (!userData.emailVerified) {
      await updateDoc(userDocRef, {
        emailVerified: true,
        updatedAt: serverTimestamp()
      });
    }

    // Update last login timestamp
    await updateDoc(userDocRef, {
      lastLogin: serverTimestamp()
    });

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: true, // Always true at this point since we checked it
        ...userData
      }
    };
  } catch (error) {
    console.error('Error logging in:', error);
    
    let errorMessage = error.message;
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMessage = 'Invalid email or password';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed login attempts. Please try again later.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled. Please contact support.';
    }

    throw new Error(errorMessage);
  }
};

/**
 * Logout current user
 * @returns {Promise<Object>} Success status
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    console.error('Error logging out:', error);
    throw new Error('Failed to logout. Please try again.');
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<Object>} Success status
 */
export const resetPassword = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    await sendPasswordResetEmail(auth, email);
    
    return {
      success: true,
      message: 'Password reset email sent. Please check your inbox.'
    };
  } catch (error) {
    console.error('Error sending reset email:', error);
    
    let errorMessage = error.message;
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    }

    throw new Error(errorMessage);
  }
};

/**
 * Resend email verification
 * @returns {Promise<Object>} Success status
 */
export const resendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No user is currently logged in');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    await sendEmailVerification(user);
    
    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    };
  } catch (error) {
    console.error('Error sending verification email:', error);
    
    let errorMessage = error.message;
    if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many requests. Please try again later.';
    }

    throw new Error(errorMessage);
  }
};

/**
 * Get current user data
 * @returns {Promise<Object|null>} Current user data or null if not logged in
 */
export const getCurrentUser = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return null;
    }

    // Get fresh data from Firestore
    const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return null;
    }

    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Get user profile by user ID
 * @param {string} userId - User ID to fetch
 * @returns {Promise<Object|null>} User profile data or null if not found
 */
export const getUserProfile = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userDocRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.error(`User profile not found for ID: ${userId}`);
      return null;
    }

    const userData = userDoc.data();
    console.log(`Successfully fetched profile for user: ${userId}`);

    return {
      uid: userId,
      ...userData
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile. Please try again.');
  }
};

/**
 * Update user profile with syncing across related collections
 * @param {string} uid - User ID
 * @param {Object} updates - Fields to update
 * @param {string} [updates.name] - User name
 * @param {string} [updates.phone] - User phone number
 * @param {string} [updates.gender] - User gender
 * @param {string} [updates.profilePic] - User profile picture URL
 * @returns {Promise<Object>} Updated user data
 */
export const updateUserProfile = async (uid, updates) => {
  try {
    if (!uid) {
      throw new Error('User ID is required');
    }

    // Validate updates object
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    // Get current user data first
    const userDocRef = doc(db, COLLECTIONS.USERS, uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const currentUserData = userDoc.data();

    // Only allow updating specific profile fields
    const allowedFields = ['name', 'phone', 'gender', 'profilePic', 'university', 'age'];
    const filteredUpdates = {};

    // Validate and filter updates
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        // Validate each field
        if (key === 'phone' && updates[key]) {
          // Basic phone validation (should have digits)
          if (!/^\+?[\d\s-()]+$/.test(updates[key])) {
            throw new Error('Invalid phone number format');
          }
        }
        if (key === 'name' && updates[key]) {
          if (typeof updates[key] !== 'string' || updates[key].trim().length < 2) {
            throw new Error('Name must be at least 2 characters long');
          }
        }
        if (key === 'profilePic' && updates[key]) {
          // Basic URL validation
          try {
            new URL(updates[key]);
          } catch (e) {
            throw new Error('Invalid profile picture URL');
          }
        }
        
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid fields provided for update');
    }

    // Add timestamp
    filteredUpdates.updatedAt = serverTimestamp();

    // Update user document in Firestore
    await updateDoc(userDocRef, filteredUpdates);
    console.log(`Successfully updated profile for user: ${uid}`);

    // If name or profilePic changed, update Firebase Auth profile
    if (filteredUpdates.name || filteredUpdates.profilePic) {
      const user = auth.currentUser;
      if (user && user.uid === uid) {
        await updateProfile(user, {
          displayName: filteredUpdates.name || user.displayName,
          photoURL: filteredUpdates.profilePic || user.photoURL
        });
        console.log(`Successfully synced profile changes to Firebase Auth for user: ${uid}`);
      }
    }

    // Sync changes across related collections
    await syncProfileChangesAcrossCollections(uid, filteredUpdates, currentUserData);

    // Get updated user data
    const updatedDoc = await getDoc(userDocRef);
    const updatedData = updatedDoc.data();

    return {
      success: true,
      user: {
        uid,
        ...updatedData
      },
      message: 'Profile updated successfully'
    };
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error(error.message || 'Failed to update profile. Please try again.');
  }
};

/**
 * Sync profile changes across related collections (rides and bookings)
 * @param {string} userId - User ID whose profile was updated
 * @param {Object} updates - The fields that were updated
 * @param {Object} currentUserData - Current user data before updates
 * @returns {Promise<void>}
 * @private
 */
const syncProfileChangesAcrossCollections = async (userId, updates, currentUserData) => {
  try {
    const batch = writeBatch(db);
    let updatedCount = 0;

    // Prepare the sync data based on user role
    const userRole = currentUserData.role;

    // === SYNC RIDES COLLECTION (for drivers) ===
    if (userRole === 'driver') {
      const ridesQuery = query(
        collection(db, COLLECTIONS.RIDES),
        where('driverID', '==', userId)
      );

      const ridesSnapshot = await getDocs(ridesQuery);
      console.log(`Found ${ridesSnapshot.size} rides to update for driver: ${userId}`);

      ridesSnapshot.forEach((rideDoc) => {
        const rideRef = doc(db, COLLECTIONS.RIDES, rideDoc.id);
        const rideUpdates = {};

        if (updates.name) rideUpdates.driverName = updates.name;
        if (updates.gender) rideUpdates.driverGender = updates.gender;
        if (updates.profilePic !== undefined) rideUpdates.driverProfilePic = updates.profilePic;
        if (updates.phone) rideUpdates.driverPhone = updates.phone;

        if (Object.keys(rideUpdates).length > 0) {
          rideUpdates.updatedAt = serverTimestamp();
          batch.update(rideRef, rideUpdates);
          updatedCount++;
        }
      });
    }

    // === SYNC BOOKINGS COLLECTION (for riders) ===
    if (userRole === 'rider' || userRole === 'driver') {
      // For riders, update their booking documents
      const bookingsQuery = query(
        collection(db, COLLECTIONS.BOOKINGS),
        where('userID', '==', userId)
      );

      const bookingsSnapshot = await getDocs(bookingsQuery);
      console.log(`Found ${bookingsSnapshot.size} bookings to update for user: ${userId}`);

      bookingsSnapshot.forEach((bookingDoc) => {
        const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingDoc.id);
        const bookingUpdates = {};

        if (updates.name) bookingUpdates.riderName = updates.name;
        if (updates.gender) bookingUpdates.riderGender = updates.gender;
        if (updates.profilePic !== undefined) bookingUpdates.riderProfilePic = updates.profilePic;
        if (updates.phone) bookingUpdates.riderPhone = updates.phone;

        if (Object.keys(bookingUpdates).length > 0) {
          bookingUpdates.updatedAt = serverTimestamp();
          batch.update(bookingRef, bookingUpdates);
          updatedCount++;
        }
      });
    }

    // Commit all updates in a single batch
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully synced profile changes across ${updatedCount} documents`);
    } else {
      console.log('No related documents found to sync');
    }

    return {
      success: true,
      syncedDocuments: updatedCount
    };
  } catch (error) {
    console.error('Error syncing profile changes across collections:', error);
    // Don't throw error here - we don't want to fail the entire update if sync fails
    // The main profile update has already succeeded
    console.warn('Profile updated but some related documents may not be synced. User can try updating again.');
  }
};

/**
 * Get complete user profile with additional statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile with stats
 */
export const getCompleteUserProfile = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get basic profile
    const userProfile = await getUserProfile(userId);

    if (!userProfile) {
      throw new Error('User not found');
    }

    // Get additional statistics based on role
    const stats = {
      totalRides: userProfile.totalRidesOffered || 0,
      totalBookings: userProfile.totalRidesTaken || 0,
      averageRating: userProfile.avgRating || 0,
      ratingsCount: userProfile.ratingsCount || 0
    };

    // If driver, get active rides count
    if (userProfile.role === 'driver') {
      const activeRidesQuery = query(
        collection(db, COLLECTIONS.RIDES),
        where('driverID', '==', userId),
        where('status', '==', 'available')
      );
      const activeRidesSnapshot = await getDocs(activeRidesQuery);
      stats.activeRides = activeRidesSnapshot.size;
    }

    // If rider, get upcoming bookings count
    if (userProfile.role === 'rider' || userProfile.role === 'driver') {
      const upcomingBookingsQuery = query(
        collection(db, COLLECTIONS.BOOKINGS),
        where('userID', '==', userId),
        where('status', 'in', ['confirmed', 'active'])
      );
      const upcomingBookingsSnapshot = await getDocs(upcomingBookingsQuery);
      stats.upcomingBookings = upcomingBookingsSnapshot.size;
    }

    console.log(`Successfully fetched complete profile with stats for user: ${userId}`);

    return {
      success: true,
      profile: userProfile,
      stats
    };
  } catch (error) {
    console.error('Error fetching complete user profile:', error);
    throw new Error('Failed to fetch complete profile. Please try again.');
  }
};

/**
 * Validate user profile completeness
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Validation result with missing fields
 */
export const validateProfileCompleteness = async (userId) => {
  try {
    const userProfile = await getUserProfile(userId);

    if (!userProfile) {
      throw new Error('User not found');
    }

    const requiredFields = ['name', 'email', 'phone', 'role'];
    const optionalFields = ['gender', 'age', 'university', 'profilePic'];
    
    const missingRequired = requiredFields.filter(field => !userProfile[field]);
    const missingOptional = optionalFields.filter(field => !userProfile[field]);

    const isComplete = missingRequired.length === 0 && missingOptional.length === 0;
    const isBasicComplete = missingRequired.length === 0;

    return {
      success: true,
      isComplete,
      isBasicComplete,
      completionPercentage: Math.round(
        ((requiredFields.length + optionalFields.length - missingRequired.length - missingOptional.length) /
        (requiredFields.length + optionalFields.length)) * 100
      ),
      missingRequired,
      missingOptional,
      profile: userProfile
    };
  } catch (error) {
    console.error('Error validating profile completeness:', error);
    throw new Error('Failed to validate profile. Please try again.');
  }
};

/**
 * Update user email
 * @param {string} newEmail - New email address
 * @param {string} currentPassword - Current password for reauthentication
 * @returns {Promise<Object>} Success status
 */
export const updateUserEmail = async (newEmail, currentPassword) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No user is currently logged in');
    }

    // Reauthenticate before email change
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update email in Firebase Auth
    await updateEmail(user, newEmail);

    // Update email in Firestore
    const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
    await updateDoc(userDocRef, {
      email: newEmail,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      message: 'Email updated successfully'
    };
  } catch (error) {
    console.error('Error updating email:', error);
    
    let errorMessage = error.message;
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already in use';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password';
    }

    throw new Error(errorMessage);
  }
};

/**
 * Update user password
 * @param {string} currentPassword - Current password for reauthentication
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success status
 */
export const updateUserPassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No user is currently logged in');
    }

    // Reauthenticate before password change
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);

    return {
      success: true,
      message: 'Password updated successfully'
    };
  } catch (error) {
    console.error('Error updating password:', error);
    
    let errorMessage = error.message;
    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Current password is incorrect';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'New password should be at least 6 characters';
    }

    throw new Error(errorMessage);
  }
};

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function to handle auth state changes
 * @returns {Function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in, get full user data
      const userData = await getCurrentUser();
      callback(userData);
    } else {
      // User is signed out
      callback(null);
    }
  });
};

/**
 * Deactivate user account
 * @param {string} uid - User ID
 * @returns {Promise<Object>} Success status
 */
export const deactivateUser = async (uid) => {
  try {
    if (!uid) {
      throw new Error('User ID is required');
    }

    const userDocRef = doc(db, COLLECTIONS.USERS, uid);
    
    // Check if user exists
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    // Set isActive to false
    await updateDoc(userDocRef, {
      isActive: false,
      deactivatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Sign out the user if they're currently logged in
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === uid) {
      await signOut(auth);
    }

    return {
      success: true,
      message: 'Account deactivated successfully'
    };
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw new Error('Failed to deactivate account. Please try again.');
  }
};

/**
 * Update FCM token for push notifications
 * @param {string} uid - User ID
 * @param {string} fcmToken - FCM token
 * @returns {Promise<Object>} Success status
 */
export const updateFCMToken = async (uid, fcmToken) => {
  try {
    const userDocRef = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(userDocRef, {
      fcmToken,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      message: 'FCM token updated'
    };
  } catch (error) {
    console.error('Error updating FCM token:', error);
    throw new Error('Failed to update notification token');
  }
};