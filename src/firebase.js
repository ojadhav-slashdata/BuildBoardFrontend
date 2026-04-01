import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCFVQ4N0GSTC6K2E1014Ej5XQArtCOefE8",
  authDomain: "buildboard-a025e.firebaseapp.com",
  projectId: "buildboard-a025e",
  storageBucket: "buildboard-a025e.firebasestorage.app",
  messagingSenderId: "932850436937",
  appId: "1:932850436937:web:250434c19c9fb6a9252898",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
