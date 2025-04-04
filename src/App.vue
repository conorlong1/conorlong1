<template>
  <nav>
    <button
      @click="handleSignOut"
      v-if="isLoggedIn"
      class="space-signout"
    >
      Sign Out
    </button>
  </nav>
  <router-view/>
</template>

<script setup>
import router from "../src/router";
import { onMounted, ref } from "vue";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

const isLoggedIn = ref(false);
let auth;

onMounted(() => {
  auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    isLoggedIn.value = !!user;
  });
});

const handleSignOut = () => {
  signOut(auth).then(() => {
    router.push("/");
  });
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
}

/* Space-themed sign out button */
.space-signout {
  background: linear-gradient(145deg, #0d0d2b, #0a0a23, #0d0d2b);
  background-size: 400% 400%;
  animation: gradientShift 8s ease infinite;
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 50px;
  font-family: 'Orbitron', sans-serif;
  font-size: 1.2rem;
  letter-spacing: 1px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 15px rgba(15, 52, 96, 0.8);
}

/* Moving background animation */
@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Shine effect on hover */
.space-signout::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.space-signout:hover {
  transform: scale(1.1);
  box-shadow: 0 0 25px rgba(15, 52, 96, 1);
}

.space-signout:hover::before {
  opacity: 1;
  animation: shine 0.5s;
}

/* Rotate the shine effect */
@keyframes shine {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
