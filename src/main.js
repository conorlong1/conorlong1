import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import router from './router'

// Firebase initialization
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDhR2ZnS2791hQLRIOh6KS_0rATT3lzfrc",
  authDomain: "test-eb186.firebaseapp.com",
  projectId: "test-eb186",
  storageBucket: "test-eb186.firebasestorage.app",
  messagingSenderId: "937809721497",
  appId: "1:937809721497:web:02350c220802938b8ea008",
  measurementId: "G-HSW5120B87"
};
// Use a unique variable name for your Firebase app
const firebaseApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebaseApp);

// Create your Vue app
const app = createApp(App)
app.use(router)
app.mount('#app')
