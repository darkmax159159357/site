'use client';

import { useState, forwardRef, useEffect, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ReadingHistory, PLACEHOLDER_COVER } from '@/lib/firebaseBookmarks';
import toast from 'react-hot-toast';

interface SaveHistoryButtonProps {
  mangaId?: string;
  title?: string;
  cover?: string;
  chapterNumber?: number;
  percentage?: number;
  onClick?: () => void;  // Add onClick prop to interface
}

/**
 * Client component that directly saves reading history to Firebase
 * This bypasses the API route issues with authentication
 */
const SaveHistoryButton = forwardRef<HTMLButtonElement, SaveHistoryButtonProps>(({ 
  mangaId = '', 
  title = '', 
  cover = '', 
  chapterNumber = 0,
  percentage = 100,
  onClick
}, ref) => {
  const [isSaving, setIsSaving] = useState(false);
  // Track the normalized cover URL
  const [normalizedCover, setNormalizedCover] = useState<string>(cover);
  // Use a ref to track the last save time to prevent frequent redundant saves
  const lastSaveTime = useRef<number>(0);
  
  // Effect to normalize the cover URL when it changes
  useEffect(() => {
    // If cover starts with /manga/, ensure it's a complete URL
    if (cover && cover.startsWith('/manga/')) {
      // This is a valid manga cover path, use it directly
      setNormalizedCover(cover);
    } else if (cover && !cover.includes('placeholder')) {
      // This is some other path, but not a placeholder
      setNormalizedCover(cover);
    } else {
      // This is a placeholder or empty string
      setNormalizedCover(PLACEHOLDER_COVER);
    }
  }, [cover]);

  const saveHistory = async () => {
    // Prevent multiple saves within 3 seconds
    const now = Date.now();
    if (now - lastSaveTime.current < 3000) {
      return; // Skip if saved recently
    }
    
    // Prevent saving if already in progress
    if (isSaving) {
      return;
    }
    
    setIsSaving(true);
    lastSaveTime.current = now;
    
    try {
      const user = auth.currentUser;
      
      if (!user) {
        // Only show error in development
        if (process.env.NODE_ENV !== 'production') {
          toast.error('Sign in to save reading progress');
        }
        return;
      }
      
      // First update the user document to ensure it exists
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        lastHistorySave: new Date().toISOString()
      }, { merge: true });
      
      // Create history entry
      const historyId = `${user.uid}_${mangaId}`;
      const historyData: ReadingHistory = {
        id: historyId,
        userId: user.uid,
        mangaId,
        title,
        cover: normalizedCover, // Use the normalized cover
        lastChapter: chapterNumber,
        percentage,
        lastRead: new Date().toISOString()
      };
      
      // Save directly to Firestore
      try {
        const historyRef = doc(db, `users/${user.uid}/reading_history`, historyId);
        await setDoc(historyRef, historyData);
        
        // Also update the bookmark if it exists
        const bookmarkId = `${user.uid}_${mangaId}`;
        const bookmarkRef = doc(db, `users/${user.uid}/bookmarks`, bookmarkId);
        const bookmarkDoc = await getDoc(bookmarkRef);
        
        if (bookmarkDoc.exists()) {
          await setDoc(bookmarkRef, {
            lastChapter: chapterNumber,
            lastRead: new Date().toISOString(),
            cover: normalizedCover // Update the cover in bookmark too
          }, { merge: true });
        }
      } catch (writeError: any) {
        // Only show error in development
        if (process.env.NODE_ENV !== 'production') {
          toast.error(`Failed to save reading progress`);
        }
      }
    } catch (error: any) {
      // Only show error in development
      if (process.env.NODE_ENV !== 'production') {
        toast.error('Failed to save reading progress');
      }
    } finally {
      setIsSaving(false);
      
      // Call the onClick prop if provided (after saving)
      if (onClick && typeof onClick === 'function') {
        onClick();
      }
    }
  };

  return (
    <button
      ref={ref}
      onClick={saveHistory}
      disabled={isSaving}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
    >
      {isSaving ? 'Saving...' : 'Save Progress'}
    </button>
  );
});

SaveHistoryButton.displayName = 'SaveHistoryButton';

export default SaveHistoryButton; 