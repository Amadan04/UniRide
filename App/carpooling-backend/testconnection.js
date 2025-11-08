import { auth, db } from './services/firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

async function testConnection() {
  try {
    console.log("🚀 Testing Firebase connection...");

    const email = "tescdsdt@uni.edu";
    const password = "Test123456";

    let user;
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      user = res.user;
      console.log("✅ User created:", user.email);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        const res = await signInWithEmailAndPassword(auth, email, password);
        user = res.user;
        console.log("✅ Logged in:", user.email);
      } else {
        throw err;
      }
    }

    const ref = doc(db, "testCollection", "demo");
    await setDoc(ref, { name: "Sheikh Abdullah 👑", success: true });

    const snap = await getDoc(ref);
    if (snap.exists()) {
      console.log("✅ Firestore works:", snap.data());
    } else {
      console.log("⚠️ Document not found – Firestore write may have failed.");
    }

  } catch (err) {
    console.error("❌ Firebase test failed:", err.message);
  }
}

testConnection();
