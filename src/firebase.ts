import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

// Configured from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyBvoBxw86VmNXIjRbaaZxBMBMNIT98bwyo",
  authDomain: "ecstatic-magnet-n6tp2.firebaseapp.com",
  projectId: "ecstatic-magnet-n6tp2",
  storageBucket: "ecstatic-magnet-n6tp2.firebasestorage.app",
  messagingSenderId: "756505474648",
  appId: "1:756505474648:web:3e6c02ed8005d166f23c2d",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore specifying our database ID "ai-studio-b7b1c2b6-03a9-46a6-838c-a110d97b8ba8" and enabling long polling
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "ai-studio-b7b1c2b6-03a9-46a6-838c-a110d97b8ba8");

// Initialize Firebase Authentication
export const auth = getAuth(app);
