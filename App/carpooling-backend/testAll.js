import { auth, db, realtimeDb } from "./services/firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, set, get } from "firebase/database";

// === AUTH SERVICE TEST ===
async function testAuth() {
  console.log("\n🔐 Testing Authentication...");
  try {
    const email = "testall@uni.edu";
    const password = "Test123456";
    let user;

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      user = res.user;
      console.log("✅ Registered new user:", user.email);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        const res = await signInWithEmailAndPassword(auth, email, password);
        user = res.user;
        console.log("✅ Logged in existing user:", user.email);
      } else throw err;
    }

    return user;
  } catch (err) {
    console.error("❌ Auth test failed:", err.message);
    return null;
  }
}

// === FIRESTORE TEST ===
async function testFirestore(user) {
  console.log("\n📘 Testing Firestore...");
  try {
    const refDoc = doc(db, "test", user.uid);
    await setDoc(refDoc, { name: "Sheikh Abdullah 👑", role: "tester", timestamp: Date.now() });
    const snap = await getDoc(refDoc);
    console.log("✅ Firestore data:", snap.data());
  } catch (err) {
    console.error("❌ Firestore test failed:", err.message);
  }
}

// === REALTIME DATABASE TEST ===
async function testRealtime(user) {
  console.log("\n🌐 Testing Realtime Database...");
  try {
    const refLoc = ref(realtimeDb, `testLocation/${user.uid}`);
    const locationData = {
      city: "Manama",
      lat: 26.0667,
      lng: 50.5577,
      timestamp: new Date().toISOString(),
    };
    await set(refLoc, locationData);
    const snap = await get(refLoc);
    console.log("✅ Realtime data:", snap.val());
  } catch (err) {
    console.error("❌ Realtime test failed:", err.message);
  }
}

// === CHAT TEST ===
async function testChat(user) {
  console.log("\n💬 Testing Chat...");
  try {
    const rideID = "ride123";
    const msgID = Date.now().toString();
    const chatRef = ref(realtimeDb, `chats/${rideID}/${msgID}`);
    const messageData = {
      senderID: user.uid,
      senderName: "Sheikh Abdullah 👑",
      senderRole: "driver",
      text: "Testing chat feature!",
      messageType: "text",
      timestamp: Date.now(),
      read: false,
    };
    await set(chatRef, messageData);
    const snap = await get(chatRef);
    console.log("✅ Chat message stored:", snap.val());
  } catch (err) {
    console.error("❌ Chat test failed:", err.message);
  }
}

// === MASTER TEST RUNNER ===
(async function main() {
  console.log("🚀 Running Full Backend Test Suite...\n");
  const user = await testAuth();
  if (user) {
    await testFirestore(user);
    await testRealtime(user);
    await testChat(user);
  }
  console.log("\n🎯 All tests complete!");
})();
