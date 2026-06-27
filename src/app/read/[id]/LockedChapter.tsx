"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "@/lib/router-events";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface LockedChapterProps {
  chapterNumber: number;
  title: string;
  mangaId: string;
  mangaTitle: string;
  unlockTime: string;
  id: string;
  onPurchase: () => Promise<boolean>;
  coinAmount?: number; // Number of coins required to unlock
  isManualLock?: boolean; // Whether the chapter is manually locked
}

const LockedChapter = ({
  chapterNumber,
  title,
  mangaId,
  mangaTitle,
  unlockTime,
  id,
  onPurchase,
  coinAmount = 20, // Default to 20 if not provided
  isManualLock = false, // Default to false if not provided
}: LockedChapterProps) => {
  const router = useRouter();
  const { user, userData, refreshUserData } = useAuth();
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [actualCoinAmount, setActualCoinAmount] = useState(coinAmount);
  const [actualUnlockTime, setActualUnlockTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManuallyLocked, setIsManuallyLocked] = useState(isManualLock);

  // Debug the input unlockTime
  useEffect(() => {
    console.log("Initial unlockTime received:", unlockTime);
  }, [unlockTime]);

  // Check Firebase for more accurate data
  useEffect(() => {
    const fetchLockedChapterData = async () => {
      setIsLoading(true);
      try {
        console.log(`Fetching locked chapter data for ID: ${id}`);
        
        // Use the provided unlockTime as initial value
        if (unlockTime) {
          console.log("Using provided unlockTime:", unlockTime);
          setActualUnlockTime(unlockTime);
        }
        
        // Try to fetch from Firebase for the most accurate data
        // First try by direct ID, then try query by mangaId and chapterNumber
        let lockData = null;
        
        // Method 1: Try direct document lookup
        const lockDocRef = doc(db, "locked_chapters", id);
        let lockDocSnap = await getDoc(lockDocRef);
        
        // Method 2: Try with standardized format if not found
        if (!lockDocSnap.exists()) {
          console.log(`No document found with ID ${id}, trying with standard format`);
          const standardId = `${mangaId}-ch${chapterNumber}`;
          const lockDocRef2 = doc(db, "locked_chapters", standardId);
          lockDocSnap = await getDoc(lockDocRef2);
        }
        
        // Method 3: Try with query if still not found
        if (!lockDocSnap.exists()) {
          console.log("Trying with query by mangaId and chapterNumber");
          const lockedChaptersRef = collection(db, "locked_chapters");
          const q = query(
            lockedChaptersRef,
            where("mangaId", "==", mangaId),
            where("chapterNumber", "==", chapterNumber)
          );
          
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            lockData = querySnapshot.docs[0].data();
            console.log("Found data via query:", lockData);
          }
        } else {
          lockData = lockDocSnap.data();
          console.log("Found data via direct lookup:", lockData);
        }
        
        if (lockData) {
          console.log("LockedChapter - Firebase data found:", lockData);
          
          // Update coin amount if available
          if (lockData.coinAmount) {
            console.log(`Setting coin amount to ${lockData.coinAmount}`);
            setActualCoinAmount(lockData.coinAmount);
          }
          
          // Check if chapter is manually locked
          if (lockData.isManualLock !== undefined) {
            console.log(`Chapter is manually locked: ${lockData.isManualLock}`);
            setIsManuallyLocked(lockData.isManualLock);
          }
          
          // Get the unlocksAt time from Firebase
          if (lockData.unlocksAt) {
            let unlockDate;
            
            if (typeof lockData.unlocksAt.toDate === 'function') {
              // Firebase Timestamp object
              unlockDate = lockData.unlocksAt.toDate();
            } else {
              // String or Date format
              unlockDate = new Date(lockData.unlocksAt);
            }
            
            console.log("Firebase unlocksAt date:", unlockDate);
            setActualUnlockTime(unlockDate.toISOString());
          }
        } else {
          console.log("No locked chapter data found in Firebase, using provided unlockTime");
        }
      } catch (error) {
        console.error("Error fetching locked chapter data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLockedChapterData();
  }, [id, mangaId, chapterNumber, unlockTime, isManualLock]);

  // Calculate time left until unlock
  useEffect(() => {
    // Skip countdown if manually locked or no unlock time available
    if (isManuallyLocked || !actualUnlockTime) {
      console.log("Skipping countdown - Manual lock:", isManuallyLocked, "or no actualUnlockTime available");
      return;
    }
    
    console.log("Starting countdown with unlock time:", actualUnlockTime);
    
    const calculateTimeLeft = () => {
      try {
        const now = new Date();
        const target = new Date(actualUnlockTime);
        
        // Log date values for debugging
        console.log("COUNTDOWN - Now:", now.toISOString());
        console.log("COUNTDOWN - Target:", target.toISOString());
        
        // Validate the actualUnlockTime is a valid date
        if (isNaN(target.getTime())) {
          console.error("Invalid date from actualUnlockTime:", actualUnlockTime);
          // Use the current time plus 1 day as a fallback
          const fallbackDate = new Date();
          fallbackDate.setDate(fallbackDate.getDate() + 1); 
          return {
            days: 1,
            hours: 0,
            minutes: 0,
            seconds: 0
          };
        }
        
        const difference = target.getTime() - now.getTime();
        console.log(`COUNTDOWN - Time difference in ms: ${difference}`);
        
        // If the unlock time has passed, show zeros
        if (difference <= 0) {
          console.log("COUNTDOWN - Unlock time has passed");
          return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
          };
        }
        
        // Calculate components
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        // Log countdown components
        console.log(`COUNTDOWN - Components: ${days}d ${hours}h ${minutes}m ${seconds}s`);
        
        return {
          days: days,
          hours: hours, 
          minutes: minutes,
          seconds: seconds
        };
      } catch (error) {
        console.error("Error calculating time left:", error);
        // Return 0 as a fallback
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
    };

    // Calculate immediately when actualUnlockTime changes
    const initialTimeLeft = calculateTimeLeft();
    setTimeLeft(initialTimeLeft);
    
    console.log("Initial time left set to:", initialTimeLeft);

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [actualUnlockTime, isManuallyLocked]);

  const handlePurchase = async () => {
    if (!user) {
      router.push("/auth");
      return;
    }

    setIsPurchasing(true);
    try {
      const success = await onPurchase();
      if (success) {
        await refreshUserData();
        router.refresh();
      }
    } catch (error) {
      console.error("Error purchasing chapter:", error);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#07080f] overflow-hidden px-4 py-6">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#FF7F57] rounded-full mix-blend-overlay filter blur-[100px] opacity-30"
          animate={{ 
            x: [0, 50, 0], 
            y: [0, 30, 0],
            opacity: [0.2, 0.3, 0.2],
            scale: [1, 1.1, 1] 
          }} 
          transition={{ 
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#9933ff] rounded-full mix-blend-overlay filter blur-[120px] opacity-20"
          animate={{ 
            x: [0, -50, 0], 
            y: [0, -30, 0],
            opacity: [0.1, 0.2, 0.1],
            scale: [1, 1.2, 1] 
          }} 
          transition={{ 
            duration: 18,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-[0.03]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 bg-[#0f172a]/90 backdrop-blur-xl p-4 sm:p-8 md:p-10 rounded-xl shadow-2xl w-full max-w-md border border-[#FF7F57]/20 text-center shadow-[0_0_15px_rgba(255,127,87,0.3)]"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-[#FF7F57] drop-shadow-[0_0_8px_#FF7F57]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </motion.div>

        <motion.h2 
          className="text-xl sm:text-2xl font-bold text-white mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {title}
        </motion.h2>
        
        <motion.h1 
          className="text-2xl sm:text-3xl font-bold text-[#FF7F57] mb-4 sm:mb-6 drop-shadow-[0_0_8px_#FF7F57]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Chapter {chapterNumber} is Locked
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-20">
              <div className="w-8 h-8 border-2 border-[#FF7F57] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {!isManuallyLocked && (
                <>
                  <p className="text-white mb-4">This chapter will be unlocked for public in:</p>
                  <div className="grid grid-cols-4 gap-1 sm:gap-2 mx-auto max-w-full">
                    <div className="text-center bg-[#0f172a] w-full h-16 sm:h-20 flex flex-col items-center justify-center border border-[#FF7F57]/40 rounded shadow-[0_0_10px_rgba(255,127,87,0.4)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-[#FF7F57]/5"></div>
                      <span className="text-2xl sm:text-4xl font-bold text-white relative z-10">{timeLeft.days.toString().padStart(2, '0')}</span>
                      <p className="text-[10px] sm:text-xs text-[#FF7F57] relative z-10">DAYS</p>
                    </div>
                    <div className="text-center bg-[#0f172a] w-full h-16 sm:h-20 flex flex-col items-center justify-center border border-[#FF7F57]/40 rounded shadow-[0_0_10px_rgba(255,127,87,0.4)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-[#FF7F57]/5"></div>
                      <span className="text-2xl sm:text-4xl font-bold text-white relative z-10">{timeLeft.hours.toString().padStart(2, '0')}</span>
                      <p className="text-[10px] sm:text-xs text-[#FF7F57] relative z-10">HOURS</p>
                    </div>
                    <div className="text-center bg-[#0f172a] w-full h-16 sm:h-20 flex flex-col items-center justify-center border border-[#FF7F57]/40 rounded shadow-[0_0_10px_rgba(255,127,87,0.4)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-[#FF7F57]/5"></div>
                      <span className="text-2xl sm:text-4xl font-bold text-white relative z-10">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                      <p className="text-[10px] sm:text-xs text-[#FF7F57] relative z-10">MIN</p>
                    </div>
                    <div className="text-center bg-[#0f172a] w-full h-16 sm:h-20 flex flex-col items-center justify-center border border-[#FF7F57]/40 rounded shadow-[0_0_10px_rgba(255,127,87,0.4)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-[#FF7F57]/5"></div>
                      <span className="text-2xl sm:text-4xl font-bold text-white relative z-10">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                      <p className="text-[10px] sm:text-xs text-[#FF7F57] relative z-10">SEC</p>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </motion.div>
        
        <motion.div 
          className="flex flex-col space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <button
            onClick={handlePurchase}
            disabled={isPurchasing}
            className="w-full py-3 rounded-lg bg-[#FF7F57] hover:bg-[#FF9F57] text-[#000] font-semibold transition-all duration-300 flex items-center justify-center shadow-[0_0_20px_#FF7F57] relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-white/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            {isPurchasing ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 relative z-10" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm sm:text-base relative z-10 truncate">Unlock Now ({actualCoinAmount} coins - You have {userData?.coins ?? 0})</span>
              </>
            )}
          </button>
          
          {(!userData?.coins || userData.coins <= 69) && (
            <a
              href="/coins"
              className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold transition-all duration-300 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Buy Coins
            </a>
          )}
          
          <Link 
            href={`/manga/${mangaId}`} 
            className="w-full py-3 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-white font-medium transition-all duration-300 flex items-center justify-center border border-[#FF7F57]/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Series
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LockedChapter; 