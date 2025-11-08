/**
 * Firebase Configuration and Initialization
 * 
 * This file initializes Firebase services for the carpooling app.
 * Make sure to replace the config values with your actual Firebase project credentials.
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase configuration
// Replace with your actual Firebase project config from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  measurementId: "YOUR_MEASUREMENT_ID" // Optional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Export the app instance
export default app;

/**
 * Collection and path constants
 * Centralized location for all Firestore collection names and Realtime DB paths
 */
export const COLLECTIONS = {
  USERS: 'users',
  RIDES: 'rides',
  BOOKINGS: 'bookings',
  RATINGS: 'ratings'
};

export const REALTIME_PATHS = {
  RIDE_LOCATIONS: 'rideLocations',
  CHATS: 'chats'
};

/**
 * Helper function to check if Firebase is initialized
 */
export const isFirebaseInitialized = () => {
  return app !== null;
};
