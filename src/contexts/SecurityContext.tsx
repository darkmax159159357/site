"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { initAntiScraping, initDevToolsGuard } from '@/lib/anti-scraping';

interface SecuritySettings {
  chapterProtection: boolean;
  devGuardMode: boolean;
  maintenanceMode: boolean;
  rightClickBlocker: boolean;
}

interface SecurityContextType {
  securitySettings: SecuritySettings;
  loading: boolean;
}

const defaultSecuritySettings: SecuritySettings = {
  chapterProtection: false,
  devGuardMode: false,
  maintenanceMode: false,
  rightClickBlocker: false
};

const SecurityContext = createContext<SecurityContextType>({
  securitySettings: defaultSecuritySettings,
  loading: true
});

export const useSecuritySettings = () => useContext(SecurityContext);

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(defaultSecuritySettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSecuritySettings = async () => {
      try {
        console.log("Checking security settings...");

        // Get initial state immediately with getDoc
        const docSnap = await getDoc(doc(db, 'site_security_settings', 'security'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Security settings data:", data);
          
          // TEMPORARILY FORCE devGuardMode to false while fixing issues
          const settings = {
            chapterProtection: data?.chapterProtection === true,
            devGuardMode: false, // Force to false regardless of Firebase setting
            maintenanceMode: data?.maintenanceMode === true,
            rightClickBlocker: data?.rightClickBlocker === true
          };
          
          setSecuritySettings(settings);

          // Initialize anti-scraping based on settings
          initAntiScraping(settings.chapterProtection);
          
          // Disabled dev tools guard temporarily
          // if (settings.devGuardMode) {
          //   initDevToolsGuard();
          // }
        } else {
          console.log("No security settings document found");
          setSecuritySettings(defaultSecuritySettings);
        }
        
        // Set up real-time listener for security setting changes
        const unsubscribe = onSnapshot(doc(db, 'site_security_settings', 'security'), (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            console.log("Security settings snapshot update:", data);
            
            // TEMPORARILY FORCE devGuardMode to false while fixing issues
            const newSettings = {
              chapterProtection: data?.chapterProtection === true,
              devGuardMode: false, // Force to false regardless of Firebase setting
              maintenanceMode: data?.maintenanceMode === true,
              rightClickBlocker: data?.rightClickBlocker === true
            };
            
            setSecuritySettings(newSettings);

            // Update anti-scraping when settings change
            initAntiScraping(newSettings.chapterProtection);
            
            // Disabled dev tools guard temporarily
            // if (newSettings.devGuardMode) {
            //   initDevToolsGuard();
            // }
          } else {
            console.log("Security document doesn't exist in snapshot");
            setSecuritySettings(defaultSecuritySettings);
          }
          setLoading(false);
        }, (error) => {
          console.error('Error getting security settings:', error);
          setSecuritySettings(defaultSecuritySettings);
          setLoading(false);
        });

        // Clean up subscription
        return () => unsubscribe();
      } catch (error) {
        console.error('Failed to set up security settings listener:', error);
        setSecuritySettings(defaultSecuritySettings);
        setLoading(false);
      }
    };

    fetchSecuritySettings();
  }, []);

  // Implement right click blocker
  useEffect(() => {
    if (securitySettings.rightClickBlocker) {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        return false;
      };
      
      document.addEventListener('contextmenu', handleContextMenu);
      
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, [securitySettings.rightClickBlocker]);
  
  // Implement devtools detection and redirection
  useEffect(() => {
    // Temporarily disable dev guard mode until we fix the issues
    // Only initialize when explicitly enabled
    if (securitySettings.devGuardMode) {
      console.log("Dev Guard Mode enabled - activating protection");
      initDevToolsGuard();
    }
  }, [securitySettings.devGuardMode]);

  return (
    <SecurityContext.Provider value={{ securitySettings, loading }}>
      {children}
    </SecurityContext.Provider>
  );
};

export default SecurityContext; 