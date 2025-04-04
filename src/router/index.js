import { createRouter, createWebHistory } from "vue-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
const router = createRouter({
    history: createWebHistory(),
    routes: [
      //  { path: "/", component: () => import("../pages/Register.vue") },
        { path: "/", component: () => import("../pages/Signup.vue")},
        //{ path: "/Dashboard" , component: () => import("../pages/feed.vue")},
      //  { path: "/Sign" , component: () => import("../components/Signup.vue") },
        { 
            path: "/feed",
            component: () => import("../pages/test.vue"),
            meta: {
                requiresAuth: true,
            },
        },

        
    ],

});

const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const removeListener = onAuthStateChanged(
            getAuth(),
            (user) => {
                removeListener();
                resolve(user);
            },

            reject
        )
    })

};

router.beforeEach(async(to,from,next) => {
    if (to.matched.some((record) => record.meta.requiresAuth)) {
        if(await getCurrentUser()){
            next();
        } else{
            alert("you dont have access!");
            next("/");
        }
    } else{
        next();
    }
})



export default router;
