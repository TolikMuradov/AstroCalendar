import { initializeApp } from 'firebase/app';
// @ts-ignore - getReactNativePersistence is available in RN bundle via package.json "react-native" field
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCO3TtK_iOba_8BwV0zgFZGtgOQQ97PaHA',
  authDomain: 'astrocalendar-36921.firebaseapp.com',
  projectId: 'astrocalendar-36921',
  storageBucket: 'astrocalendar-36921.firebasestorage.app',
  messagingSenderId: '928420921309',
  appId: '1:928420921309:web:8abe415ee2a8aaf8598034',
  measurementId: 'G-6X2N35ZS4H',
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
