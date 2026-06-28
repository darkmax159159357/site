import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  User,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';

// Types
export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: 'user' | 'admin';
  createdAt?: string;
  coins?: number;
  purchasedChapters?: string[]; // Array of purchased chapter IDs
}

// Check if username already exists
export const usernameExists = async (displayName: string): Promise<boolean> => {
  if (!displayName) return false;
  
  try {
    // Get all users (small collection) and filter client-side
    // This avoids the need for indexes and works around security rule limitations
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    // Check if any user has this displayName
    return querySnapshot.docs.some(
      doc => doc.data().displayName?.toLowerCase() === displayName.toLowerCase()
    );
  } catch (error) {
    console.error('Error checking username:', error);
    // Don't block registration if check fails
    return false;
  }
};

// Register a new user
export const registerUser = async (email: string, password: string, displayName: string): Promise<UserData> => {
  try {
    // First check if username is already taken
    const usernameIsTaken = await usernameExists(displayName);
    if (usernameIsTaken) {
      console.log("Username already exists:", displayName);
      throw new Error('username-already-in-use');
    }

    console.log("Creating Firebase Auth user with email:", email);
    
    // Create user in Firebase Auth
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("User created successfully, setting display name:", displayName);

    // Set display name
    await updateProfile(user, { displayName });
    
    console.log("Profile updated, creating Firestore document");

    // Create user document in Firestore
    const userData: UserData = {
      uid: user.uid,
      email: user.email || email,
      displayName,
      role: 'user', // default role
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', user.uid), userData);
    
    console.log("User registration complete:", userData.uid);
    return userData;
  } catch (error: any) {
    console.error('Error registering user:', error);
    
    // Handle Firebase Auth errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('email-already-in-use');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('weak-password');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('invalid-email');
    }
    
    // Re-throw custom error or original error
    throw error;
  }
};

// Sign in existing user
export const signIn = async (email: string, password: string): Promise<UserData> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    } else {
      // If user exists in Auth but not in Firestore, create a document
      const userData: UserData = {
        uid: user.uid,
        email: user.email || email,
        displayName: user.displayName || '',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      return userData;
    }
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw new Error(error.message || 'Error signing in');
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message || 'Error signing out');
  }
};

// Get current user data
export const getCurrentUser = async (): Promise<UserData | null> => {
  const user = auth.currentUser;
  
  if (!user) return null;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (data: Partial<UserData>): Promise<UserData | null> => {
  const user = auth.currentUser;
  
  if (!user) throw new Error('No authenticated user');
  
  try {
    // Check if trying to update to a username that already exists
    if (data.displayName && data.displayName !== user.displayName) {
      const nameExists = await usernameExists(data.displayName);
      if (nameExists) {
        throw new Error('Username already taken');
      }
    }
    
    // Update auth profile if display name or photo URL was provided
    if (data.displayName || data.photoURL) {
      await updateProfile(user, {
        displayName: data.displayName || user.displayName,
        photoURL: data.photoURL || user.photoURL
      });
    }
    
    // Update Firestore document
    const userRef = doc(db, 'users', user.uid);
    
    // Remove uid from data to prevent overwriting
    const { uid, ...updateData } = data;
    
    await setDoc(userRef, updateData, { merge: true });
    
    // Get updated user data
    const updatedUserDoc = await getDoc(userRef);
    return updatedUserDoc.exists() ? (updatedUserDoc.data() as UserData) : null;
  } catch (error: any) {
    console.error('Error updating profile:', error);
    throw new Error(error.message || 'Error updating profile');
  }
};

// Update password
export const changePassword = async (newPassword: string): Promise<void> => {
  const user = auth.currentUser;
  
  if (!user) throw new Error('No authenticated user');
  
  try {
    await updatePassword(user, newPassword);
  } catch (error: any) {
    console.error('Error updating password:', error);
    throw new Error(error.message || 'Error updating password');
  }
};

// Auth state change listener with improved logging
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  console.log("Setting up onAuthStateChanged listener");
  
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log("Firebase auth state changed:", user ? `User ${user.uid} is signed in` : "User is signed out");
    callback(user);
  }, (error) => {
    console.error("Firebase auth state change error:", error);
  });
  
  return unsubscribe;
};

// Ensure a Firestore user document exists for a Google-authenticated user.
const ensureGoogleUserDoc = async (user: User): Promise<UserData> => {
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (userDoc.exists()) {
    return userDoc.data() as UserData;
  }
  const userData: UserData = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    role: 'user',
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', user.uid), userData);
  console.log('Created new user document for Google sign-in:', user.uid);
  return userData;
};

const buildGoogleProvider = (): GoogleAuthProvider => {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/userinfo.email');
  provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
};

// Call once on the sign-in page load to complete a redirect-based Google login.
// Returns the user data if a redirect just completed, otherwise null.
export const completeGoogleRedirect = async (): Promise<UserData | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      return await ensureGoogleUserDoc(result.user);
    }
    return null;
  } catch (error) {
    console.error('Error completing Google redirect sign-in:', error);
    return null;
  }
};

// Google sign-in: try a popup first; if the browser blocks it, fall back to a
// full-page redirect (works everywhere, including strict popup blockers).
export const signInWithGoogle = async (): Promise<UserData | null> => {
  const provider = buildGoogleProvider();
  try {
    const userCredential = await signInWithPopup(auth, provider);
    console.log('Google sign-in successful:', userCredential.user.uid);
    return await ensureGoogleUserDoc(userCredential.user);
  } catch (error: any) {
    const code = error?.code || '';
    // Popup blocked / closed / unsupported → use redirect instead.
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      console.warn('Popup unavailable, falling back to redirect sign-in:', code);
      await signInWithRedirect(auth, provider);
      // The page will navigate away; resolve null. completeGoogleRedirect()
      // finishes the flow when the user returns.
      return null;
    }
    console.error('Error signing in with Google:', error);
    throw new Error(error.message || 'Error signing in with Google');
  }
};

// Discord sign-in
export const signInWithDiscord = async (): Promise<void> => {
  try {
    // Discord OAuth2 configuration
    const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1234567890'; // Add fallback for testing
    const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://glintscans.com').replace(/\/$/, '');
    const DISCORD_REDIRECT_URI = `${SITE_URL}/api/auth/discord/callback`;
    
    console.log("Initiating Discord sign-in");
    console.log("Redirect URI:", DISCORD_REDIRECT_URI);
    
    if (!DISCORD_CLIENT_ID) {
      console.error('Discord client ID is not configured');
      throw new Error('Discord client ID is not configured');
    }
    
    // Construct Discord OAuth URL
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20email`;
    
    console.log("Redirecting to Discord auth URL:", authUrl);
    
    // Redirect to Discord's authorization page
    window.location.href = authUrl;
  } catch (error: any) {
    console.error('Error with Discord authentication:', error);
    throw new Error(error.message || 'Error with Discord authentication');
  }
}; 