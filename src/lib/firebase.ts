import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA3LM1trsCSfmjVUZUce2CxHuhzbc9MG3g",
  authDomain: "mysmallhealthapp.firebaseapp.com",
  projectId: "mysmallhealthapp",
  storageBucket: "mysmallhealthapp.firebasestorage.app",
  messagingSenderId: "56793249551",
  appId: "1:56793249551:web:2158b721f69361ffc3f07a",
  measurementId: "G-QWP11YDX39"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
