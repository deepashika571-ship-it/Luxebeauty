import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getRemoteConfig } from "firebase/remote-config";

// Configured from user-provided firebase details
const firebaseConfig = {
  apiKey: "AIzaSyBvoBxw86VmNXIjRbaaZxBMBMNIT98bwyo",
  authDomain: "ecstatic-magnet-n6tp2.firebaseapp.com",
  projectId: "ecstatic-magnet-n6tp2",
  storageBucket: "ecstatic-magnet-n6tp2.firebasestorage.app",
  messagingSenderId: "756505474648",
  appId: "1:756505474648:web:3e6c02ed8005d166f23c2d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore specifying production options and using the active database ID
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
} as any, "ai-studio-b7b1c2b6-03a9-46a6-838c-a110d97b8ba8");

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firebase Remote Config to fetch site management configuration rules
let remoteConfigInstance: any = null;
try {
  if (typeof window !== "undefined") {
    remoteConfigInstance = getRemoteConfig(app);
    remoteConfigInstance.defaultConfig = {
      site_config: '{"banner":"Welcome!"}'
    };
  }
} catch (error) {
  console.warn("Firebase Remote Config failed to initialize inside sandbox context:", error);
}

export const remoteConfig = remoteConfigInstance;
