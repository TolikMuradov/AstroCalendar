
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCO3TtK_iOba_8BwV0zgFZGtgOQQ97PaHA",
  authDomain: "astrocalendar-36921.firebaseapp.com",
  projectId: "astrocalendar-36921",
  storageBucket: "astrocalendar-36921.firebasestorage.app",
  messagingSenderId: "928420921309",
  appId: "1:928420921309:web:8abe415ee2a8aaf8598034",
  measurementId: "G-6X2N35ZS4H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
