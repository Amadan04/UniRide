import { auth, realtimeDb } from './services/firebase.js';
import { ref, set, get, child } from 'firebase/database';
import { signInWithEmailAndPassword } from 'firebase/auth';

async function testRealtime() {
  try {
    console.log("🚀 Testing Realtime Database connection...");

    const email = "tescdsdt@uni.edu";
    const password = "Test123456";

    // Log in (use your existing test user)
    const res = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ Logged in as:", res.user.email);

    // Write test data
    const locationRef = ref(realtimeDb, `testLocation/${res.user.uid}`);
    await set(locationRef, {
      lat: 26.0667,
      lng: 50.5577,
      city: "Manama",
      timestamp: new Date().toISOString()
    });
    console.log("📍 Location written successfully!");

    // Read it back
    const snapshot = await get(child(ref(realtimeDb), `testLocation/${res.user.uid}`));
    console.log("✅ Realtime Database data:", snapshot.val());

  } catch (err) {
    console.error("❌ Realtime Database test failed:", err.message);
  }
}

testRealtime();
