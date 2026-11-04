import { getApp, getApps, initializeApp } from "firebase/app";

// Firebase web config identifies the project and is safe to ship to the browser.
// Access is enforced by Security Rules and API key restrictions, not by hiding it.
const firebaseConfig = {
  apiKey: "AIzaSyBscOjkgVpV9BAE_tuyLdS2Fw99k2RU50Q",
  authDomain: "techgulf-jobs.firebaseapp.com",
  projectId: "techgulf-jobs",
  storageBucket: "techgulf-jobs.firebasestorage.app",
  messagingSenderId: "451096726259",
  appId: "1:451096726259:web:24496c392b89f17dc84586",
  measurementId: "G-7PJP66806Q",
};

// Reuse the existing instance across hot reloads and repeat imports
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
