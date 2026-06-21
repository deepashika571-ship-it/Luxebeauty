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
