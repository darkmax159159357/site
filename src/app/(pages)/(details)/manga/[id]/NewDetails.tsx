/* eslint-disable */
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import NavLink from "@/components/navlink/NavLink";
import { detailsDataProps } from "./dataType";
import Disqus from "@/components/Disqus";
import disqusConfig from "@/lib/disqus-config";
import MangaDetailsDisqus from "@/components/MangaDetailsDisqus";
import { useAuth } from "@/contexts/AuthContext";
import { useBookmarks } from "@/contexts/BookmarkContext";
import LoginModal from "@/components/LoginModal";
import { useTrackMangaView } from "@/app/hooks/useViewTracker";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { auth, db } from "@/lib/firebase"; // Import Firebase components
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, increment, runTransaction, arrayUnion, serverTimestamp, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Content1 } from '@/components/ads/AdPositions';
import { getSiteConfig, SiteConfig, DEFAULT_SITE_CONFIG } from "@/lib/site-config";

// Ratings Component
interface RatingsComponentProps {
  mangaId: string;
  initialRating?: number;
}

const RatingsComponent = ({ mangaId, initialRating = 0 }: RatingsComponentProps) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const { user } = useAuth();
  const [socialLinks, setSocialLinks] = useState({ 
    discord: DEFAULT_SITE_CONFIG.social.discord,
    kofi: DEFAULT_SITE_CONFIG.social.kofi 
  });

  // Load average rating and user's previous rating if it exists
  useEffect(() => {
    const loadRatings = async () => {
      try {
        // Get manga average rating
        const mangaRatingsRef = doc(db, 'manga_ratings', mangaId);
        const mangaRatingsDoc = await getDoc(mangaRatingsRef);
        
        if (mangaRatingsDoc.exists()) {
          const data = mangaRatingsDoc.data();
          
          // Calculate proper rating based on rating counts
          let properRating = 0;
          
          if (data.ratingCount) {
            // Calculate weighted sum (star value × count of ratings)
            let weightedSum = 0;
            let totalCount = 0;
            
            for (let i = 1; i <= 5; i++) {
              const count = data.ratingCount[i.toString()] || 0;
              weightedSum += i * 2 * count; // Multiply by 2 for 10-point scale
              totalCount += count;
            }
            
            // Calculate proper rating
            properRating = totalCount > 0 ? weightedSum / totalCount : 0;
            console.log(`RatingComponent: calculated rating=${properRating}, stored=${data.averageRating}`);
            
            // Auto-fix Firebase data if significantly different
            if (Math.abs(properRating - data.averageRating) > 1) {
              console.log("Fixing incorrect rating in Firebase...");
              try {
                await updateDoc(mangaRatingsRef, {
                  averageRating: properRating,
                  sumOfRatings: Math.round(properRating * data.totalRatings)
                });
                console.log("✅ Rating data fixed in Firebase");
              } catch (error) {
                console.error("Failed to update rating in Firebase:", error);
              }
            }
          } else {
            // Fallback to stored average if no rating counts
            properRating = data.averageRating || 0;
          }
          
          // Round to 10 if very close
          if (properRating > 9.95) properRating = 10;
          
          // Ensure rating is within 0-10 range
          const boundedRating = Math.max(0, Math.min(10, properRating));
          
          setAverageRating(boundedRating);
          setTotalRatings(data.totalRatings || 0);
          
          console.log("Firebase ratings loaded:", {
            averageRating: boundedRating,
            totalRatings: data.totalRatings || 0
          });
        }
        
        // If user is logged in, get their personal rating
        if (user) {
          const userRatingsRef = doc(db, `users/${user.uid}/ratings`, mangaId);
          const ratingDoc = await getDoc(userRatingsRef);
          
          if (ratingDoc.exists()) {
            const userData = ratingDoc.data();
            // Convert 1-10 scale to 1-5 stars (divide by 2)
            const userRating = userData.rating 
              ? Math.min(5, Math.max(1, Math.round(userData.rating / 2))) 
              : 0;
            
            setRating(userRating);
            setHasRated(true);
            
            console.log("User rating loaded:", userRating);
          }
        }
      } catch (error) {
        console.error("Error loading ratings:", error);
      }
    };
    
    loadRatings();
  }, [user, mangaId]);

  const handleRating = async (newRating: number) => {
    if (!user) {
      toast.error("Please sign in to rate this series");
      return;
    }
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setRating(newRating);
    
    try {
      // Convert 1-5 star rating to 1-10 scale for storage
      const normalizedRating = newRating * 2; // 5 stars max = 10 rating
      
      await runTransaction(db, async (transaction) => {
        // First, get manga ratings document
        const mangaRatingsRef = doc(db, 'manga_ratings', mangaId);
        const mangaRatingsDoc = await transaction.get(mangaRatingsRef);
        
        // Get user's previous rating document if it exists
        const userRatingsRef = doc(db, `users/${user.uid}/ratings`, mangaId);
        const userRatingDoc = await transaction.get(userRatingsRef);
        
        // Calculate the values for updating
        let oldRatingValue = 0;
        let isNewRating = !userRatingDoc.exists();
        
        if (!isNewRating) {
          // User already rated before
          const userRatingData = userRatingDoc.data();
          oldRatingValue = userRatingData?.rating || 0;
        }
        
        // Calculate new values for manga_ratings document
        if (!mangaRatingsDoc.exists()) {
          // Create new manga ratings document
          const newDoc = {
            mangaId,
            totalRatings: 1,
            sumOfRatings: normalizedRating,
            averageRating: normalizedRating,
            ratingCount: {
              "1": normalizedRating === 2 ? 1 : 0,
              "2": normalizedRating === 4 ? 1 : 0,
              "3": normalizedRating === 6 ? 1 : 0,
              "4": normalizedRating === 8 ? 1 : 0,
              "5": normalizedRating === 10 ? 1 : 0
            },
            lastUpdated: serverTimestamp()
          };
          
          transaction.set(mangaRatingsRef, newDoc);
          
          // Update local state
          setAverageRating(normalizedRating);
          setTotalRatings(1);
        } else {
          // Update existing manga ratings
          const ratingData = mangaRatingsDoc.data();
          
          if (!ratingData) {
            throw new Error("Rating data is undefined");
          }
          
          // Calculate new values
          const newTotalRatings = isNewRating ? ratingData.totalRatings + 1 : ratingData.totalRatings;
          const newSumOfRatings = isNewRating 
            ? ratingData.sumOfRatings + normalizedRating
            : ratingData.sumOfRatings - oldRatingValue + normalizedRating;
          
          // Ensure the sum of ratings is not negative or NaN
          const validatedSumOfRatings = isNaN(newSumOfRatings) || newSumOfRatings < 0 
            ? normalizedRating 
            : newSumOfRatings;
          
          // Recalculate average properly
          const newAverageRating = newTotalRatings > 0 
            ? validatedSumOfRatings / newTotalRatings
            : normalizedRating;
            
          // Make sure average rating is between 0-10
          const boundedAverageRating = Math.max(0, Math.min(10, newAverageRating));
          
          // Update rating counts
          const ratingCountKey = Math.ceil(normalizedRating / 2).toString();
          const oldRatingCountKey = oldRatingValue > 0 ? Math.ceil(oldRatingValue / 2).toString() : null;
          
          const newRatingCount = { ...(ratingData.ratingCount || {}) };
          
          if (isNewRating) {
            newRatingCount[ratingCountKey] = (newRatingCount[ratingCountKey] || 0) + 1;
          } else {
            // Decrement old rating count
            if (oldRatingCountKey && newRatingCount[oldRatingCountKey]) {
              newRatingCount[oldRatingCountKey] = Math.max(0, newRatingCount[oldRatingCountKey] - 1);
            }
            // Increment new rating count
            newRatingCount[ratingCountKey] = (newRatingCount[ratingCountKey] || 0) + 1;
          }
          
          const updateData = {
            totalRatings: newTotalRatings,
            sumOfRatings: validatedSumOfRatings,
            averageRating: boundedAverageRating,
            ratingCount: newRatingCount,
            lastUpdated: serverTimestamp()
          };
          
          transaction.update(mangaRatingsRef, updateData);
          
          // Update local state
          setAverageRating(boundedAverageRating);
          setTotalRatings(newTotalRatings);
        }
        
        // Save user's rating
        transaction.set(userRatingsRef, {
          mangaId,
          rating: normalizedRating,
          timestamp: serverTimestamp()
        });
      });
      
      setHasRated(true);
      toast.success("Rating submitted successfully");
    } catch (error) {
      console.error("Error submitting rating:", error);
      
      // Provide more specific error messages based on the error
      if (error instanceof Error) {
        if (error.message.includes("permission-denied")) {
          toast.error("You don't have permission to rate. Please sign in.");
        } else if (error.message.includes("network")) {
          toast.error("Network error. Check your connection and try again.");
        } else if (error.message.includes("Rating data is undefined")) {
          // Our custom error in the code
          toast.error("Rating data could not be processed. Please try again.");
        } else {
          // Default error message
          toast.error("Failed to submit rating. Please try again.");
        }
      } else {
        toast.error("Failed to submit rating. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format rating to display with one decimal place
  const formatRating = (rating: number) => {
    // If rating is 10 (or very close), display as "10.0"
    if (rating > 9.95) return "10.0";
    // Use Math.round to get a clean number with one decimal place
    return (Math.round(rating * 10) / 10).toFixed(1);
  };

  return (
    <div className="p-5 backdrop-blur-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl ring-1 ring-white/10 shadow-xl">
      <h3 className="font-medium text-center mb-3 text-white">Rate This Series</h3>
      
      <div className="flex justify-center items-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className="focus:outline-none transform transition-all duration-200 hover:scale-110"
            onClick={() => handleRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            disabled={isSubmitting}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill={star <= (hover || rating) ? "#FFD700" : "none"}
              stroke={star <= (hover || rating) ? "#FFD700" : "currentColor"}
              className="w-8 h-8 transition-all duration-200"
              style={{
                filter: star <= (hover || rating) ? "drop-shadow(0 0 5px rgba(255, 215, 0, 0.8))" : "none"
              }}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5}
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" 
              />
            </svg>
          </button>
        ))}
      </div>
      
      {rating > 0 && (
        <div className="text-center mt-3 text-sm font-medium text-amber-300">
          <span>{hasRated ? "Your rating:" : "Selected:"} {rating}/5</span>
        </div>
      )}
      
      {/* Average Rating Display */}
      {averageRating !== null && (
        <div className="text-center mt-4 flex flex-col items-center">
          <div className="font-bold text-xl text-amber-400 flex items-center gap-1">
            {formatRating(averageRating)}
            <span className="text-xs text-amber-500 font-normal">/10</span>
          </div>
          <div className="text-xs text-gray-400">
            {totalRatings.toLocaleString()} {totalRatings === 1 ? 'rating' : 'ratings'}
          </div>
        </div>
      )}
      
      {isSubmitting && (
        <div className="flex justify-center mt-2">
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
};

// Define the type for our component props
type NewDetailsProps = {
  dataDetails: detailsDataProps["data"] & {
    genre?: string;
  };
};

// Configure toast to prevent duplicates
const showToast = (message: string, type: 'success' | 'error') => {
  // Dismiss any existing toasts to prevent stacking
  toast.dismiss();
  
  if (type === 'success') {
    toast.success(message, {
      id: `bookmark-${message}`, // Use unique ID based on the message
      duration: 2000 
    });
  } else {
    toast.error(message, {
      id: `bookmark-error-${message}`,
      duration: 3000
    });
  }
};

const NewDetails = ({ dataDetails }: NewDetailsProps) => {
  // Navigation
  const router = useRouter();
  
  // Authentication
  const { user, userData } = useAuth();
  const { isBookmarked, toggleBookmark, getLastReadChapter, updateBookmarkChapter } = useBookmarks();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [bookmarkStatus, setBookmarkStatus] = useState(false);
  const [lastReadChapter, setLastReadChapter] = useState<string | null>(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isBookmarkProcessing, setIsBookmarkProcessing] = useState(false);
  const [initialLoadCompleted, setInitialLoadCompleted] = useState(false); // Track initial load
  const [visibleChapters, setVisibleChapters] = useState(9); // For chapter visibility limit
  const [socialLinks, setSocialLinks] = useState<{discord?: string, kofi?: string}>({});
  const [bookmarkCount, setBookmarkCount] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  
  // Add refs to track previous values
  const prevBookmarkStatus = useRef(false);
  const prevLastReadChapter = useRef<string | null>(null);

  // Add this at the beginning of the NewDetails component body
  const componentMountedRef = useRef(true);

  // Add a toggle history tracker
  const toggleHistory = useRef<{timestamp: number, action: string, isUserAction: boolean}[]>([]);
  
  // Create a reference to check if toggleBookmark is being called by the user
  const isUserAction = useRef(false);
  
  // Function to create or update global bookmarks collection
  const updateGlobalBookmarks = async (
    mangaId: string,
    title: string, 
    cover: string,
    isAdding: boolean
  ) => {
    if (!user) return;
    
    try {
      // Create a reference to the global bookmarks collection
      const globalBookmarksRef = collection(db, 'bookmarks');
      
      if (isAdding) {
        // Create a document ID using mangaId
        const bookmarkDocRef = doc(db, 'bookmarks', mangaId);
        
        // Check if document exists
        const bookmarkDoc = await getDoc(bookmarkDocRef);
        
        if (bookmarkDoc.exists()) {
          // Update existing document
          await updateDoc(bookmarkDocRef, {
            userCount: increment(1),
            lastUpdated: serverTimestamp()
          });
          console.log(`Updated global bookmark for ${mangaId}, incremented user count`);
        } else {
          // Create new document
          await setDoc(bookmarkDocRef, {
            mangaId,
            title,
            cover,
            userCount: 1,
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
          });
          console.log(`Created new global bookmark for ${mangaId}`);
        }
      } else {
        // Removing bookmark - decrement count
        const bookmarkDocRef = doc(db, 'bookmarks', mangaId);
        const bookmarkDoc = await getDoc(bookmarkDocRef);
        
        if (bookmarkDoc.exists()) {
          const data = bookmarkDoc.data();
          const currentCount = data.userCount || 0;
          
          if (currentCount <= 1) {
            // If this was the last user, you can either delete the document or keep it with count 0
            // Here we'll keep it with count 0 to preserve the data
            await updateDoc(bookmarkDocRef, {
              userCount: 0,
              lastUpdated: serverTimestamp()
            });
            console.log(`Updated global bookmark for ${mangaId}, reset user count to 0`);
          } else {
            // Decrement the counter
            await updateDoc(bookmarkDocRef, {
              userCount: increment(-1),
              lastUpdated: serverTimestamp()
            });
            console.log(`Updated global bookmark for ${mangaId}, decremented user count`);
          }
        }
      }
    } catch (error) {
      console.error("Error updating global bookmarks collection:", error);
    }
  };
  
  // Create a safe version of toggleBookmark that only works when isUserAction is true
  const safeToggleBookmark = async (mangaId: string, title: string, cover: string) => {
    if (!isUserAction.current) {
      console.warn("BLOCKED: Attempted to call toggleBookmark without user action");
      trackToggle("BLOCKED auto-toggle attempt", false);
      return false; // Return a default value instead of toggling
    }
    
    // If it's a user action, allow the toggle
    trackToggle("Processing legitimate toggle", true);
    return await toggleBookmark(mangaId, title, cover);
  };

  // Add a function to track toggles
  const trackToggle = (action: string, isUserAction: boolean = false) => {
    const timestamp = Date.now();
    toggleHistory.current.push({timestamp, action, isUserAction});
    console.log(`TOGGLE HISTORY: ${action} at ${new Date(timestamp).toISOString()} (User Action: ${isUserAction})`);
    
    // Log the full history periodically
    if (toggleHistory.current.length % 5 === 0) {
      console.log("FULL TOGGLE HISTORY:", toggleHistory.current);
    }
  };
  
  // Function to format ratings with one decimal place
  const formatRating = (rating: number) => {
    // If rating is 10 (or very close), display as "10.0"
    if (rating > 9.95) return "10.0";
    // Use Math.round to get a clean number with one decimal place
    return (Math.round(rating * 10) / 10).toFixed(1);
  };

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      componentMountedRef.current = false;
      console.log("Component unmounting, cancelling all operations");
    };
  }, []);
  
  // Load social links from Firebase
  useEffect(() => {
    async function loadSiteConfig() {
      try {
        const config = await getSiteConfig();
        setSocialLinks({
          discord: config.social.discord,
          kofi: config.social.kofi
        });
      } catch (error) {
        console.error("Failed to load site configuration:", error);
      }
    }
    
    loadSiteConfig();
  }, []);

  // Function to format dates in the "Mar 23, 2025" format
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "N/A") return "N/A";
    
    try {
      // Handle different date formats
      let date;
      
      // Format: "23-06-2025 10:00 pm" (DD-MM-YYYY HH:MM am/pm) or "13-06-2025, 06:19 pm"
      if (typeof dateStr === 'string' && (dateStr.match(/^\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}\s(am|pm)$/i) || dateStr.match(/^\d{2}-\d{2}-\d{4},\s\d{2}:\d{2}\s(am|pm)$/i))) {
        // Remove any comma if present
        const cleanDateStr = dateStr.replace(',', '');
        const dateParts = cleanDateStr.split(' ');
        
        // Parse date part: "23-06-2025"
        const dateComponents = dateParts[0].split('-');
        const day = parseInt(dateComponents[0]);
        const month = parseInt(dateComponents[1]) - 1; // Months are 0-indexed
        const year = parseInt(dateComponents[2]);
        
        // Parse time part: "10:00"
        const timeParts = dateParts[1].split(':');
        let hour = parseInt(timeParts[0]);
        const minute = parseInt(timeParts[1]);
        
        // Adjust for PM
        const isPM = dateParts[2]?.toLowerCase() === 'pm';
        if (isPM && hour < 12) {
          hour += 12;
        }
        
        // Create date object
        date = new Date(year, month, day, hour, minute);
      } 
      // Try to parse as ISO string
      else {
      date = new Date(dateStr);
      
      // If invalid, try parsing as YYYY-MM-DD HH:MM:SS format
      if (isNaN(date.getTime()) && typeof dateStr === 'string') {
        // Replace any potential timezone info
        const cleanDateString = dateStr.replace(/\s\([^)]*\)/g, '');
        
        if (cleanDateString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
          // Convert to ISO format
          date = new Date(cleanDateString.replace(' ', 'T') + 'Z');
          }
        }
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      
      // Apply the new date formatting rules
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
        } else {
          // Past date (recently added)
          if (absDiffInSeconds < 60) {
        return 'Just now';
          } else if (absDiffInSeconds < 3600) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
          } else {
        // Remove minutes, just show hours
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
          }
        }
      }
      
      // Outside the 24 hour window
      if (diffInSeconds < 0) {
        // Future date beyond 24 hours, show formatted date
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
      }
      
      // Calculate days for all longer time periods
      const diffInDays = Math.floor(diffInSeconds / 86400);
      
      // Less than 7 days: show only days
      if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
      }
      
      // Between 7 days and 1 month: show weeks only
      if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
      }
      
      // Between 1 month and 3 months: show months only
      if (diffInDays < 90) {
        const months = Math.floor(diffInDays / 30);
        return `${months} month${months !== 1 ? 's' : ''} ago`;
      }
      
      // Over 3 months: show full date
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  // Extract manga data
  const {
    id = "",
    title = "",
    cover = "/fallback-image.png",
    banner = "",
    description = "No description available.",
    author = "Unknown",
    type = "MANHWA",
    rating = "N/A",
    published = "N/A",
    bookmark_users = 0,
    chapters = [],
    status = "ONGOING",
    genre = "",
    genres = [],
  } = dataDetails;

  // Parse genre string if it exists and genres array is empty - moved earlier
  const genreList = genres.length > 0 
    ? genres 
    : (genre ? genre.split(',').map((g: string) => g.trim()) : []);

  // Function to check if content is pornhwa based on genres or type
  const isPornhwa = () => {
    // Check if "pornhwa" appears in any of the genres (case insensitive)
    const hasGenrePornhwa = genreList.some(genre => 
      String(genre).toLowerCase().includes("pornhwa"));
    
    // Check if "pornhwa" appears in the type
    const hasTypePornhwa = String(type).toLowerCase().includes("pornhwa");
    
    // Debug
    console.log("Has pornhwa genre:", hasGenrePornhwa);
    console.log("Has pornhwa type:", hasTypePornhwa);
    
    // Return true if either condition is met
    return hasGenrePornhwa || hasTypePornhwa;
  };

  // Function to check if content is manga, manhwa, or manhua
  const isMangaManhwaManhua = () => {
    // Check if any of the keywords appears in the genres (case insensitive)
    const hasKeywordInGenre = genreList.some(genre => 
      String(genre).toLowerCase().includes("manga") || 
      String(genre).toLowerCase().includes("manhwa") || 
      String(genre).toLowerCase().includes("manhua"));
    
    // Debug
    console.log("Has manga/manhwa/manhua genre:", hasKeywordInGenre);
    
    // Only check genres, not type
    return hasKeywordInGenre;
  };

  // Debug logging for chapter lock information
  useEffect(() => {
    if (chapters.length > 0) {
      console.log("Chapter lock information:", chapters.map(ch => ({
        number: ch.number,
        isLocked: ch.isLocked, 
        unlockTime: ch.unlockTime
      })));
    }
    
    // Debug content type
    console.log("Content type:", type);
    console.log("Content type uppercase:", type.toUpperCase());
    console.log("Genres:", genreList);
  }, [chapters, type, genreList]);

  // Add Firebase check for locked chapters
  const [processedChapters, setProcessedChapters] = useState(chapters);
  useEffect(() => {
    const checkFirebaseLockStatus = async () => {
      if (!chapters || chapters.length === 0) return;
      
      try {
        // Query Firebase for all locked chapters for this manga
        const lockedChaptersRef = collection(db, "locked_chapters");
        const q = query(lockedChaptersRef, where("mangaId", "==", id));
        const querySnapshot = await getDocs(q);
        
        // Create a map of chapter number to locked chapter data
        const lockedChaptersData: {[key: string]: any} = {};
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.chapterNumber) {
            lockedChaptersData[data.chapterNumber.toString()] = data;
          }
        });
        
        console.log("Firebase locked chapters data:", lockedChaptersData);
        
        // Get direct user purchase data from Firebase
        let directPurchasedChapters: string[] = [];
        
        if (user && user.uid) {
          try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              const directUserData = userDocSnap.data();
              if (directUserData.purchasedChapters && Array.isArray(directUserData.purchasedChapters)) {
                directPurchasedChapters = directUserData.purchasedChapters;
                console.log("Direct purchased chapters from Firebase:", directPurchasedChapters);
              }
            }
          } catch (error) {
            console.error("Error fetching direct user data:", error);
          }
        }
        
        // Update chapters with correct lock status based on Firebase data
        const updated = chapters.map(chapter => {
          const chapterId = `${id}-ch${chapter.number}`;
          const firebaseData = lockedChaptersData[chapter.number.toString()];
          let isLocked = false;
          
          // Check purchased status from both sources
          const isPurchased = 
            (userData?.purchasedChapters?.includes(chapterId) || directPurchasedChapters.includes(chapterId));
          
          // Only consider locked if Firebase data exists
          if (firebaseData) {
            if (firebaseData.unlocksAt) {
              const unlockTime = firebaseData.unlocksAt instanceof Date
                ? firebaseData.unlocksAt
                : firebaseData.unlocksAt.toDate?.()
                  ? firebaseData.unlocksAt.toDate()
                  : new Date(firebaseData.unlocksAt);
              
              const now = new Date();
              isLocked = now < unlockTime;
            } else {
              isLocked = Boolean(firebaseData.isLocked);
            }
            
            // If purchased, never show as locked
            if (isPurchased) {
              isLocked = false;
            }
          } else {
            // No Firebase data means chapter should not be locked
            isLocked = false;
          }

          // Add a new property to track if the unlock icon should be shown
          // Only show the unlock icon for purchased chapters that are still within their unlock period
          let showUnlockIcon = false;
          if (isPurchased) {
            if (firebaseData && firebaseData.unlocksAt) {
              const unlockTime = firebaseData.unlocksAt instanceof Date
                ? firebaseData.unlocksAt
                : firebaseData.unlocksAt.toDate?.()
                  ? firebaseData.unlocksAt.toDate()
                  : new Date(firebaseData.unlocksAt);
              
              const now = new Date();
              // Only show the unlock icon if the unlock time hasn't expired yet
              showUnlockIcon = now < unlockTime;
            } else {
              // If there's no unlock time specified, show the purchased badge
              showUnlockIcon = true;
            }
          }
          
          return {
            ...chapter,
            isLocked,
            isPurchased,
            coinAmount: firebaseData?.coinAmount || chapter.coinAmount || 1,
            showUnlockIcon
          };
        });
        
        setProcessedChapters(updated);
        console.log("Updated chapters with Firebase lock status:", updated.map(ch => ({
          number: ch.number,
          isLocked: ch.isLocked,
          isPurchased: ch.isPurchased,
          showUnlockIcon: ch.showUnlockIcon
        })));
      } catch (error) {
        console.error("Error checking Firebase lock status:", error);
        setProcessedChapters(chapters.map(chapter => ({
          ...chapter,
          isLocked: false // Default to not locked on error
        })));
      }
    };
    
    checkFirebaseLockStatus();
  }, [chapters, id, userData?.purchasedChapters, user]);

  // Track manga view
  useTrackMangaView({
    mangaId: id,
    mangaTitle: title,
    coverImage: cover
  });

  // Filter chapters based on search query - fix to match exact chapter numbers
  const filteredChapters = processedChapters.filter(chapter => {
    if (!searchQuery) return true;
    
    // Convert both to strings for comparison and check for exact match
    const chapterStr = String(chapter.number);
    const searchStr = String(searchQuery).trim();
    
    // Only match if it's an exact number match
    return chapterStr === searchStr;
  });

  // Sort chapters based on sort order
  const sortedChapters = [...filteredChapters].sort((a, b) => {
    if (sortOrder === "asc") {
      return a.number - b.number; // Oldest first
    } else {
      return b.number - a.number; // Newest first
    }
  });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Ensure user document exists
  const ensureUserDocument = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.log("Creating missing user document for", userId);
        
        // Create the user document
        const userData = {
          uid: userId,
          email: user?.email || '',
          displayName: user?.displayName || '',
          createdAt: new Date().toISOString(),
          role: 'user'
        };
        
        await setDoc(userRef, userData);
        console.log("User document created successfully");
        return true;
      }
      
      return true;
    } catch (error) {
      console.error("Error ensuring user document:", error);
      return false;
    }
  };

  // Handle manual bookmark toggle with safety
  const handleToggleBookmark = useCallback(async () => {
    // Check if component is still mounted
    if (!componentMountedRef.current) {
      console.log("Component unmounted, not proceeding with toggle");
      return;
    }

    // Track this toggle attempt
    trackToggle("Toggle button clicked", true);
    
    // Set this as a user action
    isUserAction.current = true;

    // Prevent multiple rapid clicks
    if (isBookmarkProcessing) {
      console.log("PREVENTED: Bookmark processing in progress");
      return;
    }
    
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // Log that this was an explicit user action
    console.log("EXPLICIT USER ACTION: Toggle bookmark button clicked");

    try {
      // Set processing state to prevent duplicate operations
      setIsBookmarkProcessing(true);
      
      // First ensure user document exists
      await ensureUserDocument(user.uid);
      
      // Add the loading animation to the bookmark icon
      const button = document.getElementById('add-library-btn');
      if (button) {
        button.classList.add('ripple');
      }
      
      // Firebase operation through BookmarkContext - use safeToggleBookmark
      const isNowBookmarked = await safeToggleBookmark(id, title, cover);
      
      // Update the global bookmarks collection
      await updateGlobalBookmarks(id, title, cover, isNowBookmarked);
      
      // Reset the user action flag
      isUserAction.current = false;
      
      // Update the UI state
      setBookmarkStatus(isNowBookmarked);
      prevBookmarkStatus.current = isNowBookmarked;
      
      // Show toast notification with custom function
      showToast(
        isNowBookmarked
          ? `${title} added to your library` 
          : `${title} removed from your library`,
        'success'
      );
      
      // Refresh bookmark count
      if (id) {
        const bookmarkDocRef = doc(db, 'bookmarks', id);
        const bookmarkDoc = await getDoc(bookmarkDocRef);
        
        if (bookmarkDoc.exists()) {
          const data = bookmarkDoc.data();
          setBookmarkCount(data.userCount || 0);
        }
      }
      
      // Remove the ripple animation after it completes
      setTimeout(() => {
        if (button) {
          button.classList.remove('ripple');
          button.classList.add('bookmark-added');
          setTimeout(() => {
            button.classList.remove('bookmark-added');
            // Reset processing state after animation completes
            setIsBookmarkProcessing(false);
          }, 500);
        } else {
          setIsBookmarkProcessing(false);
        }
      }, 700);
      
    } catch (error: any) {
      // Reset the user action flag on error
      isUserAction.current = false;
      
      console.error("Error toggling bookmark:", error);
      
      // Reset processing state on error
      setIsBookmarkProcessing(false);
      
      // Provide more specific error messages based on the error
      if (error.message?.includes("User must be logged in")) {
        showToast("Please sign in to add to your library", 'error');
        setShowLoginModal(true);
      } else if (error.message?.includes("invalid data")) {
        showToast("Unable to update library due to invalid data", 'error');
      } else if (error.message?.includes("network")) {
        showToast("Network error. Check your connection and try again", 'error');
      } else if (error.message?.includes("operation is in progress")) {
        // Do nothing, already processing
      } else {
        showToast("Failed to update your library. Please try again", 'error');
      }
      
      // Remove animation if error occurs
      const button = document.getElementById('add-library-btn');
      if (button) {
        button.classList.remove('ripple');
      }
    }
  }, [user, id, title, cover, safeToggleBookmark, isBookmarkProcessing, updateGlobalBookmarks, ensureUserDocument]);

  // Load bookmark status ONLY when component mounts or user changes
  useEffect(() => {
    let isMounted = true;

    async function initialBookmarkLoad() {
      if (!user || isBookmarkProcessing) return;
      
      try {
        console.log("Initial bookmark load for", id);
        // IMPORTANT: Only check the status, don't toggle it!
        const isBookmarkedStatus = await isBookmarked(id);
        console.log("Initial bookmark status:", isBookmarkedStatus);

        if (isMounted) {
          // Just update the state without triggering any toggle
            setBookmarkStatus(isBookmarkedStatus);
            prevBookmarkStatus.current = isBookmarkedStatus;
          }

        const lastChapter = await getLastReadChapter(id);
        if (isMounted) {
            setLastReadChapter(lastChapter);
            prevLastReadChapter.current = lastChapter;
          setInitialLoadCompleted(true);
        }
      } catch (error) {
        console.error("Error in initial bookmark load:", error);
        if (isMounted) {
          setInitialLoadCompleted(true);
        }
      }
    }

    // Only load on mount or if user changes and load hasn't completed
    if (!initialLoadCompleted) {
      initialBookmarkLoad();
    }

    return () => {
      isMounted = false;
    };
  }, [user, id, isBookmarked, getLastReadChapter, isBookmarkProcessing, initialLoadCompleted]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `Check out ${title} on MedusaScans!`,
        url: window.location.href,
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(err => console.error('Error copying link:', err));
    }
  };

  // Debug function to check auth and Firebase status
  const debugFirebase = useCallback(async () => {
    try {
      console.log("Current auth state:", auth.currentUser);
      
      if (user) {
        console.log("User object:", user);
        
        // Check if user document exists
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        console.log("User document exists:", userDocSnap.exists());
        
        if (userDocSnap.exists()) {
          console.log("User document data:", userDocSnap.data());
        }
        
        // Check bookmarks collection
        const bookmarksRef = collection(db, `users/${user.uid}/bookmarks`);
        const bookmarksSnap = await getDocs(bookmarksRef);
        console.log("User has bookmarks:", !bookmarksSnap.empty);
        console.log("Number of bookmarks:", bookmarksSnap.size);
        
        // List all bookmarks for debugging
        const bookmarks: any[] = [];
        bookmarksSnap.forEach(doc => {
          bookmarks.push(doc.data());
        });
        console.log("Bookmarks:", bookmarks);
        
        // Specifically check this manga's bookmark
        const bookmarkId = `${user.uid}_${id}`;
        const bookmarkRef = doc(db, `users/${user.uid}/bookmarks`, bookmarkId);
        const bookmarkDoc = await getDoc(bookmarkRef);
        console.log(`Direct check for bookmark ${id}: ${bookmarkDoc.exists() ? "Found" : "Not found"}`);
      } else {
        console.log("No authenticated user");
      }
    } catch (error) {
      console.error("Debug function error:", error);
    }
  }, [user, id]);
  
  // Run the debug function once on component mount WITHOUT triggering any toggles
  useEffect(() => {
    if (user && initialLoadCompleted) {
      debugFirebase();
    }
  }, [user, initialLoadCompleted, debugFirebase]);

  // Add a safety check on user state changes
  useEffect(() => {
    // This is just to report user changes, not to trigger any actions
    if (user) {
      console.log("User authenticated:", user.uid);
    } else {
      console.log("User logged out or not authenticated");
    }
    
    // Don't do any bookmark operations here!
  }, [user]);

  // Add a check for the rendered button to make sure it's using the right event handlers
  useEffect(() => {
    const addLibBtn = document.getElementById('add-library-btn');
    if (addLibBtn) {
      // Log event listeners (not directly possible, but we can check)
      console.log("Add library button found, ensuring it only triggers on click");
      
      // Debugging code - disabled by default
      const DEBUG_REPLACE_BUTTON = false;
      if (DEBUG_REPLACE_BUTTON) {
        try {
        console.log("DEBUG: Replacing button event handlers");
          // @ts-ignore - This is debug code that's disabled by default
        const parent = addLibBtn.parentNode;
          if (!parent) return;
          
          // @ts-ignore - This is debug code that's disabled by default
        const clone = addLibBtn.cloneNode(true);
          // @ts-ignore - This is debug code that's disabled by default
        addLibBtn.remove();
          parent.appendChild(clone);
          
          const newBtn = document.getElementById('add-library-btn');
          if (newBtn) {
            // @ts-ignore - This is debug code that's disabled by default
            newBtn.addEventListener('click', (e) => {
          e.preventDefault();
          console.log("Manual click handler");
          if (!isBookmarkProcessing) {
                void handleToggleBookmark();
          }
        });
          }
        } catch (err) {
          console.error("Error replacing button handlers:", err);
        }
      }
    }
  }, [handleToggleBookmark, isBookmarkProcessing]);

  // Update initial load to track history
  useEffect(() => {
    // Add a specific tracker for component mounting
    trackToggle("Component mounted", false);
    
    return () => {
      // Cleanup
      trackToggle("Component unmount cleanup", false);
    };
  }, []);
  
  // Add an effect to prevent any auto-toggles on page load
  useEffect(() => {
    // This is a safety check to ensure handleToggleBookmark isn't called automatically
    const originalToggleBookmark = toggleBookmark;
    
    // Log when toggleBookmark is called
    const wrappedToggleBookmark = async (...args: any[]) => {
      trackToggle(`toggleBookmark called with args: ${JSON.stringify(args)}`, false);
      return await originalToggleBookmark(...args as Parameters<typeof originalToggleBookmark>);
    };
    
    // This is just for debugging, we don't actually modify toggleBookmark
    
    return () => {
      // Cleanup
      trackToggle("Component unmount cleanup", false);
    };
  }, [toggleBookmark]);

  // Function to check if a chapter is new (less than 24 hours old)
  const isNewChapter = (chapter: any) => {
    try {
      if (!chapter || typeof chapter !== 'object') {
        return false;
      }

      // Check different possible date fields
      const dateString = chapter.added_chap_date || chapter.chapter_release || chapter.added_date || chapter.release_date || (chapter.date as string);
      if (!dateString) {
        return false;
      }
      
      let date;
      
      // Format: "23-06-2025 10:00 pm" (DD-MM-YYYY HH:MM am/pm) or "13-06-2025, 06:19 pm"
      if (typeof dateString === 'string' && (dateString.match(/^\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}\s(am|pm)$/i) || dateString.match(/^\d{2}-\d{2}-\d{4},\s\d{2}:\d{2}\s(am|pm)$/i))) {
        // Remove any comma if present
        const cleanDateStr = dateString.replace(',', '');
        const dateParts = cleanDateStr.split(' ');
        if (dateParts.length < 2) {
          return false;
        }

        // Parse date part: "23-06-2025"
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
        date = new Date(year, month, day, hour, minute);
      } else {
        // Try other date formats
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return false;
      }
      
      // Check if it's less than 24 hours old
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      return diffInHours < 24;
    } catch (error) {
      console.error("Error in isNewChapter:", error);
      return false; // Any error means it's not new
    }
  };

  // Function to calculate the proper weighted average from rating counts
  const calculateProperRating = (ratingData: any): number => {
    if (!ratingData || !ratingData.ratingCount) {
      console.log("No rating data or ratingCount found:", ratingData);
      return 0;
    }
    
    // Get the rating counts for each star level
    const counts = ratingData.ratingCount;
    console.log("Rating counts data:", counts);
    
    // Calculate weighted sum (each star value × count of ratings at that value)
    let weightedSum = 0;
    let totalCount = 0;
    
    for (let i = 1; i <= 5; i++) {
      const count = counts[i.toString()] || 0;
      console.log(`Star ${i}: count=${count}, adding ${i * 2 * count} to weighted sum`);
      weightedSum += i * 2 * count; // Multiply by 2 for 10-point scale
      totalCount += count;
    }
    
    console.log(`Total weighted sum: ${weightedSum}, Total count: ${totalCount}`);
    
    // Return the weighted average (out of 10)
    const result = totalCount > 0 ? weightedSum / totalCount : 0;
    console.log(`Final calculated rating: ${result}`);
    return result;
  };
  
  // Load manga ratings from Firebase
  useEffect(() => {
    const loadRatings = async () => {
      try {
        // Get manga average rating
        const mangaRatingsRef = doc(db, 'manga_ratings', id);
        const mangaRatingsDoc = await getDoc(mangaRatingsRef);
        
        if (mangaRatingsDoc.exists()) {
          const data = mangaRatingsDoc.data();
          
          // Calculate the proper rating from the rating counts
          const properRating = calculateProperRating(data);
          
          // Use the calculated rating instead of the stored averageRating
          console.log(`Rating data: stored=${data.averageRating}, calculated=${properRating}`);
          
          // Make sure we have valid rating data and round to 10 if very close
          let boundedRating = Math.max(0, Math.min(10, properRating));
          if (boundedRating > 9.95) boundedRating = 10;
          
          setAverageRating(boundedRating);
          // Don't set totalRatings here since it's already set in the RatingsComponent
          console.log(`Using calculated rating: ${boundedRating} based on ${data.totalRatings || 0} ratings`);
          
          // FORCE UPDATE: Always update Firebase data without any conditions
          const updates = {
            averageRating: boundedRating,
            sumOfRatings: Math.round(boundedRating * data.totalRatings)
          };
          
          console.log("FORCE UPDATING Firebase with:", updates);
          await updateDoc(mangaRatingsRef, updates);
          console.log("✅ Firebase rating data forcefully updated!");
        }
      } catch (error) {
        console.error("Error loading ratings:", error);
      }
    };
    
    // Only load if we have an ID
    if (id) {
      loadRatings();
    }
  }, [id, userData?.role]);
  
  // Load bookmark count from global bookmarks collection
  useEffect(() => {
    const loadGlobalBookmarkCount = async () => {
      if (!id) return;
      
      console.log(`Starting to load global bookmark count for manga ID: ${id}`);
      
      try {
        const bookmarkDocRef = doc(db, 'bookmarks', id);
        console.log(`Looking for bookmark document at path: bookmarks/${id}`);
        
        const bookmarkDoc = await getDoc(bookmarkDocRef);
        console.log(`Bookmark document exists: ${bookmarkDoc.exists()}`);
        
        if (bookmarkDoc.exists()) {
          const data = bookmarkDoc.data();
          console.log(`Bookmark document data:`, data);
          
          setBookmarkCount(data.userCount || 0);
          console.log(`Set bookmark count to: ${data.userCount || 0}`);
        } else {
          console.log(`No global bookmark document found for ${id}, falling back to manual count`);
          // If no global bookmark document exists, fall back to the manual count method
          countBookmarksManually();
        }
      } catch (error) {
        console.error("Error loading global bookmark count:", error);
        // On error, fall back to manual counting
        countBookmarksManually();
      }
    };
    
    // Manual counting function as a fallback
    const countBookmarksManually = async () => {
      console.log(`Starting manual bookmark count for manga ID: ${id}`);
      
      try {
        // Reference to all users' collections
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        console.log(`Found ${usersSnapshot.size} user documents to check for bookmarks`);
        
        let count = 0;
        
        // For each user, check their bookmarks collection
        for (const userDoc of usersSnapshot.docs) {
          const userBookmarksRef = collection(db, `users/${userDoc.id}/bookmarks`);
          const userBookmarksQuery = query(userBookmarksRef, where("mangaId", "==", id));
          const bookmarksSnapshot = await getDocs(userBookmarksQuery);
          
          // Add the count of bookmarks for this manga
          if (bookmarksSnapshot.size > 0) {
            console.log(`User ${userDoc.id} has bookmarked this manga`);
          }
          count += bookmarksSnapshot.size;
        }
        
        console.log(`Manually found ${count} bookmarks for manga ${id}`);
        setBookmarkCount(count);
      } catch (error) {
        console.error("Error manually counting bookmarks:", error);
        // Set to 0 as a fallback
        setBookmarkCount(0);
      }
    };
    
    // Only load if we have an ID
    if (id) {
      loadGlobalBookmarkCount();
    }
  }, [id]);



  return (
    <div className="min-h-screen bg-[#0a0a12] text-white relative pb-20">
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        onSuccess={async () => {
          setShowLoginModal(false);
          return Promise.resolve();
        }}
      />

      {/* Ultra-modern Game-inspired Hero Banner */}
      <div className="absolute top-0 left-0 right-0 h-[85vh] z-0 overflow-hidden">
        {banner ? (
          <div className="relative w-full h-full">
            <Image 
              src={banner}
              alt={title}
              fill
              className="object-cover object-center opacity-60"
              unoptimized={true}
              priority={true}
            />
            {/* Complex overlay gradients for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a12]/30 via-[#0a0a12]/70 to-[#0a0a12]"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a12]/90 via-[#0a0a12]/40 to-[#0a0a12]/90"></div>
            
            {/* Neon grid overlay */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5 mix-blend-soft-light"></div>
            
            {/* Animated particle overlay for visual depth */}
            <div className="absolute inset-0 overflow-hidden opacity-30">
              <div className="absolute top-[10%] left-[5%] w-1 h-1 rounded-full bg-purple-400/80 animate-pulse-slow drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
              <div className="absolute top-[30%] left-[15%] w-1.5 h-1.5 rounded-full bg-pink-400/60 animate-pulse-slow delay-300 drop-shadow-[0_0_8px_rgba(219,39,119,0.8)]"></div>
              <div className="absolute top-[15%] left-[25%] w-1 h-1 rounded-full bg-cyan-400/70 animate-pulse-slow delay-700 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
              <div className="absolute top-[25%] left-[40%] w-2 h-2 rounded-full bg-purple-400/50 animate-pulse-slow delay-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
              <div className="absolute top-[10%] left-[65%] w-1 h-1 rounded-full bg-pink-400/70 animate-pulse-slow delay-200 drop-shadow-[0_0_8px_rgba(219,39,119,0.8)]"></div>
              <div className="absolute top-[20%] left-[75%] w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-pulse-slow delay-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
              <div className="absolute top-[30%] left-[85%] w-1 h-1 rounded-full bg-purple-400/80 animate-pulse-slow delay-600 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/30 via-[#0a0a12] to-slate-900/30">
            <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5 mix-blend-overlay"></div>
          </div>
        )}
      </div>

      {/* Navigation and top controls with glassmorphism */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a12]/80 border-b border-purple-500/10 shadow-[0_4px_30px_rgba(168,85,247,0.1)]">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/90 hover:text-purple-400 transition-all duration-300 group cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleShare}
              className="text-white/80 hover:text-cyan-400 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/5 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 container mx-auto px-4 pt-20 lg:pt-32 pb-8">
        {/* Game-style Layout with Side-by-side Panels */}
        <div className="flex flex-col lg:flex-row gap-8 relative z-20">
          {/* Left Panel - Cover Art with Glow Effect */}
          <div className="w-full lg:w-[380px] flex-shrink-0 relative">
            <div className="sticky top-24 space-y-6">
              {/* Cover Art with Neon Glow */}
              <div className="aspect-[3/4] w-full relative rounded-2xl overflow-hidden 
                group ring-1 ring-purple-500/20 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
                <Image 
                  src={cover || "/fallback-image.png"} 
                  alt={title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 380px"
                  unoptimized={true}
                  priority={true}
                />
                
                {/* Overlay with shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12]/90 via-transparent to-[#0a0a12]/30"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700
                  bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
                  
                {/* Game-style border frame */}
                <div className="absolute inset-0 border-2 border-purple-500/0 group-hover:border-purple-500/20 transition-all duration-500
                  shadow-[inset_0px_0px_30px_rgba(168,85,247,0.2)]"></div>
                
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-purple-400/50"></div>
                <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-purple-400/50"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-purple-400/50"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-purple-400/50"></div>
              </div>
              
              {/* Game-style Info Panel */}
              <div className="bg-[#12121a]/80 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/10 
                shadow-[0_8px_30px_rgba(0,0,0,0.3)] relative overflow-hidden">
                {/* Background grid pattern */}
                <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5"></div>
                
                {/* Linear glow accent on top */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r 
                  from-purple-500/0 via-purple-500/50 to-purple-500/0"></div>
                
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${status === 'ONGOING' ? 'bg-green-400' : 'bg-amber-400'} 
                      ${status === 'ONGOING' ? 'shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'shadow-[0_0_10px_rgba(251,191,36,0.5)]'} 
                      animate-pulse`}></div>
                    <span className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                      {status}
                    </span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-slate-800/80 text-xs font-medium text-white/70 border border-white/5">
                    {formatDate(published) !== "N/A" ? formatDate(published) : "N/A"}
                  </div>
                </div>
                
                {/* Action Buttons - Library & Reading */}
                <div className="space-y-3 mb-6">
                  {/* Add to Library Button */}
                  <AnimatePresence mode="wait">
                    <motion.button 
                      id="add-library-btn"
                      onClick={() => {
                        console.log("EXPLICIT USER CLICK: Add to Library button clicked");
                        handleToggleBookmark();
                      }}
                      onMouseEnter={() => setIsButtonHovered(true)}
                      onMouseLeave={() => setIsButtonHovered(false)}
                      disabled={isBookmarkProcessing}
                      className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-500 
                        relative overflow-hidden ${isBookmarkProcessing ? 'opacity-80 cursor-not-allowed' : ''}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      whileHover={{ scale: isBookmarkProcessing ? 1 : 1.02 }}
                      whileTap={{ scale: isBookmarkProcessing ? 1 : 0.98 }}
                      style={{
                        background: bookmarkStatus 
                          ? 'linear-gradient(135deg, rgb(147, 51, 234, 0.9) 0%, rgb(139, 92, 246, 0.9) 100%)' 
                          : 'linear-gradient(135deg, rgba(15, 15, 25, 0.5) 0%, rgba(30, 30, 45, 0.5) 100%)',
                        border: bookmarkStatus 
                          ? '1px solid rgba(168, 85, 247, 0.4)'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: bookmarkStatus 
                          ? '0 8px 32px rgba(139, 92, 246, 0.3)' 
                          : 'none'
                      }}
                    >
                      {/* Animated ripple effect */}
                      {isButtonHovered && !isBookmarkProcessing && (
                        <motion.div 
                          className="absolute inset-0 bg-white/5"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      
                      <motion.div
                        animate={{ 
                          rotate: bookmarkStatus ? [0, -10, 0] : 0,
                          scale: bookmarkStatus && !isBookmarkProcessing ? [1, 1.2, 1] : 1
                        }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="relative z-10"
                      >
                        {isBookmarkProcessing ? (
                          <svg className="animate-spin -ml-1 mr-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : bookmarkStatus ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                            <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                          </svg>
                        )}
                      </motion.div>
                      <motion.span 
                        className="font-medium text-base relative z-10"
                        animate={{ 
                          opacity: [1, 0, 1],
                          y: bookmarkStatus && !isBookmarkProcessing ? [0, -10, 0] : 0
                        }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      >
                        {isBookmarkProcessing 
                          ? 'Processing...' 
                          : bookmarkStatus 
                            ? 'Added to Library' 
                            : 'Add to Library'
                        }
                      </motion.span>
                    </motion.button>
                  </AnimatePresence>
                  
                  {/* Start/Continue Reading Button */}
                  {lastReadChapter ? (
                    <Link 
                      href={`/read/${id}-ch${lastReadChapter}`}
                      className="w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 
                        bg-gradient-to-br from-purple-600/90 to-fuchsia-600/90 
                        hover:from-purple-500/90 hover:to-fuchsia-500/90
                        font-medium shadow-lg shadow-purple-900/30 
                        relative overflow-hidden group transition-all duration-300
                        border border-purple-500/30"
                    >
                      {/* Animated glow effect */}
                      <div className="absolute inset-0 w-full h-full">
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                          bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.4)_0%,rgba(0,0,0,0)_50%)]"></div>
                      </div>
                      
                      {/* Animated ripple effect on hover */}
                      <div className="absolute top-0 left-0 right-0 h-full w-[120%] -translate-x-full group-hover:translate-x-full 
                        bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-700 ease-in-out"></div>
                      
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" 
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300 relative z-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                      <span className="text-base font-medium tracking-wide relative z-10">Continue Reading</span>
                    </Link>
                  ) : chapters.length > 0 && (
                    <Link 
                      href={`/read/${chapters[0].chapter_slug || `${id}-ch${chapters[0].number}`}`}
                      className="w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 
                        bg-gradient-to-br from-pink-600/90 to-purple-600/90 
                        hover:from-pink-500/90 hover:to-purple-500/90
                        font-medium shadow-lg shadow-pink-900/30 
                        relative overflow-hidden group transition-all duration-300
                        border border-pink-500/30"
                    >
                      {/* Animated glow effect */}
                      <div className="absolute inset-0 w-full h-full">
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                          bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.4)_0%,rgba(0,0,0,0)_50%)]"></div>
                      </div>
                      
                      {/* Animated ripple effect on hover */}
                      <div className="absolute top-0 left-0 right-0 h-full w-[120%] -translate-x-full group-hover:translate-x-full 
                        bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-700 ease-in-out"></div>
                      
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" 
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300 relative z-10">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.715 1.295 2.567 0 3.283L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                      </svg>
                      <span className="text-base font-medium tracking-wide relative z-10">Start Reading</span>
                    </Link>
                  )}
                </div>
                
                {/* Content Rating & Genre Tags */}
                <div className="space-y-5">
                  {/* Content Rating Tags */}
                  <div>
                    <h4 className="text-sm font-medium text-white/70 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-pink-400">
                        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                      </svg>
                      Content Rating
                    </h4>
                    
                    {/* New card-style content rating display */}
                    <div className="bg-gradient-to-r from-[#151520]/80 to-[#1a1a25]/80 rounded-xl border border-purple-500/20 overflow-hidden">
                      {/* Top colored bar based on content type */}
                      <div className={`h-1 w-full ${
                        isPornhwa() ? 
                        "bg-gradient-to-r from-pink-500 to-rose-500" : 
                        isMangaManhwaManhua() ?
                        "bg-gradient-to-r from-green-500 to-emerald-500" :
                        "bg-gradient-to-r from-purple-500 to-pink-500"}`}>
                      </div>
                      
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Rating icon/badge */}
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            isPornhwa() ? 
                            "bg-pink-500/20 border border-pink-500/30" : 
                            isMangaManhwaManhua() ?
                            "bg-green-500/20 border border-green-500/30" :
                            "bg-purple-500/20 border border-purple-500/30"
                          }`}>
                            <span className="text-lg font-bold">
                              {isPornhwa() ? "18+" : isMangaManhwaManhua() ? "15+" : "19+"}
                            </span>
                          </div>
                          
                          {/* Rating text */}
                          <div>
                            <span className={`font-semibold ${
                              isPornhwa() ? "text-pink-300" : 
                              isMangaManhwaManhua() ? "text-green-300" :
                              "text-purple-300"
                            }`}>
                              {isPornhwa() ? "PORNHWA" : isMangaManhwaManhua() ? "SFW" : "R-19"}
                            </span>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {isPornhwa() ? 
                                "Adult content with explicit scenes" : 
                                isMangaManhwaManhua() ?
                                "Content suitable for ages 15 and up" :
                                "Mature content, 19+ recommended"}
                            </p>
                          </div>
                        </div>
                        
                        {/* Visual indicator */}
                        <div className={`w-3 h-3 rounded-full ${
                          isPornhwa() ? 
                          "bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]" : 
                          isMangaManhwaManhua() ?
                          "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" :
                          "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                        } animate-pulse`}>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Genre Tags */}
                  {genreList.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-white/70 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-purple-400">
                          <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                        </svg>
                        Genres
                      </h4>
                                              <div className="flex flex-wrap gap-2">
                          {genreList.map((genre, index) => (
                            <div 
                              key={index} 
                              className="relative"
                                                             onClick={() => {
                                 console.log("Genre div clicked:", genre);
                                 window.location.href = `/tag/${encodeURIComponent(genre.toLowerCase())}`;
                               }}
                            >
                              <div
                                className="px-3 py-1 bg-gray-800/80 rounded-lg text-xs font-medium text-gray-300 border border-gray-700
                                 hover:bg-purple-600/60 hover:text-white hover:border-purple-500/50 transition-all duration-300
                                 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer select-none touch-manipulation"
                                style={{ touchAction: 'manipulation' }}
                              >
                                {genre}
                              </div>
                                                             <a 
                                 href={`/tag/${encodeURIComponent(genre.toLowerCase())}`}
                                 className="absolute inset-0" 
                                 aria-label={`View ${genre} tag`}
                              >
                                <span className="sr-only">View {genre} tag</span>
                              </a>
                            </div>
                          ))}
                        </div>
                    </div>
                  )}
                </div>
                
                {/* Stats Row */}
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {/* Rating Stat */}
                  <div className="bg-gradient-to-br from-[#16161f] to-[#0e0e14] rounded-xl p-3 text-center border border-white/5">
                    <div className="text-lg font-bold text-amber-400 flex justify-center items-center gap-1">
                      {/* Display Firebase rating or fall back to API rating with proper type handling */}
                      {averageRating !== null && averageRating !== undefined ? 
                        (averageRating > 9.95 ? "10.0" : Number(averageRating).toFixed(1)) : 
                        (rating && rating !== "N/A" ? 
                          (typeof rating === "string" ? 
                            (isNaN(parseFloat(rating)) ? "N/A" : parseFloat(rating).toFixed(1)) : 
                            "N/A") : 
                          "N/A")}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-xs text-white/50 mt-1">Rating</div>
                  </div>
                  
                  {/* Chapters Stat */}
                  <div className="bg-gradient-to-br from-[#16161f] to-[#0e0e14] rounded-xl p-3 text-center border border-white/5">
                    <div className="text-lg font-bold text-cyan-400">{chapters.length}</div>
                    <div className="text-xs text-white/50 mt-1">Chapters</div>
                  </div>
                  
                  {/* Bookmarks Stat */}
                  <div className="bg-gradient-to-br from-[#16161f] to-[#0e0e14] rounded-xl p-3 text-center border border-white/5">
                    <div className="text-lg font-bold text-pink-400">
                      {/* Display Firebase bookmark count or fall back to API bookmark count */}
                      {bookmarkCount !== null && bookmarkCount !== undefined ? 
                        bookmarkCount : 
                        (typeof bookmark_users === "number" ? 
                          bookmark_users : 
                          0)}
                    </div>
                    <div className="text-xs text-white/50 mt-1">Bookmarks</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Panel - Title, Description, Info */}
          <div className="flex-1">
            {/* Manga Title and Type */}
            <div className="mb-8">
              <div className="flex items-center gap-3 text-sm text-white/70 mb-2">
                <span className="uppercase px-3 py-1.5 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg 
                  font-semibold tracking-wider border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  {type}
                </span>
                <span className="text-white/60">By <span className="text-purple-300">{author}</span></span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight text-transparent bg-clip-text 
                bg-gradient-to-r from-white to-white/80">
                {title}
              </h1>
            </div>
            
            {/* Game-style Synopsis Panel */}
            <div className="bg-gradient-to-br from-[#12121a]/80 to-[#0a0a12]/80 backdrop-blur-xl 
              rounded-2xl p-6 border border-purple-500/10 shadow-lg mb-10 relative overflow-hidden group">
              
              {/* Background effects */}
              <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5"></div>
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r 
                from-purple-500/0 via-purple-500/30 to-purple-500/0"></div>
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r 
                from-purple-500/0 via-pink-500/30 to-purple-500/0"></div>
                
              {/* Corner accents - subtle game UI style */}
              <div className="absolute top-0 left-0 w-12 h-[2px] bg-gradient-to-r from-purple-500/50 to-purple-500/0"></div>
              <div className="absolute top-0 left-0 h-12 w-[2px] bg-gradient-to-b from-purple-500/50 to-purple-500/0"></div>
              <div className="absolute top-0 right-0 w-12 h-[2px] bg-gradient-to-l from-purple-500/50 to-purple-500/0"></div>
              <div className="absolute top-0 right-0 h-12 w-[2px] bg-gradient-to-b from-purple-500/50 to-purple-500/0"></div>
              <div className="absolute bottom-0 left-0 w-12 h-[2px] bg-gradient-to-r from-purple-500/50 to-purple-500/0"></div>
              <div className="absolute bottom-0 left-0 h-12 w-[2px] bg-gradient-to-t from-purple-500/50 to-purple-500/0"></div>
              <div className="absolute bottom-0 right-0 w-12 h-[2px] bg-gradient-to-l from-purple-500/50 to-purple-500/0"></div>
              <div className="absolute bottom-0 right-0 h-12 w-[2px] bg-gradient-to-t from-purple-500/50 to-purple-500/0"></div>
              
              {/* Heading with icon */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 
                  flex items-center justify-center border border-purple-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" 
                    className="w-4 h-4 text-purple-400">
                    <path fillRule="evenodd" 
                      d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v11.75A2.75 2.75 0 0016.75 18h-12A2.75 2.75 0 012 15.25V3.5zm3.75 7a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zm0 3a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zM5 5.75A.75.75 0 015.75 5h4.5a.75.75 0 01.75.75v2.5a.75.75 0 01-.75.75h-4.5A.75.75 0 015 8.25v-2.5z" 
                      clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">Synopsis</h3>
              </div>
              
              {/* Description with fancy expand/collapse */}
              <div className={`relative ${!isExpanded && 'max-h-[4.5rem] overflow-hidden'}`}>
                <p className="text-white/80 leading-relaxed">{description}</p>
                
                {/* Gradient fade at bottom when collapsed */}
                {!isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0f0f17] to-transparent"></div>
                )}
              </div>
              
              {description && description.length > 100 && (
                <button 
                  onClick={toggleExpand}
                  className="mt-4 text-purple-400 hover:text-pink-400 font-medium text-sm flex items-center gap-1.5 transition-all duration-300 group/btn relative z-10 py-1.5"
                >
                  {isExpanded ? (
                    <>
                      <span>Show Less</span>
                      <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center 
                        group-hover/btn:bg-purple-500/20 transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </div>
                    </>
                  ) : (
                    <>
                      <span>Read More</span>
                      <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center 
                        group-hover/btn:bg-purple-500/20 transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </>
                  )}
                </button>
              )}
            </div>
            
            {/* Rating Component */}
            <div className="mb-10">
              <RatingsComponent mangaId={id} initialRating={rating ? parseInt(rating) / 2 : 0} />
              
              {/* Community Cards in Vertical Layout */}
              <div className="mt-6 hidden md:block">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" 
                    className="w-5 h-5 text-purple-400">
                    <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                  </svg>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Join Our Socials</span>
                </h3>
                <div className="flex flex-col gap-3">
                  {/* Discord Card - Make fully clickable */}
                  {socialLinks.discord && (
                    <a 
                      href={socialLinks.discord}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group bg-gradient-to-br from-[#16161f]/80 to-[#12121a]/80 backdrop-blur-xl 
                      rounded-xl overflow-hidden border border-purple-500/10 relative 
                      hover:border-indigo-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all duration-300
                        hover:-translate-y-1 cursor-pointer"
                    >
                      {/* Accent bar */}
                      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 to-purple-500"></div>
                      
                      <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 
                            flex items-center justify-center border border-indigo-500/20">
                            <svg className="w-6 h-6 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor">
                              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">Discord</h3>
                            <p className="text-sm text-gray-400">Join community</p>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 
                            flex items-center justify-center text-white 
                            shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 
                          transition-all duration-300 group-hover:scale-110">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                      </div>
                    </div>
                    </a>
                  )}
                  
                  {/* Share Card - Make fully clickable */}
                  <button 
                    onClick={handleShare}
                    className="group bg-gradient-to-br from-[#16161f]/80 to-[#12121a]/80 backdrop-blur-xl 
                      rounded-xl overflow-hidden border border-purple-500/10 relative w-full text-left
                    hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300
                      hover:-translate-y-1 cursor-pointer"
                  >
                    {/* Accent bar */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-cyan-500"></div>
                    
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400/20 to-cyan-500/20 
                          flex items-center justify-center border border-blue-500/20">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} 
                            stroke="currentColor" className="w-6 h-6 text-blue-400">
                            <path strokeLinecap="round" strokeLinejoin="round" 
                              d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">Share Medusa</h3>
                          <p className="text-sm text-gray-400">Share with friends</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 
                          flex items-center justify-center text-white 
                          shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 
                        transition-all duration-300 group-hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                  </div>
                  </button>
                  
                  {/* Donate Card - Make fully clickable */}
                  {socialLinks.kofi && (
                    <a 
                      href={socialLinks.kofi}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group bg-gradient-to-br from-[#16161f]/80 to-[#12121a]/80 backdrop-blur-xl 
                      rounded-xl overflow-hidden border border-purple-500/10 relative 
                      hover:border-pink-500/30 hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition-all duration-300
                        hover:-translate-y-1 cursor-pointer"
                    >
                      {/* Accent bar */}
                      <div className="h-1.5 w-full bg-gradient-to-r from-pink-400 to-rose-500"></div>
                      
                      <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400/20 to-rose-500/20 
                            flex items-center justify-center border border-pink-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} 
                              stroke="currentColor" className="w-6 h-6 text-pink-400">
                              <path strokeLinecap="round" strokeLinejoin="round" 
                                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white group-hover:text-pink-300 transition-colors">Donate Us</h3>
                            <p className="text-sm text-gray-400">Support our work</p>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 
                            flex items-center justify-center text-white 
                            shadow-lg shadow-pink-500/20 group-hover:shadow-pink-500/40 
                          transition-all duration-300 group-hover:scale-110">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                      </div>
                    </div>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Game-style Chapter List Section - Now full width */}
        <div className="w-full mt-10">
          <div className="bg-gradient-to-br from-[#12121a]/90 to-[#080810]/90 backdrop-blur-xl 
            rounded-2xl overflow-hidden border border-purple-500/10 shadow-[0_10px_50px_rgba(0,0,0,0.5)]">
            <div className="border-b border-purple-500/10 py-5 px-6 flex flex-col sm:flex-row 
              justify-between items-start sm:items-center gap-5 relative">
              
              {/* Glow effects */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-32 -left-20 w-72 h-72 bg-pink-600/10 rounded-full blur-3xl"></div>
              
              {/* Chapter header with game-style icon */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 
                  flex items-center justify-center border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} 
                    stroke="currentColor" className="w-5 h-5 text-purple-400">
                    <path strokeLinecap="round" strokeLinejoin="round" 
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Chapters</span>
                  <span className="ml-2 text-base font-normal text-white/60">({chapters.length})</span>
                </h2>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                {/* Search with glow effect */}
                <div className="relative flex-grow sm:flex-grow-0">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} 
                      stroke="currentColor" className="w-5 h-5 text-purple-400">
                      <path strokeLinecap="round" strokeLinejoin="round" 
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chapters..."
                    className="w-full sm:w-64 bg-[#16161f] text-white pl-10 pr-4 py-3 rounded-xl 
                      focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-purple-500/10
                      shadow-[0_0_15px_rgba(168,85,247,0.1)] placeholder-white/30"
                  />
                </div>
                
                {/* Sort toggle - completely rebuilt for full clickability */}
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSortOrder();
                  }}
                  className="relative w-full sm:w-auto py-3 px-5 bg-gradient-to-r from-[#16161f] to-[#0e0e14] 
                    text-white rounded-xl cursor-pointer border border-purple-500/10
                    hover:from-[#1a1a23] hover:to-[#12121a] hover:border-purple-500/20
                    transition-all duration-300 z-10 pointer-events-auto select-none"
                  style={{ touchAction: 'manipulation' }}
                >
                  <div className="flex items-center justify-center gap-2">
                    {sortOrder === "asc" ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} 
                          stroke="currentColor" className="w-5 h-5 text-purple-400 group-hover:text-pink-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
                        </svg>
                        <span className="whitespace-nowrap">Oldest First</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} 
                          stroke="currentColor" className="w-5 h-5 text-purple-400 group-hover:text-pink-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L9 17.25m4.5-15v12" />
                        </svg>
                        <span className="whitespace-nowrap">Newest First</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
            
            {/* Game-style chapter showcase - REMOVED */}
            <div className="p-6">
              {/* Chapter Grid with enhanced game-style cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedChapters.length > 0 ? (
                  sortedChapters.slice(0, visibleChapters).map((chapter, index) => (
                    <Link 
                      key={index} 
                      href={`/read/${chapter.chapter_slug || `${id}-ch${chapter.number}`}`}
                    >
                      <div className="group bg-gradient-to-br from-[#16161f]/50 to-[#0c0c14]/50 backdrop-blur-xl 
                        rounded-xl overflow-hidden border border-white/5 shadow-lg 
                        hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] transition-all duration-300 
                        hover:-translate-y-1 h-full hover:border-purple-500/30">
                        <div className="p-5 flex items-center gap-4">
                          {/* Chapter thumbnail with enhanced effects - now uses chapter thumbnail if available */}
                          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-black/20 flex-shrink-0 relative">
                            <div className="w-full h-full relative">
                              <Image 
                                src={chapter.thumbnail || cover} 
                                alt={`Chapter ${chapter.number}`} 
                                width={80} 
                                height={80}
                                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                unoptimized={true}
                                onError={() => {
                                  console.log(`Failed to load thumbnail for chapter ${chapter.number}, falling back to cover`);
                                }}
                              />
                              {/* For debugging - log the thumbnail URL */}
                              {(() => {
                                console.log(`Chapter ${chapter.number} thumbnail: ${chapter.thumbnail || 'using cover fallback'}`);
                                return null;
                              })()}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                              
                              {/* Animated glow overlay on hover */}
                              <div className="absolute inset-0 bg-gradient-to-t from-purple-500/30 to-pink-500/0 
                                opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                              
                              {/* Lock overlay for locked chapters */}
                              {chapter.isLocked && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="text-white w-6 h-6">
                                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd"></path>
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1">
                                Chapter {chapter.number}
                                {isNewChapter(chapter) && (
                                  <span className="flex items-center gap-0.5">
                                    <svg 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      width="14" 
                                      height="14" 
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
                                    <span className="text-red-500 text-[10px] font-medium">New</span>
                                  </span>
                                )}
                              </h3>
                              
                              <div className="flex items-center gap-2">
                              {/* Lock/Unlock indicator */}
                              {chapter.isLocked ? (
                                chapter.isPurchased && chapter.showUnlockIcon ? (
                                  <div className="bg-green-500/20 text-green-300 text-xs px-3 py-1 rounded-full flex items-center border border-green-500/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" data-slot="icon" className="h-3 w-3 text-green-500">
                                      <path fillRule="evenodd" d="M14.5 1A4.5 4.5 0 0 0 10 5.5V9H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1.5V5.5a3 3 0 1 1 6 0v2.75a.75.75 0 0 0 1.5 0V5.5A4.5 4.5 0 0 0 14.5 1Z" clipRule="evenodd"></path>
                                    </svg>
                                  </div>
                                ) : (
                                    <div className="bg-yellow-500/20 text-yellow-300 text-xs px-3 py-1 rounded-full flex items-center shadow-md shadow-yellow-900/20 border border-yellow-500/30">
                                      <Image 
                                        src="/Assets/coins_1.png" 
                                        width={14} 
                                        height={14} 
                                        alt="Coin" 
                                        className="mr-1"
                                      />
                                      <span>{chapter.coinAmount || 1}</span>
                                  </div>
                                )
                              ) : chapter.isPurchased && chapter.showUnlockIcon ? (
                                <div className="bg-green-500/20 text-green-300 text-xs px-3 py-1 rounded-full flex items-center border border-green-500/30">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" data-slot="icon" className="h-3 w-3 text-green-500">
                                    <path fillRule="evenodd" d="M14.5 1A4.5 4.5 0 0 0 10 5.5V9H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1.5V5.5a3 3 0 1 1 6 0v2.75a.75.75 0 0 0 1.5 0V5.5A4.5 4.5 0 0 0 14.5 1Z" clipRule="evenodd"></path>
                                  </svg>
                                </div>
                              ) : null}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <p className="text-white/60 text-xs">
                                {/* Add debugging */}
                                {(() => {
                                  const releaseDate = chapter.chapter_release || chapter.added_chap_date || chapter.added_date || chapter.release_date || (chapter.date as string) || null;
                                  console.log(`Chapter ${chapter.number} date fields:`, {
                                    chapter_release: chapter.chapter_release,
                                    added_chap_date: chapter.added_chap_date,
                                    added_date: chapter.added_date,
                                    release_date: chapter.release_date,
                                    date: chapter.date,
                                    final_used: releaseDate
                                  });
                                  return formatDate(releaseDate || "N/A");
                                })()}
                              </p>
                              

                              
                              {/* Remove the animated arrow button indicator */}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : searchQuery ? (
                  <div className="col-span-3 bg-gradient-to-br from-[#16161f]/50 to-[#0c0c14]/50 backdrop-blur-xl 
                    rounded-xl p-8 text-center border border-purple-500/10 shadow-lg">
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="text-gray-400">No chapters found matching &quot;{searchQuery}&quot;.</p>
                  </div>
                ) : (
                  <div className="col-span-3 bg-gradient-to-br from-[#16161f]/50 to-[#0c0c14]/50 backdrop-blur-xl 
                    rounded-xl p-8 text-center border border-purple-500/10 shadow-lg">
                    <div className="text-5xl mb-4">📚</div>
                    <p className="text-gray-400">No chapters available yet.</p>
                  </div>
                )}
              </div>
              
              {/* Load More Button with game-style design */}
              {sortedChapters.length > 9 && (
                <div className="flex justify-center mt-10">
                  <button 
                    onClick={() => {
                      if (visibleChapters === 9) {
                        setVisibleChapters(sortedChapters.length); // Show all chapters
                      } else {
                        setVisibleChapters(9); // Reset to show only 9 chapters
                      }
                    }}
                    className="px-8 py-3.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 
                      hover:from-purple-500/20 hover:to-pink-500/20 backdrop-blur-md rounded-xl text-sm 
                      transition-all duration-300 flex items-center gap-2.5 border border-purple-500/20 
                      shadow-lg hover:shadow-[0_5px_30px_rgba(168,85,247,0.15)] group
                      hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} 
                      stroke="currentColor" className="w-5 h-5 text-purple-400 group-hover:text-pink-400 transition-colors">
                      {visibleChapters > 9 ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      )}
                    </svg>
                    <span className="group-hover:text-pink-400 transition-colors">
                      {visibleChapters > 9 ? "Show Less" : "Load More"}
                    </span>
                  </button>
                </div>
              )}
              
              {/* Ad slot after chapter list */}
              <div className="mt-8">
                <Content1 />
              </div>
            </div>
          </div>
        </div>
        
        {/* Comments Section - Styled as a game social hub - Now full width */}
        <div className="w-full mt-16 mb-10">
          <div className="bg-gradient-to-br from-[#12121a]/90 to-[#080810]/90 backdrop-blur-xl 
            rounded-2xl overflow-hidden border border-purple-500/10 shadow-[0_10px_50px_rgba(0,0,0,0.5)] relative">
            
            {/* Background effects */}
            <div className="absolute -top-20 right-20 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-pink-600/5 rounded-full blur-3xl"></div>
            
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 
                  flex items-center justify-center border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} 
                    stroke="currentColor" className="w-5 h-5 text-purple-400">
                    <path strokeLinecap="round" strokeLinejoin="round" 
                      d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    Discussion
                  </span>
                </h2>
              </div>
              
              <MangaDetailsDisqus id={id} title={title} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-white/40 text-sm">
          © {new Date().getFullYear()} Medusa Scans. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default NewDetails;