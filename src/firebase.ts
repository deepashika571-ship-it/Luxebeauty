import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getRemoteConfig } from "firebase/remote-config";

// Configured from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyCAJe-j85HV3xbSoxASxry5WpP3gutlapA",
  authDomain: "luxa-makeup.firebaseapp.com",
  projectId: "luxa-makeup",
  storageBucket: "luxa-makeup.firebasestorage.app",
  messagingSenderId: "281493379346",
  appId: "1:281493379346:web:a6c4214def78043ee8bbcb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore specifying our database ID "ai-studio-b7b1c2b6-03a9-46a6-838c-a110d97b8ba8" and enabling long polling
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "ai-studio-b7b1c2b6-03a9-46a6-838c-a110d97b8ba8");

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
