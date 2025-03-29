<template>
  <div class="auth-page">
    <div class="circle-container">
      <div class="auth-toggle">
        <button :class="{ active: isSignup }" @click="isSignup = true">
          Sign Up
        </button>
        <button :class="{ active: !isSignup }" @click="isSignup = false">
          Sign In
        </button>
      </div>

      <!-- Registration Form -->
      <div v-if="isSignup">
        <h1>Create an account</h1>
        <p>
          <input type="text" placeholder="Email" v-model="email" />
        </p>
        <p>
          <input type="password" placeholder="Password" v-model="password" />
        </p>
        <p>
          <button @click="register">Submit</button>
        </p>
        <p>
          <button @click="signInWithGoogle">Sign in with Google</button>
        </p>
      </div>

      <!-- Sign In Form -->
      <div v-else>
        <h1>Sign In</h1>
        <p>
          <input type="text" placeholder="Email" v-model="signinEmail" />
        </p>
        <p>
          <input type="password" placeholder="Password" v-model="signinPassword" />
        </p>
        <p>
          <button @click="signin">Sign In</button>
        </p>
        <p>
          <button @click="signInWithGoogle">Sign in with Google</button>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "vue-router";

// Toggle between Sign Up and Sign In
const isSignup = ref(true);

// For registration
const email = ref("");
const password = ref("");

// For sign in
const signinEmail = ref("");
const signinPassword = ref("");

const router = useRouter();

// Register new user
const register = () => {
  createUserWithEmailAndPassword(getAuth(), email.value, password.value)
    .then(async (data) => {
      console.log("Successfully registered!", data);
      const db = getFirestore();
      // Create a user document in the "users" collection with the user's UID as the document ID
      await setDoc(doc(db, "users", data.user.uid), {
        email: data.user.email,
        createdAt: serverTimestamp()
      });
      router.push("/feed");
    })
    .catch((error) => {
      console.log(error.code);
      alert(error.message);
    });
};

// Sign in existing user
const signin = () => {
  signInWithEmailAndPassword(getAuth(), signinEmail.value, signinPassword.value)
    .then((data) => {
      console.log("Successfully signed in!", data);
      router.push("/feed");
    })
    .catch((error) => {
      console.log(error.code);
      alert(error.message);
    });
};

// Sign in with Google (updated to create/update Firestore user document)
const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(getAuth(), provider)
    .then(async (result) => {
      console.log("Google sign in successful", result.user);
      const db = getFirestore();
      // Option 1: Always create or update the user document
      await setDoc(
        doc(db, "users", result.user.uid),
        {
          email: result.user.email,
          createdAt: serverTimestamp()
        },
        { merge: true }
      );
      
      // Option 2: Only create the document if the user is new
      // if (result.additionalUserInfo?.isNewUser) {
      //   await setDoc(doc(db, "users", result.user.uid), {
      //     email: result.user.email,
      //     createdAt: serverTimestamp()
      //   });
      // }
      
      router.push("/feed");
    })
    .catch((error) => {
      console.log(error.code);
      alert(error.message);
    });
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css?family=Amethysta');

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden; /* Prevent scroll bar */
}

.auth-page {
  height: 100%;
  width: 100%;
  background: url('/PlanItLogin.png') no-repeat center center;
  background-size: cover;
  position: absolute;
  top: 0;
  left: 0;
  font-family: 'Amethysta', sans-serif;
}

/* Position the container where your white circle is in the background */
.circle-container {
  position: absolute;
  top: 50%;
  right: 14%;  /* Adjust this value to move the form left or right */
  transform: translateY(-50%);
  padding: 10px;
  box-sizing: border-box;
}

.auth-toggle {
  display: flex;
  margin-bottom: 10px;
}

.auth-toggle button {
  background: none;
  border: none;
  color: #6a11cb;
  padding: 5px 15px;
  cursor: pointer;
  font-weight: bold;
  border-bottom: 2px solid transparent;
  font-size: 14px;
}

.auth-toggle button.active {
  border-bottom-color: #6a11cb;
}

input {
  width: 80%;
  padding: 8px;
  margin: 5px 0;
  border: 1px solid #6a11cb;
  border-radius: 5px;
  font-size: 12px;
}

button {
  background-color: #6a11cb;
  color: white;
  border: none;
  padding: 8px 15px;
  margin: 5px;
  border-radius: 25px;
  cursor: pointer;
  transition: opacity 0.3s ease;
  font-size: 12px;
}

button:hover {
  opacity: 0.8;
}
</style>
