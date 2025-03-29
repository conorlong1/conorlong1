import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import router from './router'

// Firebase initialization
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC9zueMnceSE_kza89rMpwcvFJGSUNSF-Y",
  authDomain: "login-b7c95.firebaseapp.com",
  projectId: "login-b7c95",
  storageBucket: "login-b7c95.firebasestorage.app",
  messagingSenderId: "791407890500",
  appId: "1:791407890500:web:cca5bed94652921d036c11",
  measurementId: "G-7QGK5HCVNQ"
};

// Use a unique variable name for your Firebase app
const firebaseApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebaseApp);

// Create your Vue app
const app = createApp(App)
app.use(router)
app.mount('#app')
