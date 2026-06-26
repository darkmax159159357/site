'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  addBookmark, 
  removeBookmark, 
  getUserBookmarks, 
  checkBookmark, 
  updateBookmark,
  Bookmark 
} from '@/lib/firebaseBookmarks';

interface BookmarkContextType {
  bookmarks: Bookmark[];
  isLoading: boolean;
  addToBookmarks: (mangaId: string, title: string, cover: string, lastChapter?: number) => Promise<void>;
  removeFromBookmarks: (mangaId: string) => Promise<void>;
  updateBookmarkChapter: (mangaId: string, lastChapter: number) => Promise<void>;
  isBookmarked: (mangaId: string) => Promise<boolean>;
  refreshBookmarks: () => Promise<void>;
  getLastReadChapter: (mangaId: string) => Promise<string | null>;
  toggleBookmark: (mangaId: string, title: string, cover: string) => Promise<boolean>;
}

const BookmarkContext = createContext<BookmarkContextType | null>(null);

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
};

export const BookmarkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  // Load bookmarks when user changes
  useEffect(() => {
    let isMounted = true;
    
    const loadBookmarks = async () => {
      if (user) {
        console.log("Loading bookmarks for user:", user.uid);
        setIsLoading(true);
        try {
          const fetchedBookmarks = await getUserBookmarks();
          if (isMounted) {
            setBookmarks(fetchedBookmarks);
          }
        } catch (error) {
          console.error('Error loading bookmarks:', error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      } else {
        // Clear bookmarks when logged out
        if (isMounted) {
          setBookmarks([]);
          setIsLoading(false);
          console.log("No authenticated user, cleared bookmarks");
        }
      }
    };

    loadBookmarks();

    return () => {
      console.log("BookmarkContext effect cleaning up");
      isMounted = false;
    };
  }, [user]);

  const refreshBookmarks = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const fetchedBookmarks = await getUserBookmarks();
      setBookmarks(fetchedBookmarks);
    } catch (error) {
      console.error('Error refreshing bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToBookmarks = async (mangaId: string, title: string, cover: string, lastChapter?: number) => {
    if (!user) throw new Error('User must be logged in to add bookmarks');
    
    try {
      // Make sure we don't pass undefined lastChapter to Firebase
      // Only call addBookmark with lastChapter if it's defined
      const bookmark = lastChapter !== undefined
        ? await addBookmark(mangaId, title, cover, lastChapter)
        : await addBookmark(mangaId, title, cover);
        
      if (bookmark) {
        setBookmarks(prevBookmarks => [bookmark, ...prevBookmarks]);
      }
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  };

  const removeFromBookmarks = async (mangaId: string) => {
    if (!user) throw new Error('User must be logged in to remove bookmarks');
    
    try {
      await removeBookmark(mangaId);
      setBookmarks(prevBookmarks => prevBookmarks.filter(bm => bm.mangaId !== mangaId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  };

  const updateBookmarkChapter = async (mangaId: string, lastChapter: number) => {
    if (!user) return;
    
    try {
      const updatedBookmark = await updateBookmark(mangaId, lastChapter);
      if (updatedBookmark) {
        setBookmarks(prevBookmarks => 
          prevBookmarks.map(bm => 
            bm.mangaId === mangaId ? { ...bm, lastChapter, lastRead: updatedBookmark.lastRead } : bm
          )
        );
      }
    } catch (error) {
      console.error('Error updating bookmark chapter:', error);
    }
  };

  const isBookmarked = async (mangaId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Check from the database directly
      return await checkBookmark(mangaId);
    } catch (error) {
      console.error('Error checking if manga is bookmarked:', error);
      return false;
    }
  };

  const getLastReadChapter = async (mangaId: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const bookmark = bookmarks.find(bm => bm.mangaId === mangaId);
      return bookmark && bookmark.lastChapter ? String(bookmark.lastChapter) : null;
    } catch (error) {
      console.error('Error getting last read chapter:', error);
      return null;
    }
  };
  
  const toggleBookmark = async (mangaId: string, title: string, cover: string): Promise<boolean> => {
    if (!user) throw new Error('User must be logged in to toggle bookmarks');
    
    // Prevent multiple operations at the same time
    if (isProcessing) {
      console.log("PREVENTED: Another bookmark operation is already in progress");
      throw new Error('Another bookmark operation is in progress');
    }
    
    console.log(`Beginning toggleBookmark for ${mangaId} - EXPLICIT USER ACTION`);
    
    try {
      setIsProcessing(true);
      
      // First check current status
      const isCurrentlyBookmarked = await isBookmarked(mangaId);
      console.log(`Current bookmark status for ${mangaId}: ${isCurrentlyBookmarked ? 'Bookmarked' : 'Not bookmarked'}`);
      
      if (isCurrentlyBookmarked) {
        console.log(`Removing bookmark for ${mangaId}`);
        await removeBookmark(mangaId);
        // Update local state to keep UI in sync
        setBookmarks(prevBookmarks => prevBookmarks.filter(bm => bm.mangaId !== mangaId));
        setIsProcessing(false);
        return false;
      } else {
        console.log(`Adding bookmark for ${mangaId}`);
        const bookmark = await addBookmark(mangaId, title, cover);
        
        if (bookmark) {
          // Update local state to keep UI in sync
          setBookmarks(prevBookmarks => {
            // Check if bookmark already exists to prevent duplicates
            const exists = prevBookmarks.some(bm => bm.mangaId === mangaId);
            if (exists) {
              console.log(`Bookmark for ${mangaId} already exists in state, not adding duplicate`);
              return prevBookmarks;
            }
            console.log(`Adding ${mangaId} to local bookmark state`);
            return [bookmark, ...prevBookmarks];
          });
        }
        
        setIsProcessing(false);
        return true;
      }
    } catch (error) {
      setIsProcessing(false);
      console.error('Error toggling bookmark:', error);
      throw error;
    }
  };

  const value = {
    bookmarks,
    isLoading,
    addToBookmarks,
    removeFromBookmarks,
    updateBookmarkChapter,
    isBookmarked,
    refreshBookmarks,
    getLastReadChapter,
    toggleBookmark
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
};

export default BookmarkContext;