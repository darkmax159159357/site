// Import the functions from the SDKs
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 
import { getAuth, connectAuthEmulator, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence, indexedDBLocalPersistence, setPersistence, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyByXD1b6Il99BzhFgKQlImiwSjS8CHFX2I",
  authDomain: "site-719fc.firebaseapp.com",
  projectId: "site-719fc",
  storageBucket: "site-719fc.firebasestorage.app",
  messagingSenderId: "219622654843",
  appId: "1:219622654843:web:d7cb9312d08682ec2e33de",
  measurementId: "G-BZJN891YT2"
};

// Initialize Firebase
let firebaseApp;

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0];
}

// Export the services
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);

// Configure auth persistence for better user experience
if (typeof window !== 'undefined') {
  // Try to use IndexedDB persistence first, fall back to localStorage
  const persistenceType = indexedDBLocalPersistence || browserLocalPersistence;
  
  // Set auth persistence
  setPersistence(auth, persistenceType)
    .then(() => {
      console.log("Firebase auth persistence set successfully");
    })
    .catch(error => {
      console.error("Auth persistence error:", error);
    });
}

// Configure Google Auth provider
export const googleProvider = new GoogleAuthProvider();
// Add scopes if needed
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

export const storage = getStorage(firebaseApp);
export default firebaseApp; 