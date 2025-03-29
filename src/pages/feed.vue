<template> 
  
   
    <div class="feed">
      <h1>Welcome {{ userEmail }} to PlanIt Shared Calendar</h1>
      <!-- additional content -->
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from "vue";
  import { getAuth, onAuthStateChanged } from "firebase/auth";
  
  const userEmail = ref("");
  const auth = getAuth();
  
  // Use onAuthStateChanged to handle asynchronous auth state
  onMounted(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        userEmail.value = user.email;
      } else {
        // Optional: redirect to login if no user is signed in
      }
    });
  });
  </script>
  
  <style scoped>
  </style>
  