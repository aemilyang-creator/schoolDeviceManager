import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  writeBatch,
  query,
  where,
  Firestore
} from 'firebase/firestore';

const requiredEnv = (name: string): string => {
  const value = import.meta.env[name];

  if (!value) {
    throw new Error(`Missing required Firebase environment variable: ${name}`);
  }

  return value;
};

// Firebase configuration is supplied through a local, gitignored .env file.
const firebaseConfig = {
  projectId: requiredEnv('VITE_FIREBASE_PROJECT_ID'),
  appId: requiredEnv('VITE_FIREBASE_APP_ID'),
  apiKey: requiredEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  storageBucket: requiredEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requiredEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
};

const databaseId = requiredEnv('VITE_FIREBASE_DATABASE_ID');

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific databaseId
export const db: Firestore = getFirestore(app, databaseId);

export {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  writeBatch,
  query,
  where
};
