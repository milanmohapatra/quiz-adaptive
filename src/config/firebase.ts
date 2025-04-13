import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyA8nD-M2NoLGUCvSbjYu6o_zaYTn-tve0c",
  authDomain: "quiz-adaptive-d93cb.firebaseapp.com",
  projectId: "quiz-adaptive-d93cb",
  storageBucket: "quiz-adaptive-d93cb.firebasestorage.app",
  messagingSenderId: "183654392895",
  appId: "1:183654392895:web:4577e27e6ebdce469ac48a",
  measurementId: "G-GHCF8H2ZBX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app; 