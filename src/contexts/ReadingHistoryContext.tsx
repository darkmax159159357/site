'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  updateReadingHistory, 
  getUserReadingHistory,
  deleteReadingHistory,
  clearReadingHistory,
  checkReadingHistory,
  ReadingHistory,
  PLACEHOLDER_COVER
} from '@/lib/firebaseBookmarks';
import { auth } from '@/lib/firebase';

interface ReadingHistoryContextType {
  history: ReadingHistory[];
  isLoading: boolean;
  updateHistory: (mangaId: string, title: string, cover: string, chapterNumber: number, percentage?: number) => Promise<ReadingHistory | null>;
  removeFromHistory: (mangaId: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  getLastReadChapter: (mangaId: string) => Promise<number | null>;
  refreshHistory: () => Promise<void>;
}

const ReadingHistoryContext = createContext<ReadingHistoryContextType | null>(null);

export const useReadingHistory = () => {
  const context = useContext(ReadingHistoryContext);
  if (!context) {
    throw new Error('useReadingHistory must be used within a ReadingHistoryProvider');
  }
  return context;
};

export const ReadingHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Check if user is properly authenticated
  const isUserAuthenticated = React.useMemo(() => {
    return !!(user && user.uid && auth.currentUser && auth.currentUser.uid === user.uid);
  }, [user]);
  
  // Log authentication status for debugging
  useEffect(() => {
    console.log("Auth status in ReadingHistoryProvider:", {
      userFromContext: user ? `User ${user.uid}` : "No user in context",
      currentAuthUser: auth.currentUser ? `User ${auth.currentUser.uid}` : "No current auth user",
      isAuthenticated: isUserAuthenticated
    });
  }, [user, isUserAuthenticated]);

  // Load reading history when user changes
  useEffect(() => {
    let isMounted = true;
    
    const loadHistory = async () => {
      if (!isUserAuthenticated) {
        console.log("User not authenticated, skipping history load");
        if (isMounted) {
          setHistory([]);
          setIsLoading(false);
        }
        return;
      }
      
      console.log("Loading reading history for user:", user!.uid);
      setIsLoading(true);
      
      // Set a timeout to ensure isLoading is reset even if the operation hangs
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          console.log("History loading timed out, forcing isLoading to false");
          setIsLoading(false);
        }
      }, 3000); // Reduced from 5000ms to 3000ms for faster loading fallback
      
      try {
        const fetchedHistory = await getUserReadingHistory();
        if (isMounted) {
          console.log(`Found ${fetchedHistory.length} history items for user ${user!.uid}`);
          
          // Process history items to ensure valid cover paths
          const processedHistory = fetchedHistory.map(item => {
            if (!item.cover || item.cover === 'undefined' || item.cover === 'null') {
              console.log(`Fixed missing cover for item: ${item.title}`);
              return { ...item, cover: PLACEHOLDER_COVER };
            }
            return item;
          });
          
          setHistory(processedHistory);
        }
      } catch (error) {
        console.error('Error loading reading history:', error);
        if (isMounted) {
          // Ensure we set history to empty array on error
          setHistory([]);
        }
      } finally {
        // Clear the timeout since the operation completed
        clearTimeout(timeoutId);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Immediately set a hard timeout to prevent infinite loading
    const hardTimeoutId = setTimeout(() => {
      if (isMounted) {
        console.log("HARD TIMEOUT: Force ending loading state after 5 seconds regardless of operation");
        setIsLoading(false);
      }
    }, 5000);

    loadHistory();

    return () => {
      isMounted = false;
      clearTimeout(hardTimeoutId);
    };
  }, [user, isUserAuthenticated]);

  const refreshHistory = async () => {
    if (!isUserAuthenticated) {
      console.log("User not authenticated, skipping history refresh");
      return;
    }
    
    setIsLoading(true);
    console.log("Refreshing reading history for user:", user!.uid);
    
    // Set a timeout to ensure isLoading is reset even if the operation hangs
    const timeoutId = setTimeout(() => {
      console.log("History refresh timed out, forcing isLoading to false");
      setIsLoading(false);
    }, 5000);
    
    try {
      const fetchedHistory = await getUserReadingHistory();
      console.log(`Refreshed ${fetchedHistory.length} history items`);
      
      // Process history items to ensure valid cover paths
      const processedHistory = fetchedHistory.map(item => {
        if (!item.cover || item.cover === 'undefined' || item.cover === 'null') {
          return { ...item, cover: PLACEHOLDER_COVER };
        }
        return item;
      });
      
      setHistory(processedHistory);
    } catch (error) {
      console.error('Error refreshing reading history:', error);
      // Ensure we're not stuck in loading state
      setIsLoading(false);
    } finally {
      // Clear the timeout since the operation completed
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const updateHistory = async (
    mangaId: string,
    title: string,
    cover: string,
    chapterNumber: number,
    percentage: number = 100
  ): Promise<ReadingHistory | null> => {
    if (!user) {
      console.error('Cannot update history - user not logged in');
      return null;
    }
    
    console.log(`Updating reading history for ${title} (Chapter ${chapterNumber})`);
    console.log(`Cover path provided: ${cover}`);
    
    // Normalize the cover path
    let normalizedCover = cover;
    if (!cover || cover.includes('placeholder')) {
      console.log('Using placeholder cover instead of:', cover);
      normalizedCover = PLACEHOLDER_COVER;
    } else if (cover.startsWith('/manga/')) {
      console.log('Using manga path cover:', cover);
      normalizedCover = cover; // Keep the manga path as is
    } else if (!cover.startsWith('http') && !cover.startsWith('/')) {
      // If the cover path doesn't have http or start with /, add a leading slash
      console.log('Adding leading slash to cover path:', cover);
      normalizedCover = `/${cover}`;
    }
    
    // Final check to ensure we always have a valid cover path
    if (!normalizedCover || normalizedCover === 'undefined' || normalizedCover === 'null') {
      console.log('Invalid cover path detected, using placeholder');
      normalizedCover = PLACEHOLDER_COVER;
    }
    
    try {
      // Try to update history using Firebase
      const result = await updateReadingHistory(
        mangaId,
        title,
        normalizedCover, // Use normalized cover
        chapterNumber,
        percentage
      );
      
      console.log("History updated successfully:", result);
      
      // Update local state
      await refreshHistory();
      
      return result;
    } catch (error) {
      console.error("Failed to update reading history:", error);
      return null;
    }
  };

  const removeFromHistory = async (mangaId: string): Promise<void> => {
    if (!user) return;
    
    try {
      await deleteReadingHistory(mangaId);
      setHistory(prevHistory => prevHistory.filter(h => h.mangaId !== mangaId));
      console.log(`Removed manga ${mangaId} from history`);
    } catch (error) {
      console.error('Error removing from history:', error);
    }
  };

  const clearHistory = async (): Promise<void> => {
    if (!user) return;
    
    try {
      await clearReadingHistory();
      setHistory([]);
      console.log("Reading history cleared");
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const getLastReadChapter = async (mangaId: string): Promise<number | null> => {
    if (!user) return null;
    
    try {
      // First check local state
      const historyItem = history.find(h => h.mangaId === mangaId);
      
      if (historyItem) {
        return historyItem.lastChapter;
      }
      
      // If not in local state, fetch from Firebase
      const remoteHistory = await checkReadingHistory(mangaId);
      return remoteHistory?.lastChapter || null;
    } catch (error) {
      console.error('Error getting last read chapter:', error);
      return null;
    }
  };

  const value = {
    history,
    isLoading,
    updateHistory,
    removeFromHistory,
    clearHistory,
    getLastReadChapter,
    refreshHistory
  };

  return (
    <ReadingHistoryContext.Provider value={value}>
      {children}
    </ReadingHistoryContext.Provider>
  );
};

export default ReadingHistoryContext; 