// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAJ-pqYoAbuq6Ha3MwxOCrOUNHvAqytzOc",
  authDomain: "sos-safety-app-e8b61.firebaseapp.com",
  projectId: "sos-safety-app-e8b61",
  storageBucket: "sos-safety-app-e8b61.firebasestorage.app",
  messagingSenderId: "756713129114",
  appId: "1:756713129114:web:0999e8ab0bbabc23264b23",
  measurementId: "G-2CMLRSVSNG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
