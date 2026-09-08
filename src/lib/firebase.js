// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsUe5cKDd_oyYTZ-R-54VhP5avyTn85oM",
  authDomain: "visitexpo-93c80.firebaseapp.com",
  projectId: "visitexpo-93c80",
  storageBucket: "visitexpo-93c80.firebasestorage.app",
  messagingSenderId: "780192056362",
  appId: "1:780192056362:web:11d0e2c490d82362592f53",
  measurementId: "G-68KPJGR90N"
};

// Initialize Firebase safely for Next.js
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize analytics only on client-side
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export { app, auth, googleProvider, signInWithPopup, analytics };
