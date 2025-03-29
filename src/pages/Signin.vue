<template>
    <!-- Sign In Page -->
    <h1>Sign into an account</h1>
    <!-- Email Input -->
    <p>
      <input type="text" placeholder="Email" v-model="email" />
    </p>
    <!-- Password Input -->
    <p>
      <input type="password" placeholder="Password" v-model="password" />
    </p>
    <!-- Display error message if one exists -->
    <p v-if="errMsg">{{ errMsg }}</p>
    <!-- Button to trigger sign in -->
    <p>
      <button @click="signIn">Submit</button>
    </p>
    <!-- Button for Google sign in (implementation pending) -->
    <p>
      <button @click="signInWithGoogle">Sign in with Google</button>
    </p>
  </template>
  
  <script setup>
  // Import ref for reactive state management
  import { ref } from "vue";
  // Import the correct Firebase function for signing in with email and password
  import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
  // Import Vue Router to navigate upon successful login
  import { useRouter } from "vue-router";
  
  // Create reactive variables for email, password, and an error message
  const email = ref("");
  const password = ref("");
  const errMsg = ref("");
  
  // Get the router instance for navigation
  const router = useRouter();
  
  // Function to sign in an existing user using Firebase authentication
  const signIn = () => {
    // Call Firebase's signInWithEmailAndPassword with the provided email and password
    signInWithEmailAndPassword(getAuth(), email.value, password.value)
      .then((data) => {
        // Log success message and navigate to the dashboard after successful login
        console.log("Successfully logged in!");
        router.push("/dashboard");
      })
      .catch((error) => {
        // Log the error code for debugging
        console.log(error.code);
        // Update the error message based on the specific error code received
        switch (error.code) {
          case "auth/invalid-email":
            errMsg.value = "Invalid email";
            break;
          case "auth/user-not-found":
            errMsg.value = "No account with that email was found";
            break;
          case "auth/wrong-password":
            errMsg.value = "Incorrect password";
            break;
          default:
            errMsg.value = "Email or password was incorrect";
            break;
        }
        // Alert the error message to the user
        alert(error.message);
      });
  };
  
  // Placeholder function for signing in with Google (implementation can be added later)
  const signInWithGoogle = () => {
    // Google sign in implementation goes here
  };
  </script>
  