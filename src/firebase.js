import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA7prIEcxAdr_aGKHjilNYzurxphYf8JY0",
  authDomain: "product-system-3f2d2.firebaseapp.com",
  projectId: "product-system-3f2d2",
  storageBucket: "product-system-3f2d2.firebasestorage.app",
  messagingSenderId: "834879582990",
  appId: "1:834879582990:web:d5a2b875f344fb50269d5f",
};

const app = initializeApp(firebaseConfig);

// Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);



export default app;