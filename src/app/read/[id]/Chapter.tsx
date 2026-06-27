"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import "./style.css";
import Disqus from "@/components/Disqus";
import Navbar from "@/components/Navbar";
import { useRouter } from "@/lib/router-events";
import NavLink from "@/components/navlink/NavLink";
import { chapterType } from "./chapterType";
import ReaderInterface from "@/components/ReaderInterface";
import disqusConfig from "@/lib/disqus-config";
import ChapterDisqus from "@/components/ChapterDisqus";
import { useTrackChapterView } from "@/app/hooks/useViewTracker";
import MangaImage from "@/components/MangaImage";
import MangaReaderImage from "@/components/MangaReaderImage";
import { useReadingHistory } from "@/contexts/ReadingHistoryContext";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import SaveHistoryButton from "./SaveHistoryButton";
import { PLACEHOLDER_COVER } from "@/lib/firebaseBookmarks";
import LockedChapter from "./LockedChapter";
import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSecuritySettings } from "@/contexts/SecurityContext";
import { AfterContent1, AfterContent2 } from '@/components/ads/AdPositions';

// Add a debounce utility at the top of the file
const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
};

// Fix at the top of the component, add the window property declaration
declare global {
  interface Window {
    scrollTrackTimeout: ReturnType<typeof setTimeout> | null;
    __updateHistoryAndDebug?: () => void;
    lastSaveTimestamp?: number; // Track the last save timestamp
  }
}

// Add this function to the top level of the file, outside the component
const preloadImages = (urls: string[]) => {
  // Preload the first few images immediately
  urls.slice(0, 15).forEach((url, index) => {
    if (typeof window !== 'undefined') {
      const img = new Image();
      img.fetchPriority = index < 5 ? "high" : "low";
      img.src = url;
    }
  });
};

const Chapter = ({ dataRead, id }: { dataRead: chapterType; id: string }) => {
  const router = useRouter();
  const [selectedChapter, setSelectedChapter] = useState<string>(id);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});
  const [nextChapterPreloaded, setNextChapterPreloaded] = useState(false);
  const [isChapterLocked, setIsChapterLocked] = useState(false);
  const [unlockTime, setUnlockTime] = useState<string | null>(null);
  const [isCheckingLock, setIsCheckingLock] = useState(true);
  
  // Access reading history context and auth context
  const { updateHistory } = useReadingHistory();
  const { user, userData, refreshUserData } = useAuth();
  const { securitySettings } = useSecuritySettings();

  // Timestamp to track when last history update happened
  const lastHistoryUpdate = useRef<number>(0);
  // Flag to track if initial history update has been done
  const initialHistoryUpdateDone = useRef<boolean>(false);

  // Extract manga ID and chapter number from the chapter ID
  const mangaId = id.split('-ch')[0];
  const chapterNumber = parseInt(id.split('-ch')[1], 10);
  
  // Implementation of chapter image protection
  useEffect(() => {
    if (securitySettings.chapterProtection) {
      // Disable all image downloads
      const preventImageDownload = () => {
        // Add classes to all manga images
        setTimeout(() => {
          const images = document.querySelectorAll('.manga-reader-image');
          images.forEach((img) => {
            if (img instanceof HTMLImageElement) {
              img.classList.add('protected-image');
              img.setAttribute('draggable', 'false');
              img.oncontextmenu = (e) => {
                e.preventDefault();
                return false;
              };
            }
          });
        }, 500);
      };

      // Add protection CSS
      const addProtectionStyles = () => {
        const style = document.createElement('style');
        style.innerHTML = `
          .protected-image {
            -webkit-user-drag: none;
            -webkit-touch-callout: none;
            user-select: none;
            pointer-events: none;
          }
          
          .image-container {
            position: relative;
          }
          
          .image-container::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }

          @media print { 
            body { display: none; } 
          }
        `;
        document.head.appendChild(style);
      };
      
      // Apply protections
      preventImageDownload();
      addProtectionStyles();
      
      // Monitor for new images
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            preventImageDownload();
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      return () => {
        observer.disconnect();
      };
    }
  }, [securitySettings.chapterProtection]);

  // Check if chapter is locked - COMPLETELY REWRITTEN
  useEffect(() => {
    const checkIfChapterIsLocked = async () => {
      try {
        setIsCheckingLock(true);
        
        // Add clear debug logs
        console.log("CHAPTER LOCK CHECK - Starting check:", {
          id, 
          mangaId,
          chapterNumber
        });
        
        // 1. CHECK IF USER HAS PURCHASED THIS CHAPTER
        // This takes priority - if purchased, allow access regardless of lock status
        
        if (user) {
          try {
            console.log(`CHAPTER LOCK CHECK - User ${user.uid} is signed in, checking purchases...`);
            
            // Get user data directly from Firebase
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              
              console.log("CHAPTER LOCK CHECK - User data:", userData);
              
              if (userData.purchasedChapters && Array.isArray(userData.purchasedChapters)) {
                              // Use only the standardized format for lookup
              const standardId = `${mangaId}-ch${chapterNumber}`;
              const possibleChapterIds = [
                standardId, // Standard format
                id // Original format as fallback
              ];
                
                console.log("CHAPTER LOCK CHECK - Checking these possible IDs:", possibleChapterIds);
                console.log("CHAPTER LOCK CHECK - User purchased chapters:", userData.purchasedChapters);
                
                // Check if any of the possible IDs match a purchased chapter
                let isPurchased = false;
                for (const possibleId of possibleChapterIds) {
                  if (userData.purchasedChapters.includes(possibleId)) {
                    console.log(`CHAPTER LOCK CHECK - Found exact match for ID: ${possibleId}`);
                    isPurchased = true;
                    break;
                  }
                }
                
                              // Do NOT do fuzzy matching - we only want exact matches now
              // This is commented out to respect the user's request for only exact matches
              /*
              if (!isPurchased) {
                for (const purchasedChapter of userData.purchasedChapters) {
                  // Check if the purchased chapter contains both the manga ID and chapter number
                  if (
                    (purchasedChapter.includes(mangaId) || mangaId.includes(purchasedChapter)) && 
                    (purchasedChapter.includes(`ch${chapterNumber}`) || purchasedChapter.includes(`-${chapterNumber}`))
                  ) {
                    console.log(`CHAPTER LOCK CHECK - Found fuzzy match: ${purchasedChapter}`);
                    isPurchased = true;
                    break;
                  }
                }
              }
              */
                
                // If purchased, unlock immediately regardless of other lock status
                if (isPurchased) {
                  console.log("CHAPTER LOCK CHECK - Chapter is purchased, unlocking it");
                  setIsChapterLocked(false);
                  setIsCheckingLock(false);
                  return; // Exit early, no need to check lock status
                } else {
                  console.log("CHAPTER LOCK CHECK - Chapter not found in user's purchased chapters");
                }
              }
            }
          } catch (error) {
            console.error("CHAPTER LOCK CHECK - Error checking user purchase status:", error);
            // Continue with lock check even if purchase check fails
          }
        } else {
          console.log("CHAPTER LOCK CHECK - No user logged in, skipping purchase check");
        }
        
        // 2. CHECK IF CHAPTER IS LOCKED IN FIREBASE
        // This is the primary source of truth for lock status
        
        let isLocked = false;
        let chapterUnlockTime = null;
        let chapterCoinAmount = 50; // Default coin amount
        
        try {
          // Instead of looking for the exact document ID, query by mangaId and chapterNumber
          // Import what we need at the top of the file
          const lockedChaptersRef = collection(db, "locked_chapters");
          const q = query(
            lockedChaptersRef, 
            where("mangaId", "==", mangaId),
            where("chapterNumber", "==", chapterNumber)
          );
          
          console.log("CHAPTER LOCK CHECK - Querying by mangaId and chapterNumber:", {
            mangaId,
            chapterNumber
          });
          
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            // Take the first matching document
            const lockData = querySnapshot.docs[0].data();
            console.log("CHAPTER LOCK CHECK - Found locked chapter data:", lockData);
            
            // If the document exists in locked_chapters collection, it's likely locked
            isLocked = lockData.isLocked !== false; // Default to locked if found in this collection
            
            // Get coin amount required to unlock
            chapterCoinAmount = lockData.coinAmount || chapterCoinAmount;
            
            // Handle timestamp format for unlocksAt date
            if (lockData.unlocksAt) {
              if (typeof lockData.unlocksAt.toDate === 'function') {
                // Firebase Timestamp object
                chapterUnlockTime = lockData.unlocksAt.toDate().toISOString();
              } else {
                // String or Date format
                chapterUnlockTime = new Date(lockData.unlocksAt).toISOString();
              }
              
              // Check if the unlock time is in the future
              const unlockTimeDate = new Date(chapterUnlockTime);
              const now = new Date();
              
              if (unlockTimeDate > now) {
                // If unlock time is in the future, the chapter should be locked
                isLocked = true;
                console.log(`CHAPTER LOCK CHECK - Future unlock time (${unlockTimeDate}), chapter should be locked`);
              } else {
                // If time has passed, chapter should be unlocked
                isLocked = false;
                console.log(`CHAPTER LOCK CHECK - Unlock time passed (${unlockTimeDate}), chapter should be unlocked`);
              }
            }
          } else {
            // If no matching documents, try the old way with direct document IDs
            console.log("CHAPTER LOCK CHECK - No matching documents by query, trying direct document lookup");
            
            // Try with the exact chapter ID first
            const lockDocRef = doc(db, "locked_chapters", id);
            let lockDocSnap = await getDoc(lockDocRef);
            
            // If not found, try with standard format
            if (!lockDocSnap.exists()) {
              const standardId = `${mangaId}-ch${chapterNumber}`;
              console.log(`CHAPTER LOCK CHECK - Document not found with ID ${id}, trying with ${standardId}`);
              const altLockDocRef = doc(db, "locked_chapters", standardId);
              lockDocSnap = await getDoc(altLockDocRef);
            }
            
            console.log("CHAPTER LOCK CHECK - Firebase data:", {
              exists: lockDocSnap.exists(),
              data: lockDocSnap.exists() ? lockDocSnap.data() : null
            });
            
            if (lockDocSnap.exists()) {
              const lockData = lockDocSnap.data();
              
              // If the document exists in locked_chapters collection, it's likely locked
              isLocked = lockData.isLocked !== false; // Default to locked if found in this collection
              
              // Get coin amount required to unlock
              chapterCoinAmount = lockData.coinAmount || chapterCoinAmount;
              
              // Handle timestamp format for unlocksAt date
              if (lockData.unlocksAt) {
                if (typeof lockData.unlocksAt.toDate === 'function') {
                  // Firebase Timestamp object
                  chapterUnlockTime = lockData.unlocksAt.toDate().toISOString();
                } else {
                  // String or Date format
                  chapterUnlockTime = new Date(lockData.unlocksAt).toISOString();
                }
                
                // Check if the unlock time is in the future
                const unlockTimeDate = new Date(chapterUnlockTime);
                const now = new Date();
                
                if (unlockTimeDate > now) {
                  // If unlock time is in the future, the chapter should be locked
                  isLocked = true;
                  console.log(`CHAPTER LOCK CHECK - Future unlock time (${unlockTimeDate}), chapter should be locked`);
                } else {
                  // If time has passed, chapter should be unlocked
                  isLocked = false;
                  console.log(`CHAPTER LOCK CHECK - Unlock time passed (${unlockTimeDate}), chapter should be unlocked`);
                }
              }
            } else {
              // If the chapter is not in the locked_chapters collection, it's not locked
              console.log("CHAPTER LOCK CHECK - Chapter not found in locked_chapters collection, it's unlocked");
              isLocked = false;
            }
          }
        } catch (error) {
          console.error("CHAPTER LOCK CHECK - Error checking Firebase lock status:", error);
          // Default to unlocked in case of errors
          isLocked = false;
        }
        
        console.log("CHAPTER LOCK CHECK - Final decision:", { 
          isLocked, 
          unlockTime: chapterUnlockTime,
          coinAmount: chapterCoinAmount
        });
        
        // Update component state with lock status
        setIsChapterLocked(isLocked);
        
        if (chapterUnlockTime) {
          setUnlockTime(chapterUnlockTime);
        }
          
        // Set the coin amount in dataRead for the purchase UI
        if (dataRead && isLocked && chapterCoinAmount) {
            dataRead.coinAmount = chapterCoinAmount;
        }
      } catch (error) {
        console.error("CHAPTER LOCK CHECK - Unexpected error:", error);
        // Default to unlocked in case of any errors
        setIsChapterLocked(false);
      } finally {
        setIsCheckingLock(false);
      }
    };
    
    // Call the check function
    checkIfChapterIsLocked();
  }, [dataRead, id, user, mangaId, chapterNumber]);
  
  // Handle purchasing the chapter
  const handlePurchaseChapter = async (): Promise<boolean> => {
    if (!user) {
      router.push("/auth");
      return false;
    }
    
    try {
      // Get current user data
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      
      if (!userData) {
        toast.error("User data not found");
        return false;
      }
      
      // Get coin amount required (default to 50 if not specified)
      const requiredCoins = dataRead?.coinAmount || 50;
      
      // Check if user has enough coins
      const userCoins = userData.coins || 0;
      
      if (userCoins < requiredCoins) {
        toast.error(`Not enough coins to unlock this chapter. Need ${requiredCoins} coins, you have ${userCoins}.`);
        return false;
      }
      
      // Use only the standardized format for the chapter ID
      const standardId = `${mangaId}-ch${chapterNumber}`;
      console.log(`Purchasing chapter with standardized ID: ${standardId}`);
      
      // Update user's coins and purchased chapters - only save one format
      await updateDoc(userDocRef, {
        coins: userCoins - requiredCoins,
        purchasedChapters: arrayUnion(standardId) // Only use the standardized format
      });
      
      toast.success(`Chapter unlocked successfully! Used ${requiredCoins} coins.`);
      
      // Immediately unlock the chapter in the UI
      setIsChapterLocked(false);
      
      // Force refresh user data
      if (refreshUserData) {
        await refreshUserData();
      }
      
      return true;
    } catch (error) {
      console.error("Error purchasing chapter:", error);
      toast.error("Failed to unlock chapter");
      return false;
    }
  };
  
  // Track chapter view
  useTrackChapterView({
    mangaId: mangaId,
    mangaTitle: dataRead?.title || '',
    coverImage: dataRead?.cover || PLACEHOLDER_COVER,
    chapterId: id,
    chapterTitle: dataRead?.chapterTitle || `Chapter ${chapterNumber}`
  });

  // Debugging: Log the dataRead to confirm it's being passed correctly
  useEffect(() => {
    console.log("Chapter component - dataRead:", dataRead);
    console.log("Chapter component - id:", id);
    console.log("Chapter component - cover path:", dataRead?.cover);
    console.log("Chapter component - mangaCover path:", dataRead?.mangaCover);
  }, [dataRead, id]);

  // Set the selected chapter on component mount
  useEffect(() => {
    const savedChapter = localStorage.getItem("daftarChapter");
    if (savedChapter) {
      setSelectedChapter(savedChapter);
    }
  }, []);

  // Handle keyboard navigation
  const handleNavigation = useCallback(
    (direction: "next" | "prev") => {
      const link =
        direction === "next"
          ? dataRead?.has_next?.has_next_link
          : dataRead?.has_prev?.has_prev_link;

      if (link) {
        // Extract the new chapter ID from the link
        const newChapterId = link.split('/').pop();
        if (newChapterId) {
          console.log(`Navigation: ${direction} to chapter ${newChapterId}`);
          
          // Update the selected chapter state and localStorage before navigation
          setSelectedChapter(newChapterId);
          localStorage.setItem("daftarChapter", newChapterId);
          
          // Navigate to the new chapter - use replace to ensure full refresh
          router.replace(link);
        } else {
          router.push(link);
        }
      }
    },
    [dataRead, router]
  );

  // Near the top where state variables are defined, add a ref for the save history button
  const saveHistoryBtnRef = useRef<HTMLButtonElement>(null);
  const saveInProgress = useRef<boolean>(false); // Add this to prevent duplicate saves

  // Move the trackReadingProgress function here, before it's used in the useEffect
  const trackReadingProgress = useCallback(() => {
    if (!dataRead || !dataRead.title || !user) {
      return;
    }
    
    // Prevent duplicate saves within 3 seconds
    const now = Date.now();
    if (window.lastSaveTimestamp && (now - window.lastSaveTimestamp) < 3000) {
      return;
    }
    
    // Set timestamp to prevent multiple close saves
    window.lastSaveTimestamp = now;

    // Skip if a save is already in progress
    if (saveInProgress.current) {
      return;
    }
    
    saveInProgress.current = true;
    
    try {
      const coverPath = dataRead.mangaCover || dataRead.cover || '';
      
      // Try the context method first
      if (updateHistory) {
        updateHistory(
          mangaId,
          dataRead.title,
          coverPath,
          chapterNumber,
          currentProgress
        )
        .then(() => {
          saveInProgress.current = false;
        })
        .catch(error => {
          // If context method fails, try direct button click
          if (saveHistoryBtnRef.current) {
            saveHistoryBtnRef.current.click();
          }
          saveInProgress.current = false;
        });
      } else {
        // If updateHistory function isn't available, use direct button
        if (saveHistoryBtnRef.current) {
          saveHistoryBtnRef.current.click();
        }
        saveInProgress.current = false;
      }
    } catch (error) {
      // Attempt direct save as fallback
      if (saveHistoryBtnRef.current) {
        saveHistoryBtnRef.current.click();
      }
      saveInProgress.current = false;
    }
  }, [dataRead, mangaId, chapterNumber, currentProgress, user, updateHistory]);

  // Create a debounced version of the tracking function
  const debouncedTrackProgress = useCallback(
    debounce((progress: number) => {
      if (progress >= 25 && user && dataRead) {
        trackReadingProgress();
      }
    }, 1000), // 1 second debounce
    [trackReadingProgress, user, dataRead]
  );

  // Update the scroll effect to trigger reading history tracking with less frequency
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const totalHeight = scrollHeight - clientHeight;
      const progress = Math.round((scrollTop / totalHeight) * 100);
      
      setCurrentProgress(progress);
      
      // Only track at significant milestones with debounce
      if (progress >= 25 && (progress % 25 === 0 || progress > 90)) {
        debouncedTrackProgress(progress);
      }
    };
    
    // Use passive event listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [debouncedTrackProgress]);

  // Update this effect to use direct save methods with less frequency
  useEffect(() => {
    // Only update history at significant progress points
    const shouldUpdateHistory = 
      user && 
      dataRead?.title && 
      dataRead?.cover && 
      (currentProgress === 25 || 
       currentProgress === 50 || 
       currentProgress === 75 || 
       currentProgress === 90 || 
       currentProgress === 100);

    if (shouldUpdateHistory && !saveInProgress.current) {
      debouncedTrackProgress(currentProgress);
    }
  }, [currentProgress, debouncedTrackProgress]);

  // Handle chapter selection from dropdown
  const handleChapterChange = (newChapterId: string) => {
    setSelectedChapter(newChapterId);
    localStorage.setItem("daftarChapter", newChapterId);
    router.push(`/read/${newChapterId}`);
  };

  // Update the "on unmount" useEffect to avoid duplicate saves
  useEffect(() => {
    return () => {
      if (!user || !dataRead?.title || saveInProgress.current) {
        return;
      }

      if ((dataRead?.cover || dataRead?.mangaCover) && currentProgress > 90) {
        const coverPath = dataRead.mangaCover || dataRead.cover || '';
        
        // Just use a single save method on unmount to avoid duplicates
        updateHistory(
          mangaId, 
          dataRead.title, 
          coverPath,
          chapterNumber,
          100
        ).catch(() => {
          // Silent fallback - user is leaving the page anyway
        });
      }
    };
  }, [mangaId, dataRead, chapterNumber, currentProgress, user, updateHistory]);

  // Preload next chapter when user reaches 75% of current chapter
  useEffect(() => {
    if (currentProgress >= 75 && !nextChapterPreloaded && dataRead?.has_next?.has_next_link) {
      const nextChapterId = dataRead.has_next.has_next_link?.split('/').pop();
      if (nextChapterId) {
        // Create a hidden image element to preload the first image of next chapter
        const preloadNextChapter = async () => {
          try {
            const res = await fetch(`/api/preload-chapter?id=${nextChapterId}`);
            if (res.ok) {
              setNextChapterPreloaded(true);
              console.log("Preloaded next chapter");
            }
          } catch (error) {
            console.error("Failed to preload next chapter", error);
          }
        };
        
        preloadNextChapter();
      }
    }
  }, [currentProgress, dataRead?.has_next?.has_next_link, nextChapterPreloaded]);

  // Track when each image is loaded
  const handleImageLoad = (index: number) => {
    setImagesLoaded(prev => ({...prev, [index]: true}));
  };

  // Add a useEffect to manually call trackReadingProgress when the component mounts - only once
  useEffect(() => {
    let initialTimerID: NodeJS.Timeout;
    
    if (!window.lastSaveTimestamp) {
      initialTimerID = setTimeout(() => {
        if (user && dataRead) {
          trackReadingProgress();
        }
      }, 3000); // Wait 3 seconds after mounting
    }
    
    return () => {
      if (initialTimerID) {
        clearTimeout(initialTimerID);
      }
    };
  }, [user, dataRead, trackReadingProgress]);

  // Add a manual save button near the end of the component
  const manualSave = () => {
    console.log("Manual save button clicked");
    
    // Use our debug-enabled save function if available
    if ((window as any).__updateHistoryAndDebug) {
      console.log("Using debug-enabled save function");
      (window as any).__updateHistoryAndDebug();
      return;
    }
    
    // Fallback to direct button click
    if (saveHistoryBtnRef.current) {
      console.log("Clicking save history button directly");
      saveHistoryBtnRef.current.click();
    } else {
      console.log("Save history button ref is not available");
      // Try the context method as backup
      if (updateHistory && user && dataRead?.title) {
        const coverPath = dataRead.mangaCover || dataRead.cover || '';
        console.log("Manual save using cover path:", coverPath);
        
        updateHistory(
          mangaId,
          dataRead.title,
          coverPath,
          chapterNumber,
          currentProgress
        ).then(() => {
          console.log("Reading progress saved silently");
        }).catch(error => {
          console.error("Error saving reading progress:", error);
          toast.error("Failed to save reading progress");
        });
      } else {
        console.error("Cannot save reading history - missing required data");
        toast.error("Cannot save reading progress");
      }
    }
  };

  // Preload images immediately when component mounts
  useEffect(() => {
    if (dataRead?.pages?.length) {
      // Preload images as soon as we have the data
      preloadImages(dataRead.pages);
    }
  }, [dataRead?.pages]);

  // Return early if still checking lock status
  if (isCheckingLock) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1B1E]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#FF7F57] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white mt-4"></p>
        </div>
      </div>
    );
  }

  // Log final lock status
  console.log("CHAPTER RENDER - Lock status:", {
    isChapterLocked,
    unlockTime,
    user: user?.uid || 'not logged in'
  });

  // Render locked chapter UI if the chapter is locked
  if (isChapterLocked) {
    console.log("SHOWING LOCKED CHAPTER UI", {
      user: user ? user.uid : 'not logged in',
      chapterNumber,
      mangaId
    });
    
    // Use the unlockTime if available, or a default future time
    const displayUnlockTime = unlockTime || "2025-06-05T07:31:14.694Z";
    
    return (
      <LockedChapter 
        chapterNumber={chapterNumber}
        title={dataRead?.title || ""}
        mangaId={mangaId}
        mangaTitle={dataRead?.title || ""}
        unlockTime={displayUnlockTime}
        id={id}
        onPurchase={handlePurchaseChapter}
        coinAmount={dataRead?.coinAmount || 50}
      />
    );
  }

  // Log that we're showing normal chapter UI
  console.log("SHOWING NORMAL CHAPTER UI", {
    user: user ? user.uid : 'not logged in',
    chapterNumber,
    mangaId
  });

  // Render normal chapter UI
  return (
    <>
      <ReaderInterface
        title={dataRead?.title || ""}
        chapterTitle={dataRead?.chapterTitle || `Chapter ${chapterNumber}`}
        currentProgress={currentProgress}
        onPrevious={() => handleNavigation("prev")}
        onNext={() => handleNavigation("next")}
        prevChapter={dataRead?.has_prev?.has_prev_link ? dataRead?.has_prev?.has_prev_link.split('/').pop() || null : null}
        nextChapter={dataRead?.has_next?.has_next_link ? dataRead?.has_next?.has_next_link.split('/').pop() || null : null}
        discordLink="https://discord.gg/3vx2C5jFd6"
        kofiLink="https://ko-fi.com/medusascans"
        chapterId={id}
        mangaId={mangaId}
        chapters={dataRead?.chapters?.map(ch => ({
          id: `${mangaId}-ch${ch.number}`,
          number: ch.number,
          title: ch.title || `Chapter ${ch.number}`
        })) || []}
        onChapterChange={handleChapterChange}
      >
        <div className="w-[95%] sm:w-[90%] m-auto mt-6" ref={contentRef}>
          {/* Ad slot before chapter content */}
          <div className="mb-6 w-full sm:w-[70%] m-auto">
            <AfterContent1 />
          </div>
          
          {/* Manga Pages */}
          <div className="mb-10 w-full sm:w-[70%] m-auto">
            <div className="flex justify-center">
              <div className="read grid justify-center mt-5">
                {dataRead?.pages?.length ? (
                  dataRead.pages.map((imageSrc: string, index: number) => (
                    <div key={index} style={{marginBottom: 0}} className="manga-page-container image-container">
                        <MangaImage
                          src={imageSrc}
                          alt={`Page ${index + 1}`}
                          index={index}
                          priority={index < 3}
                          onLoad={() => handleImageLoad(index)}
                        />
                    </div>
                  ))
                ) : (
                  <div className="text-white text-center mt-5 p-8 bg-black rounded-xl">
                    <p className="text-lg">Pages not found or under maintenance.</p>
                    <p className="text-sm text-gray-400 mt-2">Please try again later or contact support.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Ad slot after chapter content */}
          <div className="mt-6 mb-6 w-full sm:w-[70%] m-auto">
            <AfterContent2 />
          </div>
          
          {/* Add this hidden component for direct saving - keep this but make it hidden */}
          <div className="hidden">
            <SaveHistoryButton
              ref={saveHistoryBtnRef}
              mangaId={mangaId}
              title={dataRead?.title || ''}
              cover={dataRead?.mangaCover || dataRead?.cover || ''}
              chapterNumber={chapterNumber}
              percentage={currentProgress}
            />
          </div>
        </div>
      </ReaderInterface>
      
      {/* Comments Section - Outside ReaderInterface */}
      <div className="bg-black w-full py-8">
        <div className="w-[95%] sm:w-[90%] max-w-6xl mx-auto">
          <ChapterDisqus chapterId={id} mangaId={mangaId} chapterTitle={dataRead?.chapterTitle || `Chapter ${chapterNumber}`} dataRead={dataRead} />
        </div>
      </div>

      <div className="bg-black w-full pb-20 pt-4">
        {/* Intentionally empty for padding */}
      </div>
    </>
  );
};

export default Chapter;