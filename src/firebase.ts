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

// Default config from firebase-applet-config.json
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ai-studio-applet-webapp-b2e6f',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:438250245621:web:a2d1a165124030538ba4bc',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDx0Hic6YZE_TeFro-Vm5Nx7WXT2G1JnAM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ai-studio-applet-webapp-b2e6f.firebaseapp.com',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ai-studio-applet-webapp-b2e6f.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '438250245621',
};

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || 'ai-studio-d3dcadda-45c0-4936-a1b8-66d0531c6ec5';

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
