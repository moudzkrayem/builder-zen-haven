import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCF9q08_lPpFFrCN2X3AZ8EXUppRc4vW1U",
  authDomain: "trybe-2d135.firebaseapp.com",
  projectId: "trybe-2d135",
  storageBucket: "trybe-2d135.firebasestorage.app",
  messagingSenderId: "123986006157",
  appId: "1:123986006157:web:7ad3d39d7cee5ae7afd2c4",
  measurementId: "G-R59MYQ1VCS",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics (browser only)
let analytics: ReturnType<typeof getAnalytics> | undefined;
isSupported().then((ok) => {
  if (ok) analytics = getAnalytics(app);
});

// 🔹 Add Authentication
const auth = getAuth(app);

export { app, analytics, auth };
