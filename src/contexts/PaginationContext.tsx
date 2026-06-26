import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface PaginationState {
  [key: string]: number; // Maps page routes to their current pagination number
}

interface PaginationContextType {
  getCurrentPage: (pageKey: string) => number;
  setCurrentPage: (pageKey: string, pageNumber: number) => void;
  clearPageState: (pageKey: string) => void;
}

const PaginationContext = createContext<PaginationContextType | undefined>(undefined);

export const usePagination = (): PaginationContextType => {
  const context = useContext(PaginationContext);
  if (!context) {
    throw new Error('usePagination must be used within a PaginationProvider');
  }
  return context;
};

interface PaginationProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'pagination_state';

export const PaginationProvider = ({ children }: PaginationProviderProps) => {
  const [paginationState, setPaginationState] = useState<PaginationState>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage when component mounts
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        setPaginationState(JSON.parse(savedState));
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading pagination state from localStorage:', error);
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage whenever state changes, but only after initialization
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(paginationState));
      } catch (error) {
        console.error('Error saving pagination state to localStorage:', error);
      }
    }
  }, [paginationState, isInitialized]);

  // Use useCallback to memoize functions and prevent unnecessary rerenders
  const getCurrentPage = useCallback((pageKey: string): number => {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      // console.log(`[PaginationContext] Getting page for ${pageKey}: ${paginationState[pageKey] || 1}`);
    }
    return paginationState[pageKey] || 1;
  }, [paginationState]);

  const setCurrentPage = useCallback((pageKey: string, pageNumber: number): void => {
    // Only update if the page number actually changed
    if (paginationState[pageKey] !== pageNumber) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PaginationContext] Setting page for ${pageKey} to ${pageNumber}`);
      }
      setPaginationState(prev => ({
        ...prev,
        [pageKey]: pageNumber
      }));
    }
  }, [paginationState]);

  const clearPageState = useCallback((pageKey: string): void => {
    setPaginationState(prev => {
      const newState = { ...prev };
      delete newState[pageKey];
      return newState;
    });
  }, []);

  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = {
    getCurrentPage,
    setCurrentPage,
    clearPageState,
  };

  return (
    <PaginationContext.Provider value={contextValue}>
      {children}
    </PaginationContext.Provider>
  );
}; 