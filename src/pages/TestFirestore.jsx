import { useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAqN_VnEv7pA1jhMWYpgQzmZSJFBCiDieE",
  authDomain: "akshay-heaters-erp-47997.firebaseapp.com",
  projectId: "akshay-heaters-erp-47997",
  storageBucket: "akshay-heaters-erp-47997.firebasestorage.app",
  messagingSenderId: "412656396586",
  appId: "1:412656396586:web:693199cf6dd20737425653"
};

export default function TestFirestore() {
  useEffect(() => {
    async function run() {
      try {
        const app = initializeApp(firebaseConfig, "test-app");
        const db = getFirestore(app);

        console.log("START QUERY");

        const snap = await getDocs(collection(db, "products"));

        console.log("SUCCESS");
        console.log("SIZE:", snap.size);
      } catch (e) {
        console.error("ERROR:", e);
      }
    }

    run();
  }, []);

  return <h1>Firestore Test</h1>;
}