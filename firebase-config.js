// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAw9KvbSY55d9x6hPDhyHh10BV2Z1k5vV8",
  authDomain: "cbo-louvor.firebaseapp.com",
  projectId: "cbo-louvor",
  storageBucket: "cbo-louvor.firebasestorage.app",
  messagingSenderId: "726867806418",
  appId: "1:726867806418:web:c460c9df85ebc595b0c50b",
  measurementId: "G-222J6Z2Y3M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
