import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import {
  initializeFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import {
  getRemoteConfig,
  fetchAndActivate,
  getValue,
} from "firebase/remote-config";

// Configured from user-provided firebase details
const firebaseConfig = {
  apiKey: "AIzaSyD51tGPZCaHPOAA_dnj_DIQHPAzsZniTlI",
  authDomain: "beauty-ae724.firebaseapp.com",
  databaseURL: "https://beauty-ae724-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "beauty-ae724",
  storageBucket: "beauty-ae724.firebasestorage.app",
  messagingSenderId: "432217513680",
  appId: "1:432217513680:web:2ace5f88a72e01415d88d5"
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

// Initialize Remote Config
export const remoteConfig = getRemoteConfig(app);

// Re-export Auth/Firestore primitives so components importing them from "./firebase" work flawlessly
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  fetchAndActivate,
  getValue,
};
