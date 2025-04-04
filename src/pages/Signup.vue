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
          <button @click="forgotPassword" class="forgot-password-button">
            Forgot Password?
          </button>
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
  signInWithPopup,
  sendPasswordResetEmail
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

/**
 * 
 * @param {string} password
 * @returns {Promise<number>} The number of times the password has been seen in breaches.
 */
async function checkPasswordCompromised(password) {
  // Encode and compute SHA-1 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();

  // Split the hash into prefix and suffix
  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);

  // Query the API with the prefix
  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  const responseText = await response.text();

  // Check the API response for the suffix
  const compromisedEntry = responseText
    .split("\n")
    .find(line => line.split(":")[0] === suffix);

  // Return the count (or 0 if not found)
  return compromisedEntry ? parseInt(compromisedEntry.split(":")[1]) : 0;
}

// Register new user with compromised password check
const register = async () => {
  // Check if the password is compromised before registering
  const count = await checkPasswordCompromised(password.value);
  if (count > 0) {
    alert(
      `This password has been seen ${count} times before in data breaches. Please choose a different password.`
    );
    return;
  }

  // Proceed with user registration if the password is safe
  createUserWithEmailAndPassword(getAuth(), email.value, password.value)
    .then(async (data) => {
      console.log("Successfully registered!", data);
      const db = getFirestore();
      await setDoc(doc(db, "users", data.user.uid), {
        email: data.user.email,
        username: data.user.email.split("@")[0],
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

// Forgot password function
const forgotPassword = () => {
  if (!signinEmail.value) {
    alert("Please enter your email address to reset your password.");
    return;
  }
  sendPasswordResetEmail(getAuth(), signinEmail.value)
    .then(() => {
      alert("Password reset email sent! Check your inbox.");
    })
    .catch((error) => {
      console.log(error.code);
      alert(error.message);
    });
};

// Sign in with Google
const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(getAuth(), provider)
    .then(async (result) => {
      console.log("Google sign in successful", result.user);
      const db = getFirestore();
      await setDoc(
        doc(db, "users", result.user.uid),
        {
          email: result.user.email,
          username: result.user.email.split("@")[0],
          createdAt: serverTimestamp()
        },
        { merge: true }
      );
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

/* Optional styling for the forgot password button */
.forgot-password-button {
  background: none;
  border: none;
  color: #6a11cb;
  font-size: 12px;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  margin: 0;
}
</style>
