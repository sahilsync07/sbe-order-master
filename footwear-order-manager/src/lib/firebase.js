import { initializeApp } from "firebase/app";
import { getFirestore, enableMultiTabIndexedDbPersistence, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
    apiKey: "AIzaSyAnOcfKSS_v3AiIO94ycZqkCfe5F34Y7Xo",
    authDomain: "sbe-order-master.firebaseapp.com",
    projectId: "sbe-order-master",
    storageBucket: "sbe-order-master.firebasestorage.app",
    messagingSenderId: "168109534624",
    appId: "1:168109534624:web:ad0c21fb12503f3618c8c5",
    measurementId: "G-QQ322R40R9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore with persistent cache
import { persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
    })
}, "sbe-order-master");

export { db };
