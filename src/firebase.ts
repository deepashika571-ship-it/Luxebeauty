import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getRemoteConfig } from "firebase/remote-config";

// Configured from user-provided firebase details
const firebaseConfig = {
  apiKey: "AIzaSyCAJe-j85HV3xbSoxASxry5WpP3gutlapA",
  authDomain: "luxa-makeup.firebaseapp.com",
  databaseURL: "https://luxa-makeup-default-rtdb.firebaseio.com",
  projectId: "luxa-makeup",
  storageBucket: "luxa-makeup.firebasestorage.app",
  messagingSenderId: "281493379346",
  appId: "1:281493379346:web:a6c4214def78043ee8bbcb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore specifying production options and using default database
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
} as any);

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
