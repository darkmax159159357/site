'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AdConfig, getAdConfig } from '@/lib/firebaseAds';

interface AdContextType {
  adConfig: AdConfig | null;
  isLoading: boolean;
}

const defaultContext: AdContextType = {
  adConfig: null,
  isLoading: true,
};

const AdContext = createContext<AdContextType>(defaultContext);

export function useAds() {
  return useContext(AdContext);
}

interface AdProviderProps {
  children: ReactNode;
}

export function AdProvider({ children }: AdProviderProps) {
  const [adConfig, setAdConfig] = useState<AdConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAdConfig() {
      try {
        const config = await getAdConfig();
        setAdConfig(config);
      } catch (error) {
        console.error('Failed to load ad configuration:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAdConfig();
  }, []);

  return (
    <AdContext.Provider value={{ adConfig, isLoading }}>
      {children}
    </AdContext.Provider>
  );
}

export default AdContext; 