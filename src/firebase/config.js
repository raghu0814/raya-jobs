import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB2u6w9Kf2jEeGuLV5p6jcNXbpwy4BejFk",
  authDomain: "raya-jobs.firebaseapp.com",
  projectId: "raya-jobs",
  storageBucket: "raya-jobs.firebasestorage.app",
  messagingSenderId: "569386077534",
  appId: "1:569386077534:web:553605d30e5529169f13cf",
  measurementId: "G-LQK4S04TLD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
