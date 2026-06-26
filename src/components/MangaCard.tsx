import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/20/solid';
import ChapterLockIcon from "./ChapterLockIcon";

// Function to check for special tags based on genres
const getSpecialTag = (genres: string[] = []) => {
  if (!genres.length) return null;
  
  const normalizedGenres = genres.map(genre => genre.toLowerCase());
  
  if (normalizedGenres.includes('r-19')) {
    return {
      text: "R-19",
      color: "bg-red-500/80"
    };
  } else if (normalizedGenres.includes('pornhwa')) {
    return {
      text: "Pornhwa",
      color: "bg-pink-500/80"
    };
  }
  return null;
};

type MangaCardProps = {
  id: string;
  title: string;
  cover: string;
  rating: number;
  status: "ONGOING" | "COMPLETED" | "RELEASED";
  chapter: string;
  country: "jp" | "kr" | "cn" | string;
  slug: string;
  chapters?: Array<{
    number: number;
    title?: string;
    pages?: string[];
    date?: string;
    added_chap_date?: string;
    added_date?: string;
    release_date?: string;
    isLocked?: boolean;
    unlockTime?: string | Date;
    coinAmount?: number;
    [key: string]: any;
  }>;
  genres?: string[];
  has_chapters?: boolean;
  isFeature?: boolean;
};

// Function to get country display name
const getCountryName = (code: string) => {
  switch(code.toLowerCase()) {
    case 'jp': return 'MANGA';
    case 'kr': return 'MANHWA';
    case 'cn': return 'MANHUA';
    default: return 'MANGA';
  }
};

// Function to get relative time
const getRelativeTime = (chapter: any) => {
  try {
    if (!chapter || typeof chapter !== 'object') {
      return 'Recently added';
    }

    // Get the added_chap_date field
    const dateString = chapter.added_chap_date;
    if (!dateString) {
        return 'Recently added';
      }
      
    // Parse the date - format is "09-06-2025 10:00 pm"
    // Let's handle this format specifically
    const dateParts = dateString.split(' ');
    if (dateParts.length < 2) {
      return dateString; // Return the raw string if we can't parse it
    }

    // Parse date part: "09-06-2025"
    const dateComponents = dateParts[0].split('-');
    if (dateComponents.length !== 3) {
      return dateString;
    }

    const day = parseInt(dateComponents[0]);
    const month = parseInt(dateComponents[1]) - 1; // Months are 0-indexed
    const year = parseInt(dateComponents[2]);

    // Parse time part: "10:00"
    const timeParts = dateParts[1].split(':');
    if (timeParts.length !== 2) {
      return dateString;
    }
    
    let hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    
    // Adjust for PM
    const isPM = dateParts[2]?.toLowerCase() === 'pm';
    if (isPM && hour < 12) {
      hour += 12;
    }
    
    // Create date object
    const date = new Date(year, month, day, hour, minute);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString;
    }
      
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const absDiffInSeconds = Math.abs(diffInSeconds);
    
    // For both past and future dates, if within 24 hours, show hours and minutes
    if (absDiffInSeconds < 86400) {  // 24 hours in seconds
      const hours = Math.floor(absDiffInSeconds / 3600);
      const minutes = Math.floor((absDiffInSeconds % 3600) / 60);
      
    if (diffInSeconds < 0) {
        // Future date (coming soon)
        if (absDiffInSeconds < 60) {
          return 'Less than a minute';
        } else if (absDiffInSeconds < 3600) {
          return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else {
          // Remove minutes, just show hours
          return `${hours} hour${hours > 1 ? 's' : ''}`;
        }
      }
    }
    
    if (diffInSeconds < 0) {
      // Future date beyond 24 hours, show formatted date
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } else if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      // Remove minutes, just show hours
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      // Calculate days, weeks, and months
      const diffInDays = Math.floor(diffInSeconds / 86400);
      
      // Less than 7 days: show only days
      if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
      }
      
      // Between 7 days and 1 month: show weeks and days
      if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
          return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
      }
      
      // Between 1 month and 3 months: show months and days
      if (diffInDays < 90) {
        const months = Math.floor(diffInDays / 30);
          return `${months} month${months !== 1 ? 's' : ''} ago`;
      }
      
      // Over 3 months: show full date
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
  } catch (error) {
    return 'Recently added';
  }
};

// Function to check if a chapter is new (less than 24 hours old)
const isNewChapter = (chapter: any) => {
  try {
    if (!chapter || typeof chapter !== 'object') {
      return false;
    }

    // Get the added_chap_date field - this is our primary date field
    const dateString = chapter.added_chap_date;
    if (!dateString) {
      return false;
    }

    // Parse the date - format is "09-06-2025 10:00 pm"
    // Let's handle this format specifically
    const dateParts = dateString.split(' ');
    if (dateParts.length < 2) {
      return false;
    }

    // Parse date part: "09-06-2025"
    const dateComponents = dateParts[0].split('-');
    if (dateComponents.length !== 3) {
      return false;
    }
    
    const day = parseInt(dateComponents[0]);
    const month = parseInt(dateComponents[1]) - 1; // Months are 0-indexed
    const year = parseInt(dateComponents[2]);

    // Parse time part: "10:00"
    const timeParts = dateParts[1].split(':');
    if (timeParts.length !== 2) {
      return false;
    }
    
    let hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    
    // Adjust for PM
    const isPM = dateParts[2]?.toLowerCase() === 'pm';
    if (isPM && hour < 12) {
      hour += 12;
    }
    
    // Create date object
    const date = new Date(year, month, day, hour, minute);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return false;
    }
    
    // Check if it's less than 24 hours old
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    return diffInHours < 24;
  } catch (error) {
    return false; // Any error means it's not new
  }
};



const MangaCard = ({
  id,
  title,
  cover,
  rating,
  status,
  chapter,
  country,
  slug,
  chapters = [],
  genres = [],
  has_chapters = false,
  isFeature = false,
}: MangaCardProps) => {
  // State to hold the cache-busting image URL
  const [imageUrl, setImageUrl] = useState(cover);
  const [imageError, setImageError] = useState(false);
  // Add state for tracked chapters
  const [trackedChapters, setTrackedChapters] = useState<any[]>([]);
  // Add state for locked chapter data from Firebase
  const [lockedChaptersData, setLockedChaptersData] = useState<{[key: string]: any}>({}); 
  // Add state for purchase status to force refresh
  const [purchasedStatus, setPurchasedStatus] = useState<{[key: string]: boolean}>({});
  
  // Get user data for checking purchased chapters
  const { userData, user } = useAuth();
  
  // Store checkLockStatus reference for access across effects
  const checkLockStatusRef = React.useRef<() => Promise<void>>();
  
  // Fetch locked chapters data from Firebase
  useEffect(() => {
    const fetchLockedChaptersData = async () => {
      try {
        // Query the locked_chapters collection for this manga
        const lockedChaptersRef = collection(db, "locked_chapters");
        const q = query(lockedChaptersRef, where("mangaId", "==", id));
        const querySnapshot = await getDocs(q);
        
        // Create a map of chapter number to locked chapter data
        const chaptersMap: {[key: string]: any} = {};
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.chapterNumber) {
            chaptersMap[data.chapterNumber.toString()] = data;
          }
        });
        
        setLockedChaptersData(chaptersMap);
      } catch (error) {
        // Error fetching locked chapters
      }
    };
    
    if (id) {
      fetchLockedChaptersData();
    }
  }, [id]);
  
  // Directly check Firebase for the most up-to-date purchased chapters - now at component level
  useEffect(() => {
    // Direct auth check function
    const checkDirectAuth = async () => {
      if (!user || !user.uid) {
        return;
      }
      
      try {
        // Get user data DIRECTLY from Firebase
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const directUserData = userDocSnap.data();
          
          if (directUserData.purchasedChapters && Array.isArray(directUserData.purchasedChapters)) {
            // Store direct status for each chapter
            const directPurchaseStatus: {[key: string]: boolean} = {};
            
            if (chapters && chapters.length > 0) {
              chapters.forEach(chapter => {
                const chapterId = `${id}-ch${chapter.number}`;
                const isPurchased = directUserData.purchasedChapters.includes(chapterId);
                directPurchaseStatus[chapterId] = isPurchased;
                
                // Also mark purchased chapters for both locked and free chapters
                if (isPurchased) {
                  // Try to update the chapter object directly as well
                  if (typeof chapter === 'object') {
                    chapter.isPurchased = true;
                  }
                }
              });
              
              // Set directly in component state
              setPurchasedStatus(directPurchaseStatus);
            }
          }
        }
      } catch (error) {
        // Error fetching user data
      }
    };
    
    // Run the direct auth check
    checkDirectAuth();
  }, [user, id, chapters]);
  


  // Check Firebase for more detailed lock information
  useEffect(() => {
    const checkLockStatus = async () => {
      // Store the function in the ref so it can be called from other effects
      checkLockStatusRef.current = checkLockStatus;
      if (!chapters || chapters.length === 0) return;
      
      try {
        // Get the latest chapters (up to 2)
        const latestChaptersToCheck = [...chapters]
          .sort((a, b) => b.number - a.number)
          .slice(0, 2);
          
        // Create new array to store chapters with updated lock info
        const updatedChapters = [...latestChaptersToCheck];
        
        // Check each chapter in Firebase
        for (let i = 0; i < updatedChapters.length; i++) {
          const chapter = updatedChapters[i];
          const chapterId = `${id}-ch${chapter.number}`;
          
          try {
            // Start with unlocked by default regardless of chapter data
            let isLocked = false;
            // Default to 1 coin if not specified in chapter data
            let coinAmount = chapter.coinAmount || 1;
            let unlockTime = chapter.unlockTime || undefined;
            
            // Check Firebase for more accurate data
            try {
              // Try both possible document IDs
              const lockDocRef = doc(db, "locked_chapters", chapterId);
              let lockDocSnap = await getDoc(lockDocRef);
              
              if (lockDocSnap.exists()) {
                const lockData = lockDocSnap.data();
                // Firebase data takes precedence over JSON data
                isLocked = true; // If it's in the collection, it's locked
                
                // Handle both timestamp and string formats
                if (lockData.unlocksAt) {
                  if (typeof lockData.unlocksAt.toDate === 'function') {
                    unlockTime = lockData.unlocksAt.toDate();
                  } else {
                    unlockTime = new Date(lockData.unlocksAt);
                  }
                }
                
                coinAmount = lockData.coinAmount || coinAmount;
              } else {
                // If no data in Firebase, ensure it's not locked
                isLocked = false;
              }
            } catch (firebaseError) {
              // On error, default to unlocked
              isLocked = false;
            }
            
            // If there's an unlock time, check if it's in the future
            let shouldLock = isLocked;
            
            if (unlockTime) {
              const now = new Date();
              
              // If unlock time is in the future, the chapter should be locked
              if ((unlockTime instanceof Date) && unlockTime > now) {
                shouldLock = true;
              } else {
                // Time has passed, chapter should be unlocked
                shouldLock = false;
              }
            }
            
            // If user is logged in, check if they've purchased the chapter
            let isPurchased = false;
            
            if (shouldLock && userData?.uid && userData.purchasedChapters) {
              // Check if this chapter is in the user's purchased chapters - EXACT CHECK
              if (userData.purchasedChapters.includes(chapterId)) {
                shouldLock = false;
                isPurchased = true;
              }
            }
            
            // Update chapter with combined data
            updatedChapters[i] = {
              ...chapter,
              isLocked: shouldLock,
              unlockTime,
              coinAmount,
              isPurchased // Add isPurchased flag to the chapter data
            };
          } catch (error) {
            // Continue with next chapter
          }
        }
        
        setTrackedChapters(updatedChapters);
      } catch (error) {
        // Error checking lock status
      }
    };
    
    // Run the check lock status function but only when id or chapters change
    // We handle userData changes separately
    checkLockStatus();
  }, [id, chapters]);
  
  // Handle userData changes separately to avoid infinite loops
  useEffect(() => {
    // When userData changes and the checkLockStatus function is available, call it
    if (checkLockStatusRef.current && userData) {
      checkLockStatusRef.current();
    }
  }, [userData]);

  // Add cache-busting parameter to image URL on component mount
  useEffect(() => {
    // Process cover URL to ensure it's correct
    let processedCover = cover;
    
      // Handle fallback image
    if (!processedCover || processedCover === 'undefined') {
      processedCover = '/fallback-image.svg';
    }
    
    // If the path is valid but doesn't start with a slash, add it
    if (processedCover && !processedCover.startsWith('/') && !processedCover.startsWith('http')) {
      processedCover = `/${processedCover}`;
    }
    
    // Use standard path processing for all manga covers
    
    // Set the URL without cache-busting as it can cause issues
    setImageUrl(processedCover);
  }, [cover, id, title]);
  
  // Process all chapters to determine locked/unlocked status
  const processedChapters = chapters.map(chapter => {
    const chapterId = `${id}-ch${chapter.number}`;
    const firebaseChapterData = lockedChaptersData[chapter.number.toString()];
    const coinAmount = firebaseChapterData?.coinAmount || chapter.coinAmount || 1;
    const isPurchased = purchasedStatus[chapterId] === true;
    
  
    
    // Start with unlocked by default
    let isLocked = false;
    
    // Only lock if Firebase data exists
    if (firebaseChapterData) {
      // If there's Firebase data with unlock time, use that to determine lock status
      if (firebaseChapterData.unlocksAt) {
        const unlockTime = firebaseChapterData.unlocksAt instanceof Date 
          ? firebaseChapterData.unlocksAt 
          : firebaseChapterData.unlocksAt.toDate?.() 
            ? firebaseChapterData.unlocksAt.toDate() 
            : new Date(firebaseChapterData.unlocksAt);
        
        const now = new Date();
        if (now > unlockTime) {
          isLocked = false;
        } else {
          isLocked = true;
        }
      } else {
        // If there's Firebase data but no unlock time, use the isLocked flag from the data
        isLocked = Boolean(firebaseChapterData.isLocked);
      }
    } else {
      // No Firebase data, so don't lock the chapter regardless of other settings
      isLocked = false;
    }
    
    // If purchased, always unlocked regardless of other conditions
    if (isPurchased) {
      isLocked = false;
    }

    // Add a new property to track if the unlock icon should be shown
    // Only show the unlock icon for purchased chapters that are still within their unlock period
    let showUnlockIcon = false;
    if (isPurchased) {
      if (firebaseChapterData && firebaseChapterData.unlocksAt) {
        const unlockTime = firebaseChapterData.unlocksAt instanceof Date 
          ? firebaseChapterData.unlocksAt 
          : firebaseChapterData.unlocksAt.toDate?.() 
            ? firebaseChapterData.unlocksAt.toDate() 
            : new Date(firebaseChapterData.unlocksAt);
        
        const now = new Date();
        // Only show the unlock icon if the unlock time hasn't expired yet
        showUnlockIcon = now < unlockTime;
      }
    }
      
    return {
      ...chapter,
      isLocked,
      coinAmount,
      isPurchased,
      showUnlockIcon
    };
  });

  // Sort chapters by number (descending)
  const sortedChapters = [...processedChapters].sort((a, b) => b.number - a.number);
    
  // Split chapters into locked and free
  const lockedChapters = sortedChapters.filter(chapter => chapter.isLocked);
  const freeChapters = sortedChapters.filter(chapter => !chapter.isLocked);
  
  // Chapter display logic:
  // - If there are locked chapters: Show 2 locked and 2 free chapters
  // - If no locked chapters: Show 4 free chapters
  let latestLockedChapters: any[] = [];
  let latestFreeChapters: any[] = [];
  
  if (lockedChapters.length > 0) {
    // We have locked chapters, show 2 locked and 2 free
    latestLockedChapters = lockedChapters.slice(0, 2);
    latestFreeChapters = freeChapters.slice(0, 2);
  } else {
    // No locked chapters, show 4 free chapters
    latestFreeChapters = freeChapters.slice(0, 4);
  }

  // Format the URL correctly
  const mangaUrl = `/manga/${id}`;
  
  // Extract genres (limit to 3)
  const displayGenres = genres && genres.length > 0 
    ? genres.slice(0, 3) 
    : ["N/A"];
  
  // Function to force reload an image if it fails to load
  const handleImageError = () => {
    // Use fallback image
    setImageUrl('/fallback-image.svg');
    setImageError(true);
  };
  
  // Determine if we need to show the divider
  const showDivider = latestLockedChapters.length > 0 && latestFreeChapters.length > 0;

  // Determine if the user is logged in
  const isUserLoggedIn = !!userData?.uid;

  // Function to navigate to manga page
  const router = useRouter();
  const handleMangaClick = (e: React.MouseEvent) => {
    // Only navigate if the click wasn't on an interactive element
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.closest('a, button, [role="button"]');
    
    if (!isInteractiveElement) {
      router.push(mangaUrl);
    }
  };

  // Per-card accent hue derived from the id (mythtoons-style colorful cards).
  const cardHue = (() => {
    let h = 0;
    const s = String(id || title || "");
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  })();
  const accent = `hsl(${cardHue} 60% 58%)`;

  return (
    <div
      className="block cursor-pointer"
      onClick={handleMangaClick}
    >
      <div
        className="group latest-poster bg-gradient-to-br from-gray-900 to-black rounded-xl transition-all duration-300 border flex aspect-video overflow-hidden relative hover:-translate-y-1"
        style={{
          borderColor: `color-mix(in oklab, ${accent} 30%, transparent)`,
          boxShadow: `color-mix(in oklab, ${accent} 10%, transparent) 0px 2px 12px`,
        }}
      >
        {/* Colored glow ring on hover (per-card hue) */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
          style={{ boxShadow: `color-mix(in oklab, ${accent} 45%, transparent) 0px 0px 0px 1px inset, color-mix(in oklab, ${accent} 22%, transparent) 0px 6px 22px` }}
        ></div>
        {/* Cover Image - Left Side */}
        <div
          className="flex flex-col justify-between rounded-l-xl transition-transform duration-500 ease-out group-hover:scale-105 aspect-[0.75/1] h-full bg-no-repeat bg-cover bg-center relative"
          style={{
            backgroundImage: `url(${imageUrl})`,
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
          }}
        >
          {/* Special tags if needed */}
            {getSpecialTag(genres) && (
            <div className="flex flex-wrap gap-1 m-1">
              <span className="bg-red-700 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                {getSpecialTag(genres)?.text}
              </span>
            </div>
          )}
        </div>
        
        {/* Content (Right side) */}
        <div className="flex flex-col justify-between sm:py-2.5 sm:px-3.5 py-[2vw] px-[2.5vw] w-full bg-gradient-to-b from-gray-800/80 to-gray-900">
          {/* Title and Genres */}
          <div className="grid gap-1.5">
            <div className="grid">
              <h3 className="h-fit text-base line-clamp-2 leading-5 break-words text-white font-bold tracking-wide">{title}</h3>
            </div>
            
            {/* Genres */}
            <div className="text-xs flex flex-wrap gap-1 leading-none relative z-20">
              {displayGenres.map((genre, index) => (
                <div key={index} className="flex">
                  <Link 
                    href={`/tag/${encodeURIComponent(genre.toLowerCase())}`} 
                    className="flex hover:text-blue-300 text-gray-300 transition-all relative z-30"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {genre}{index < displayGenres.length - 1 && ','}
                  </Link>
                </div>
              ))}
            </div>
          </div>
          
          {/* Chapter info */}
          {has_chapters && (
            <div className="grid -mb-1 relative z-20">
              {/* Locked Chapters (Paid) */}
              {latestLockedChapters.length > 0 && (
                <div className="grid text-xs divide-y divide-white/20 divide-dashed">
                  {latestLockedChapters.map((chapter, index) => (
                    <Link 
                      key={`locked-${index}`}
                      href={`/read/${id}-ch${chapter.number}`}
                      className="flex justify-between items-center leading-none gap-1 py-2 hover:-mx-2 hover:px-2 hover:bg-white/10 visited:text-zinc-500 hover:rounded-xl transition-all relative z-30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="flex justify-start items-center h-4 gap-1.5 w-full overflow-hidden">
                        <div className={`truncate leading-4 -my-0.5 ${chapter.isPurchased || purchasedStatus[`${id}-ch${chapter.number}`] ? 'text-green-500' : 'text-yellow-500'}`}>
                          Chapter {chapter.number}
                        </div>
                        <div className="flex gap-1 justify-start items-center w-fit relative z-40">
                          <ChapterLockIcon 
                            chapter={chapter} 
                            mangaId={id} 
                            onPurchaseStatusChange={(isPurchased) => {
                              if (isPurchased) {
                                // Force a re-render by creating a new chapter object
                                const updatedChapter = {...chapter, isPurchased: true};
                                Object.assign(chapter, updatedChapter);
                                
                                // Update purchase status in component state
                                setPurchasedStatus(prev => ({
                                  ...prev,
                                  [`${id}-ch${chapter.number}`]: true
                                }));
                              }
                            }}
                          />
                          {isNewChapter(chapter) && (
                            <>
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="12" 
                                height="12" 
                                viewBox="0 0 24 24" 
                                fill="#ef4444" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className="lucide lucide-flame dot-animation text-red-500"
                              >
                                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                              </svg>
                              <span className="text-[9px] font-medium text-red-500">New</span>
                            </>
                          )}
                        </div>
                      </span>
                      <span className="text-[0.60rem] whitespace-nowrap">{getRelativeTime(chapter)}</span>
                    </Link>
                  ))}
                </div>
              )}
              
              {/* Divider */}
              {showDivider && (
                <div className="h-0.5 my-0.5 bg-gray-300 rounded-full"></div>
              )}
              
              {/* Free Chapters */}
              {latestFreeChapters.length > 0 && (
                <div className="grid text-xs divide-y divide-white/20 divide-dashed">
                  {latestFreeChapters.map((chapter, index) => (
                    <Link 
                      key={`free-${index}`}
                      href={`/read/${id}-ch${chapter.number}`}
                      className="flex justify-between items-center leading-none gap-1 py-2 hover:-mx-2 hover:px-2 hover:bg-white/10 visited:text-zinc-500 hover:rounded-xl transition-all relative z-30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="flex justify-start items-center h-4 gap-1.5 w-full overflow-hidden">
                        <div className="truncate leading-4 -my-0.5 text-white">
                          Chapter {chapter.number}
                        </div>
                        <div className="flex gap-1 justify-start items-center w-fit relative z-40">
                        {chapter.showUnlockIcon && (
                          <LockOpenIcon className="h-3 w-3 text-green-500" />
                        )}
                          {isNewChapter(chapter) && (
                            <>
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="12" 
                                height="12" 
                                viewBox="0 0 24 24" 
                                fill="#ef4444" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className="lucide lucide-flame dot-animation text-red-500"
                              >
                                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                              </svg>
                              <span className="text-[9px] font-medium text-red-500">New</span>
                            </>
                          )}
                        </div>
                      </span>
                      <span className="text-[0.60rem] whitespace-nowrap">{getRelativeTime(chapter)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MangaCard;