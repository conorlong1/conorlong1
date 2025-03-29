<template>
    <!-- Registration Page -->
    <h1>Create an account</h1>
    <!-- Email Input -->
    <p>
      <input type="text" placeholder="Email" v-model="email" />
    </p>
    <!-- Password Input -->
    <p>
      <input type="password" placeholder="Password" v-model="password" />
    </p>
    <!-- Button to trigger registration -->
    <p>
      <button @click="register">Submit</button>
    </p>
    <!-- Button for Google sign in (implementation pending) -->
    <p>
      <button @click="signInWithGoogle">Sign in with Google</button>
    </p>
  </template>
  
  <script setup>
  // Import Vue's ref to create reactive variables
  import { ref } from "vue";
  // Import Firebase's auth functions needed for registration
  import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
  // Import Vue Router to navigate after registration
  import { useRouter } from "vue-router";
  
  // Create reactive variables for email and password inputs
  const email = ref("");
  const password = ref("");
  
  // Get the router instance for navigation
  const router = useRouter();
  
  // Function to register a new user using Firebase authentication
  const register = () => {
    // Call Firebase's createUserWithEmailAndPassword with the provided email and password
    createUserWithEmailAndPassword(getAuth(), email.value, password.value)
      .then((data) => {
        // Log success message and navigate to the dashboard after successful registration
        console.log("Successfully registered!");
        router.push("/dashboard");
      })
      .catch((error) => {
        // Log and alert the error if registration fails
        console.log(error.code);
        alert(error.message);
      });
  };
  
  // Placeholder function for signing in with Google (implementation can be added later)
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(getAuth(), provider)
    .then((result) => {
        console.log(result.user);
        router.push("/feed");

    })
    .catch((error) => {

    });
    
    // Google sign in implementation goes here
  };
  </script>
  