// Import the functions you need from the SDKs you need
import { initializeApp } from "@firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcV4vVG5e7xnRZHNta2xaRabozN0oW8yQ",
  authDomain: "brotech-web-solutions.firebaseapp.com",
  projectId: "brotech-web-solutions",
  storageBucket: "brotech-web-solutions.appspot.com",
  messagingSenderId: "288226787153",
  appId: "1:288226787153:web:1be0e4aea819074dbe5d70"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };