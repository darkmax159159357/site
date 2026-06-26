'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { onAuthStateChange, UserData, getCurrentUser, signOut } from '@/lib/firebaseAuth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  logout: async () => {},
  refreshUserData: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user data from Firestore
  const fetchUserData = async (authUser: User) => {
    try {
      // Get user document
      const userDoc = await getDoc(doc(db, "users", authUser.uid));
      const userDocData = userDoc.exists() ? userDoc.data() : null;
      
      console.log("AuthContext: User document exists:", userDoc.exists());
      
      if (!userDocData) {
        // Create user document if it doesn't exist
        console.log("AuthContext: Creating user document for", authUser.uid);
        const newUserData: UserData = {
          uid: authUser.uid,
          email: authUser.email || 'unknown@email.com',
          displayName: authUser.displayName || "",
          photoURL: authUser.photoURL || "",
          createdAt: new Date().toISOString(),
          role: "user",
          coins: 0, // Initialize coins
        };
        
        await setDoc(
          doc(db, "users", authUser.uid),
          newUserData,
          { merge: true }
        );
        
        console.log("AuthContext: Created user document");
        setUserData(newUserData);
      } else {
        // Cast existing data to UserData
        const typedUserData: UserData = {
          uid: authUser.uid,
          email: userDocData.email || authUser.email || 'unknown@email.com',
          displayName: userDocData.displayName,
          photoURL: userDocData.photoURL,
          role: userDocData.role || 'user',
          createdAt: userDocData.createdAt,
          coins: userDocData.coins || 0,
        };
        setUserData(typedUserData);
      }
    } catch (error) {
      console.error("AuthContext: Error fetching user data:", error);
      // Create minimal valid UserData
      const minimalUserData: UserData = {
        uid: authUser.uid,
        email: authUser.email || 'unknown@email.com',
        role: "user",
        coins: 0,
      };
      setUserData(minimalUserData);
    }
  };

  useEffect(() => {
    console.log("AuthContext: Starting auth state listener");
    const unsubscribe = onAuthStateChange(async (authUser) => {
      console.log("AuthContext: Auth state changed:", authUser ? `User ${authUser.uid} logged in` : "No user");
      
      if (authUser) {
        setUser(authUser);
        await fetchUserData(authUser);
      } else {
        setUser(null);
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => {
      console.log("AuthContext: Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  // Refresh user data function
  const refreshUserData = async () => {
    if (user) {
      console.log("AuthContext: Refreshing user data");
      await fetchUserData(user);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const value = {
    user,
    userData,
    loading,
    logout,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 