import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/20/solid';

interface ChapterLockIconProps {
  chapter: any;
  mangaId?: string;
  onPurchaseStatusChange?: (isPurchased: boolean) => void;
}

const ChapterLockIcon = ({ 
  chapter, 
  mangaId: propMangaId,
  onPurchaseStatusChange 
}: ChapterLockIconProps) => {
  // FIXED: Force check for purchased status in case it's not being properly passed
  const { userData, user } = useAuth();
  const [forcePurchased, setForcePurchased] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!user?.uid) return;
      
      try {
        // Get the chapter ID - try multiple ways to get the manga ID
        const mangaId = propMangaId || chapter.mangaId || (chapter.id && chapter.id.split('-ch')[0]);
        
        if (!mangaId) {
          return;
        }
        
        const chapterId = `${mangaId}-ch${chapter.number}`;
        
        // Check directly from Firebase
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const directUserData = userDocSnap.data();
          
          if (directUserData.purchasedChapters && 
              Array.isArray(directUserData.purchasedChapters)) {
            
            const isPurchased = directUserData.purchasedChapters.includes(chapterId);
            
            if (isPurchased) {
              setForcePurchased(true);
              
              // Check if this chapter has an unlock time
              if (chapter.unlockTime) {
                const unlockTime = chapter.unlockTime instanceof Date 
                  ? chapter.unlockTime 
                  : new Date(chapter.unlockTime);
                
                // Only show the unlock icon if we're before the unlock time
                const now = new Date();
                setShowUnlock(now < unlockTime);
              } else {
                // Also check Firebase for the unlock time
                try {
                  const lockedChapterRef = doc(db, "locked_chapters", chapterId);
                  const lockDocSnap = await getDoc(lockedChapterRef);
                  
                  if (lockDocSnap.exists()) {
                    const lockData = lockDocSnap.data();
                    
                    if (lockData.unlocksAt) {
                      const unlockTime = lockData.unlocksAt instanceof Date
                        ? lockData.unlocksAt
                        : typeof lockData.unlocksAt.toDate === 'function'
                          ? lockData.unlocksAt.toDate()
                          : new Date(lockData.unlocksAt);
                      
                      const now = new Date();
                      setShowUnlock(now < unlockTime);
                    } else {
                      // If no unlock time is specified, show the unlock icon for purchased chapters
                      setShowUnlock(true);
                    }
                  } else {
                    // No lock data, just show the unlock icon
                    setShowUnlock(true);
                  }
                } catch (error) {
                  setShowUnlock(true); // Default to showing on error
                }
              }
              
              // Notify parent component about the purchase status
              if (onPurchaseStatusChange) {
                onPurchaseStatusChange(true);
              }
              
              // Also update the chapter object directly if possible
              if (chapter && typeof chapter === 'object') {
                chapter.isPurchased = true;
              }
            }
          }
        }
      } catch (error) {
        // Error handling
      }
    };
    
    checkPurchaseStatus();
  }, [chapter, user, propMangaId, onPurchaseStatusChange]);
  
  // Check both the passed isPurchased prop and our forced check
  if ((chapter.isPurchased || forcePurchased) && showUnlock) {
    return <LockOpenIcon className="h-4 w-4 text-green-500" />;
  }
  
  // Otherwise, show the regular lock icon in amber
  return <LockClosedIcon className="h-4 w-4 text-amber-500" />;
};

export default ChapterLockIcon; 