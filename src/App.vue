

<template>
 <nav>
  
   <router-link to ="/dashboard"> dashboard</router-link>
  
  <button @click="handleSignOut" v-if="isLoggedIn"> Sign out</button>
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
    if (user) {
      isLoggedIn.value = true;
    } else {
      isLoggedIn.value = false;
    }
    });
  });



const handleSignOut = () => {
  signOut(auth).then(() => {
    router.push("/");

  });

};
</script>
<style>
#app{
  font-family: Avenir, Helvetica, Arial, sans-serrif;
  -webkit-font-smoothing: antialised;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;

}
</style>

