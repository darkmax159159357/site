"use client";

import { useEffect, useState } from "react";
import { useReadingHistory } from "@/contexts/ReadingHistoryContext";
import Link from "next/link";
import Image from "next/image";
import { FiBook, FiCalendar, FiTrash2, FiClock, FiRefreshCw } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { CiWarning } from "react-icons/ci";
import { PLACEHOLDER_COVER } from "@/lib/firebaseBookmarks";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;

  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};

const ReadingHistoryPage = () => {
  const { history, isLoading: contextIsLoading, removeFromHistory, clearHistory, refreshHistory } = useReadingHistory();
  const { user } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedMangaId, setSelectedMangaId] = useState<string | null>(null);
  const [forceReady, setForceReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [manualRefresh, setManualRefresh] = useState(false);
  
  // Combine context loading state with our force ready state
  const isLoading = (contextIsLoading && !forceReady) || manualRefresh;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (user) {
          const token = await user.getIdToken(true);
          console.log("Auth token refreshed successfully:", token ? "Token obtained" : "No token");
          setAuthError(null);
        }
      } catch (error) {
        console.error("Error refreshing auth token:", error);
        setAuthError("Authentication error. Please try signing out and back in.");
      }
    };
    
    checkAuthStatus();
  }, [user]);
  
  // Force page to ready state after timeout to prevent infinite loading
  useEffect(() => {
    console.log("History page mounted, loading state:", contextIsLoading);
    
    // Always set a timeout for showing content regardless of loading state
    const shortTimer = setTimeout(() => {
      // If we're still loading after 2 seconds, show a timeout message
      if (contextIsLoading) {
        setLoadingTimeout(true);
      }
    }, 2000);
    
    // More aggressive force ready state after a short timeout
    const forceReadyTimer = setTimeout(() => {
      console.log("Force setting ready state after short timeout");
      setForceReady(true);
    }, 2000);  // Reduced from 3s to 2s for faster fallback
    
    // Refresh history when component mounts
    if (user) {
      console.log("User is logged in, refreshing history");
      refreshHistory().catch(err => {
        console.error("Error refreshing history:", err);
        // Force ready state on error
        setForceReady(true);
        // Set auth error if it's a permission issue
        if (err?.code === 'permission-denied') {
          setAuthError("Permission error. Please try signing out and back in.");
        } else {
          // Show general error toast
          toast.error("Failed to load history");
        }
      });
    } else {
      // If no user, immediately set force ready to prevent loading screen
      setForceReady(true);
    }
    
    return () => {
      clearTimeout(shortTimer);
      clearTimeout(forceReadyTimer);
    };
  }, [user, refreshHistory]);

  // Debug output for component state
  useEffect(() => {
    console.log("History page state:", {
      user: user?.uid || "not logged in",
      historyItems: history.length,
      contextIsLoading,
      forceReady,
      isLoading,
      loadingTimeout
    });
  }, [user, history.length, contextIsLoading, forceReady, isLoading, loadingTimeout]);

  const handleDelete = (mangaId: string) => {
    setSelectedMangaId(mangaId);
    setShowConfirmation(true);
  };

  const confirmDelete = async () => {
    if (selectedMangaId) {
      try {
        await removeFromHistory(selectedMangaId);
        toast.success("Removed from history");
        setShowConfirmation(false);
        setSelectedMangaId(null);
      } catch (error) {
        console.error("Error removing from history:", error);
        toast.error("Failed to remove from history");
      }
    }
  };

  const handleClearAll = () => {
    setSelectedMangaId(null);
    setShowConfirmation(true);
  };

  const confirmClearAll = async () => {
    try {
      await clearHistory();
      toast.success("History cleared");
      setShowConfirmation(false);
    } catch (error) {
      console.error("Error clearing history:", error);
      toast.error("Failed to clear history");
    }
  };
  
  const handleManualRefresh = async () => {
    setManualRefresh(true);
    
    try {
      await refreshHistory();
      toast.success("Reading history refreshed");
    } catch (error) {
      console.error("Error refreshing history:", error);
      toast.error("Failed to refresh history");
    } finally {
      setManualRefresh(false);
    }
  };

  if (!user) {
    return (
      <>
        <div className="bg-[#14161b] min-h-screen text-white py-10">
          <div className="container mx-auto px-4 py-16 max-w-6xl">
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <CiWarning className="text-6xl text-yellow-400 mb-4" />
              <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
              <p className="text-gray-300 mb-6">You need to be logged in to view your reading history.</p>
              <Link 
                href="/auth/sign-in" 
                className="px-6 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (authError) {
    return (
      <>
        <div className="bg-[#14161b] min-h-screen text-white py-10">
          <div className="container mx-auto px-4 py-16 max-w-6xl">
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <CiWarning className="text-6xl text-yellow-400 mb-4" />
              <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
              <p className="text-gray-300 mb-6">{authError}</p>
              <div className="flex gap-4">
                <Link 
                  href="/auth" 
                  className="px-6 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg transition-colors"
                >
                  Sign In Again
                </Link>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <div className="bg-[#14161b] min-h-screen text-white py-10">
          <div className="container mx-auto px-4 py-16 max-w-6xl">
            <div className="flex flex-col justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8b5cf6] mb-4"></div>
              <p className="text-gray-300 mt-4">
                {loadingTimeout ? "Still loading... this is taking longer than usual." : "Loading your reading history..."}
              </p>
              
              {loadingTimeout && (
                <button 
                  onClick={() => {
                    setForceReady(true);
                    setLoadingTimeout(false);
                  }}
                  className="mt-4 px-6 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg transition-colors"
                >
                  Show Available Data
                </button>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="bg-[#14161b] min-h-screen text-white py-10">
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          {/* Header with actions */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-bold mb-4">Reading History</h1>
              <p className="text-gray-400 text-sm">{history.length} {history.length === 1 ? 'item' : 'items'} in your history</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex gap-2">
              <button
                onClick={handleManualRefresh}
                disabled={manualRefresh}
                className="flex items-center px-4 py-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`mr-2 ${manualRefresh ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              {history.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center px-4 py-2 bg-red-600/10 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
                >
                  <FiTrash2 className="mr-2" />
                  Clear All
                </button>
              )}
            </div>
          </div>

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FiBook className="text-6xl text-gray-600 mb-4" />
              <h2 className="text-2xl font-bold mb-4">No Reading History Yet</h2>
              <p className="text-gray-400 mb-6">Start reading manga to track your progress</p>
              <Link 
                href="/" 
                className="px-6 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-lg transition-colors"
              >
                Browse Manga
              </Link>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {history.map((item) => (
                <motion.div 
                  key={item.id}
                  className="bg-[#1e2029] rounded-xl overflow-hidden hover:ring-1 hover:ring-[#8b5cf6]/50 transition-all duration-200"
                  variants={itemVariants}
                >
                  <div className="flex h-full">
                    {/* Cover Image */}
                    <div className="w-1/3 relative">
                      <div className="absolute inset-0">
                        <Image 
                          src={item.cover || PLACEHOLDER_COVER} 
                          alt={item.title}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            // Handle image load error by setting a default image
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // Prevent infinite loop
                            target.src = PLACEHOLDER_COVER;
                            console.log(`Fallback image used for ${item.title}`);
                          }}
                          unoptimized={true}
                          priority={true}
                        />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="w-2/3 p-4">
                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mb-4">
                        <div 
                          className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9]" 
                          style={{ width: `${item.percentage || 0}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-start">
                        <Link href={`/manga/${item.mangaId}`}>
                          <h3 className="font-medium text-lg mb-1 hover:text-[#8b5cf6] transition-colors line-clamp-1">{item.title}</h3>
                        </Link>
                        <button 
                          onClick={() => handleDelete(item.mangaId)}
                          className="text-gray-400 hover:text-red-400 transition-colors p-1"
                          aria-label="Delete from history"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                      
                      <Link 
                        href={`/read/${item.mangaId}-ch${item.lastChapter}`}
                        className="inline-block px-3 py-1 bg-[#8b5cf6]/20 text-[#a78bfa] text-sm rounded-full mb-3 hover:bg-[#8b5cf6]/30 transition-colors"
                      >
                        Chapter {item.lastChapter}
                      </Link>
                      
                      <div className="flex items-center text-sm text-gray-400">
                        <FiClock className="mr-1" />
                        <span className="text-xs">{formatDate(item.lastRead)}</span>
                      </div>
                      
                      <div className="mt-3">
                        <Link 
                          href={`/read/${item.mangaId}-ch${item.lastChapter}`}
                          className="text-sm font-medium text-[#8b5cf6] hover:text-[#a78bfa] flex items-center transition-colors"
                        >
                          Continue Reading
                          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1e2029] rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">
                {selectedMangaId ? "Remove from History" : "Clear All History"}
              </h3>
              <p className="text-gray-300 mb-6">
                {selectedMangaId
                  ? "Are you sure you want to remove this item from your reading history?"
                  : "Are you sure you want to clear your entire reading history? This action cannot be undone."}
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={selectedMangaId ? confirmDelete : confirmClearAll}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                >
                  {selectedMangaId ? "Remove" : "Clear All"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Footer />
    </>
  );
};

export default ReadingHistoryPage; 