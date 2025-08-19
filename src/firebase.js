
// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // ✅

import { doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCiuqN0auQaWV4XdHy4QtXNrmyXJF_uJpQ",
  authDomain: "sd-card-phase-2.firebaseapp.com",
  projectId: "sd-card-phase-2",
  storageBucket: "sd-card-phase-2.firebasestorage.app",
  messagingSenderId: "624239386035",
  appId: "1:624239386035:web:47c06ae54ec9537d253fc6",
  measurementId: "G-F5PMVNL0LV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // ✅
const provider = new GoogleAuthProvider();

export { app, auth, db, storage };


