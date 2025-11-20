/**
 * Firebase Configuration and Initialization
 * 
 * This file initializes Firebase services for the carpooling app.
 * Make sure to replace the config values with your actual Firebase project credentials.
 * 
 * 
 * Need to add the keys to .env fiel to hide them ether thn having them hardcoded here or in another files throught the project..
 * 
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
  apiKey: "AIzaSyDMllqkxUAY9z8alO1oLaJAqjc_jMxk50E",
  authDomain: "university-carpool-app.firebaseapp.com",
  databaseURL: "https://university-carpool-app-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "university-carpool-app",
  storageBucket: "university-carpool-app.firebasestorage.app",
  messagingSenderId: "852111697097",
  appId: "1:852111697097:web:036be8d1420f348adfd918",
  measurementId: "G-Q7TY78QFCZ"
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
