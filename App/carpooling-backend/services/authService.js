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
  updateProfile,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from './firebase';

/**
 * Create a new user account
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.name - User full name
 * @param {string} userData.phone - User phone number
 * @param {string} userData.role - User role (driver or rider)
 * @returns {Promise<Object>} Created user object
 */
export const createUser = async (userData) => {
  try {
    const { email, password, name, phone, role = 'rider', profilePic = '' } = userData;

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
      avgRating: 0,
      ratingsCount: 0,
      profilePic: profilePic || '',
      verified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Additional useful fields
      totalRidesOffered: 0, // For drivers
      totalRidesTaken: 0,   // For riders
      fcmToken: null,       // For push notifications
      isActive: true
    };

    await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userDocData);

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        ...userDocData
      }
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

    // Get user data from Firestore
    const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error('User profile not found. Please contact support.');
    }

    const userData = userDoc.data();

    // Update last login timestamp
    await updateDoc(userDocRef, {
      lastLogin: serverTimestamp()
    });

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
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
 * Update user profile
 * @param {string} uid - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user data
 */
export const updateUserProfile = async (uid, updates) => {
  try {
    const userDocRef = doc(db, COLLECTIONS.USERS, uid);
    
    // Don't allow updating certain fields
    const { uid: _uid, email: _email, createdAt, ...allowedUpdates } = updates;

    const updateData = {
      ...allowedUpdates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(userDocRef, updateData);

    // If name or photo changed, update auth profile too
    if (updates.name || updates.profilePic) {
      const user = auth.currentUser;
      if (user && user.uid === uid) {
        await updateProfile(user, {
          displayName: updates.name || user.displayName,
          photoURL: updates.profilePic || user.photoURL
        });
      }
    }

    // Get updated user data
    const updatedDoc = await getDoc(userDocRef);
    return {
      success: true,
      user: updatedDoc.data()
    };
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error('Failed to update profile. Please try again.');
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
