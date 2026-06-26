'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import MaintenancePage from '@/components/MaintenancePage';

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  loading: boolean;
}

const MaintenanceContext = createContext<MaintenanceContextType>({
  isMaintenanceMode: false,
  loading: true,
});

export const useMaintenanceStatus = () => useContext(MaintenanceContext);

interface MaintenanceProviderProps {
  children: ReactNode;
}

export const MaintenanceProvider: React.FC<MaintenanceProviderProps> = ({ children }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        console.log("Checking maintenance status...");

        // Get initial state immediately with getDoc
        const docSnap = await getDoc(doc(db, 'site_security_settings', 'security'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Maintenance document data:", data);
          const maintenanceEnabled = data?.maintenanceMode === true;
          console.log("Maintenance mode is:", maintenanceEnabled);
          setIsMaintenanceMode(maintenanceEnabled);
        } else {
          console.log("No maintenance document found");
          setIsMaintenanceMode(false);
        }
        
        // Set up real-time listener for maintenance mode changes
        const unsubscribe = onSnapshot(doc(db, 'site_security_settings', 'security'), (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            console.log("Maintenance snapshot update:", data);
            setIsMaintenanceMode(data?.maintenanceMode === true);
          } else {
            console.log("Document doesn't exist in snapshot");
            setIsMaintenanceMode(false);
          }
          setLoading(false);
        }, (error) => {
          console.error('Error getting maintenance status:', error);
          // Default to false on error to allow site access
          setIsMaintenanceMode(false);
          setLoading(false);
        });

        // Clean up subscription
        return () => unsubscribe();
      } catch (error) {
        console.error('Failed to set up maintenance mode listener:', error);
        setIsMaintenanceMode(false);
        setLoading(false);
      }
    };

    fetchMaintenanceStatus();
  }, []);

  console.log("Current maintenance state:", isMaintenanceMode, "Loading:", loading);

  // FORCE MAINTENANCE MODE FOR TESTING - Remove this in production
  // Uncomment to force maintenance mode
  // if (!loading) return <MaintenancePage />;

  // Show maintenance page if in maintenance mode and not loading
  if (isMaintenanceMode && !loading) {
    console.log("Rendering maintenance page");
    return <MaintenancePage />;
  }

  return (
    <MaintenanceContext.Provider value={{ isMaintenanceMode, loading }}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export default MaintenanceContext; 