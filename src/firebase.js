// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDhR2ZnS2791hQLRIOh6KS_0rATT3lzfrc",
  authDomain: "test-eb186.firebaseapp.com",
  projectId: "test-eb186",
  storageBucket: "test-eb186.firebasestorage.app",
  messagingSenderId: "937809721497",
  appId: "1:937809721497:web:02350c220802938b8ea008",
  measurementId: "G-HSW5120B87"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
