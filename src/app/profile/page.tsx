'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { useReadingHistory } from '@/contexts/ReadingHistoryContext';
import Image from 'next/image';
import Link from 'next/link';
import { useProfile } from '@/hooks/useProfile';
import LoginModal from '@/components/LoginModal';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiSave, FiX, FiLock, FiBookmark, FiUser, FiMail, FiCalendar, FiEye, FiClock, FiChevronDown, FiTrash2 } from 'react-icons/fi';
import { GiTwoCoins, GiBookPile } from 'react-icons/gi';
import { PLACEHOLDER_COVER } from '@/lib/firebaseBookmarks';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const ProfilePage = () => {
  const { user, userData, loading } = useAuth();
  const { bookmarks, removeFromBookmarks } = useBookmarks();
  const { history, isLoading: historyLoading, removeFromHistory, clearHistory } = useReadingHistory();
  const { updateProfile, updatePassword, isUpdating, updateError } = useProfile();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [viewStatsExpanded, setViewStatsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');
  const [formData, setFormData] = useState({
    displayName: '',
    photoURL: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isConfirmingClearHistory, setIsConfirmingClearHistory] = useState(false);
  const [isConfirmingResetBookmarks, setIsConfirmingResetBookmarks] = useState(false);
  const [isConfirmingDeleteAll, setIsConfirmingDeleteAll] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to auth page if not logged in
      router.push('/auth');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (userData) {
      setFormData({
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || ''
      });
    }
  }, [userData]);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeInOut' }
    },
    exit: { opacity: 0 }
  };

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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.98
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const startEditing = () => {
    if (userData) {
      setFormData({
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || ''
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setFormError(null);
  };

  const startChangingPassword = () => {
    setIsChangingPassword(true);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const cancelChangingPassword = () => {
    setIsChangingPassword(false);
    setFormError(null);
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.displayName) {
      setFormError('Display name is required');
      return;
    }
    
    try {
      const success = await updateProfile({
        displayName: formData.displayName,
        photoURL: formData.photoURL
      });
      
      if (success) {
      setIsEditing(false);
      setFormSuccess('Profile updated successfully');
      setTimeout(() => setFormSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setFormError('Failed to update profile');
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setFormError('Password fields are required');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setFormError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setFormError('New password must be at least 8 characters');
      return;
    }
    
    try {
      const success = await updatePassword(passwordData.newPassword);
      
      if (success) {
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setFormSuccess('Password changed successfully');
      setTimeout(() => setFormSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setFormError('Failed to change password');
    }
  };

  // Utility function to calculate favorite genre from user data
  const calculateFavoriteGenre = () => {
    // Common genres in manga/manhwa/pornhwa
    const commonGenres = [
      "Romance", "Action", "Drama", "Fantasy", "Comedy",
      "Mature", "Adult", "School Life", "Slice of Life", "Harem", 
      "Supernatural", "Mystery", "Historical", "Horror"
    ];
    
    // Return default if no data available
    if (!history.length && !bookmarks.length) return "None";
    
    // Initialize genre counts
    const genreCounts: Record<string, number> = {};
    
    // Function to extract genres from titles
    const extractGenresFromTitle = (title: string) => {
      const extractedGenres: string[] = [];
      
      // Check if title contains any common genre
      commonGenres.forEach(genre => {
        if (title.toLowerCase().includes(genre.toLowerCase())) {
          extractedGenres.push(genre);
        }
      });
      
      // Check for common combined types
      if (title.toLowerCase().includes("school") || 
          title.toLowerCase().includes("academy") || 
          title.toLowerCase().includes("college")) {
        extractedGenres.push("School Life");
      }
      
      return extractedGenres;
    };
    
    // Process history items
    history.forEach(item => {
      // Try to extract genres from title
      const extractedGenres = extractGenresFromTitle(item.title);
      
      // Count occurrences
      extractedGenres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });
    
    // Process bookmarked items
    bookmarks.forEach(item => {
      // Try to extract genres from title
      const extractedGenres = extractGenresFromTitle(item.title);
      
      // Count occurrences
      extractedGenres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });
    
    // Find most frequent genre
    let favoriteGenre = "Unknown"; // Default
    let maxCount = 0;
    
    Object.entries(genreCounts).forEach(([genre, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteGenre = genre;
      }
    });
    
    // If we couldn't detect any genre, return default
    return favoriteGenre;
  };
  
  // Utility function to calculate reading streak
  const calculateReadingStreak = () => {
    if (!history.length) return 0; // Changed from default 7 to 0
    
    // Sort history by date (newest first)
    const sortedHistory = [...history].sort((a, b) => 
      new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime()
    );
    
    // Get unique days with reading activity (in descending order)
    const uniqueDays: string[] = [];
    sortedHistory.forEach(item => {
      const day = new Date(item.lastRead).toDateString();
      if (!uniqueDays.includes(day)) {
        uniqueDays.push(day);
      }
    });
    
    // Count consecutive days
    let streak = 1;
    const today = new Date().toDateString();
    
    // If most recent day is today, start checking streak
    const mostRecentDay = uniqueDays[0] || today;
    const dayDiff = Math.floor((new Date(today).getTime() - new Date(mostRecentDay).getTime()) / (1000 * 3600 * 24));
    
    // If most recent activity is more than 1 day ago, streak is broken
    if (dayDiff > 1) return 0;
    
    let currentDate = new Date();
    for (let i = 0; i < 7; i++) { // Check up to 7 days back
      const checkDate = new Date(currentDate);
      checkDate.setDate(currentDate.getDate() - i);
      const checkDay = checkDate.toDateString();
      
      if (uniqueDays.includes(checkDay)) {
        streak = i + 1;
      } else {
        // Break when we find a day with no activity
        break;
      }
    }
    
    return streak;
  };

  // Utility function to get height percentage for activity chart (based on reading history)
  const getActivityHeightForDay = (daysAgo: number) => {
    if (!history.length) {
      // Generate random data if no history
      const heights = [65, 45, 90, 30, 75, 60, 85];
      return heights[daysAgo];
    }
    
    // Get date for the day we're checking
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - daysAgo);
    const checkDay = checkDate.toDateString();
    
    // Count items read on this day
    let count = 0;
    history.forEach(item => {
      const itemDate = new Date(item.lastRead).toDateString();
      if (itemDate === checkDay) {
        count++;
      }
    });
    
    // Convert count to height percentage (max 100%)
    return Math.min(count * 20, 100) || Math.floor(Math.random() * 50) + 10; // Random fallback
  };
  
  // Utility function to get day name
  const getDayName = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 1);
  };

  // Show login screen if not authenticated
  if (!user && !userData && !loading) {
    return (
      <>
        <motion.div 
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          className="min-h-screen bg-gradient-to-br from-[#14161b] via-[#1f1b2d] to-[#2d1a24] flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full">
              <motion.div 
              variants={cardVariants}
              className="bg-[#1e2029]/80 backdrop-blur-lg rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
            >
              <div className="p-8">
                <div className="flex flex-col items-center justify-center text-center space-y-6">
                <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 260,
                      damping: 20, 
                      delay: 0.2 
                    }}
                    className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center"
                  >
                    <FiUser className="w-12 h-12 text-white" />
                </motion.div>
                  
                  <div className="space-y-2">
                <motion.h1 
                      initial={{ y: 20, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }} 
                  transition={{ delay: 0.3 }}
                      className="text-3xl font-bold text-white"
                >
                      Profile Access
                </motion.h1>
                <motion.p 
                      initial={{ y: 20, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }} 
                  transition={{ delay: 0.4 }}
                      className="text-gray-400"
                >
                      Sign in to view your profile and bookmarks
                </motion.p>
                  </div>
                  
                <motion.button
                    initial={{ y: 20, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }} 
                  transition={{ delay: 0.5 }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-medium rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/20 transition-all duration-300"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  onClick={() => setShowLoginModal(true)}
                >
                    <FiUser className="w-5 h-5" />
                    <span>Sign In</span>
                </motion.button>
                </div>
              </div>
              </motion.div>
          </div>
        </motion.div>
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        <Footer />
      </>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-[#14161b] via-[#1f1b2d] to-[#2d1a24] flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
            <p className="text-purple-300 font-medium">Loading profile...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Get display name from user data
  const displayName = userData?.displayName || 'User';
  const firstLetter = displayName.charAt(0).toUpperCase();
  
  // Get join date
  const joinDate = userData?.createdAt 
    ? new Date(userData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  // Add this function to reset all bookmarks
  const handleResetBookmarks = async () => {
    try {
      // Loop through all bookmarks and remove them one by one
      const promises = bookmarks.map(bookmark => removeFromBookmarks(bookmark.mangaId));
      await Promise.all(promises);
      toast.success('All bookmarks have been removed');
      setIsConfirmingResetBookmarks(false);
    } catch (error) {
      console.error('Error resetting bookmarks:', error);
      toast.error('Failed to reset bookmarks');
    }
  };
  
  // Add this function to delete all user data
  const handleDeleteAllData = async () => {
    try {
      // First clear reading history
      await clearHistory();
      
      // Then remove all bookmarks
      const promises = bookmarks.map(bookmark => removeFromBookmarks(bookmark.mangaId));
      await Promise.all(promises);
      
      toast.success('All user data has been deleted');
      setIsConfirmingDeleteAll(false);
    } catch (error) {
      console.error('Error deleting all data:', error);
      toast.error('Failed to delete all data');
    }
  };

  return (
    <>
      <motion.div 
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="min-h-screen bg-gradient-to-br from-[#14161b] via-[#1f1b2d] to-[#2d1a24] text-white pb-20"
      >
        {/* Sticky notification for success/error */}
        <AnimatePresence>
          {(formSuccess || formError || updateError) && (
            <motion.div 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg ${
                formSuccess ? 'bg-green-500/90' : 'bg-red-500/90'
              } backdrop-blur-md text-white font-medium flex items-center space-x-2`}
            >
              {formSuccess ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              <span>{formSuccess || formError || updateError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8"
        >
          {/* Header with animated background and profile info */}
            <motion.div 
              variants={itemVariants}
              className="relative rounded-3xl overflow-hidden mb-12 shadow-xl"
            >
              {/* Background cover with gradient overlay */}
              <div className="h-64 sm:h-80 w-full bg-gradient-to-r from-purple-600/20 to-pink-500/20">
                <div className="absolute inset-0 bg-pattern opacity-5"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#14161b]"></div>
                
                {/* Animated particles */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(10)].map((_, i) => (
                    <motion.div 
                      key={i}
                      className="absolute rounded-full bg-white/20 w-2 h-2"
                      animate={{
                        x: [Math.random() * 100, Math.random() * 100 - 50],
                        y: [Math.random() * 100, Math.random() * 100 - 50],
                        opacity: [0.2, 0.8, 0.2],
                        scale: [1, 1.5, 1]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 3 + Math.random() * 5,
                        ease: "easeInOut"
                      }}
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                    />
                  ))}
                </div>
                
                {/* Profile info */}
                <div className="absolute bottom-8 left-0 w-full px-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
                    {/* Profile avatar with animation */}
                    <motion.div 
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 100, damping: 15 }}
                      className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-500 shadow-2xl ring-4 ring-[#14161b] overflow-hidden flex items-center justify-center"
                    >
                      {userData?.photoURL ? (
                        <Image 
                          src={userData.photoURL} 
                          alt={displayName}
                          width={160}
                          height={160}
                          className="w-full h-full object-cover"
                          priority
                        />
                      ) : (
                        <span className="text-white text-5xl sm:text-6xl font-bold">
                          {firstLetter}
                        </span>
                      )}
                    </motion.div>
                    
                    {/* User info with animation */}
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-col items-center sm:items-start"
                    >
                      <div className="flex items-center space-x-3 mb-1">
                        <h1 className="text-3xl sm:text-4xl font-bold text-white">{displayName}</h1>
                        {!isEditing ? (
                          <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: "rgba(168, 85, 247, 0.4)" }}
                            whileTap={{ scale: 0.9 }}
                            onClick={startEditing}
                            className="text-sm px-2 py-1 rounded-xl bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors flex items-center"
                          >
                            <FiEdit2 className="w-3 h-3" />
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: "rgba(239, 68, 68, 0.4)" }}
                            whileTap={{ scale: 0.9 }}
                            onClick={cancelEditing}
                            className="text-sm px-2 py-1 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors flex items-center"
                          >
                            <FiX className="w-3 h-3" />
                          </motion.button>
                        )}
                      </div>

                      <AnimatePresence mode="wait">
                        {isEditing ? (
                          <motion.form 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onSubmit={handleSubmitProfile}
                            className="space-y-2 mt-2 w-full sm:max-w-sm"
                          >
                            <div>
                              <motion.input
                                whileFocus={{ scale: 1.02, boxShadow: "0 0 0 2px rgba(168, 85, 247, 0.5)" }}
                                type="text"
                                name="displayName"
                                value={formData.displayName}
                                onChange={handleChange}
                                className="w-full px-3 py-1.5 bg-[#14161b]/70 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white transition-all duration-300 text-sm"
                                placeholder="Display Name"
                              />
                            </div>
                            
                            <div>
                              <motion.input
                                whileFocus={{ scale: 1.02, boxShadow: "0 0 0 2px rgba(168, 85, 247, 0.5)" }}
                                type="text"
                                name="photoURL"
                                value={formData.photoURL}
                                onChange={handleChange}
                                className="w-full px-3 py-1.5 bg-[#14161b]/70 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white transition-all duration-300 text-sm"
                                placeholder="Profile Photo URL"
                              />
                            </div>
                            
                            <motion.button
                              type="submit"
                              disabled={isUpdating}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full py-1.5 px-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white text-sm font-medium rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/20 transition-all duration-300 disabled:opacity-50"
                            >
                              {isUpdating ? (
                                <>
                                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <FiSave className="w-4 h-4" />
                                  <span>Save</span>
                                </>
                              )}
                            </motion.button>
                          </motion.form>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <p className="text-gray-400">{userData?.email}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <motion.div 
                                whileHover={{ y: -3 }}
                                className="flex items-center space-x-1 text-purple-400"
                              >
                                <FiCalendar className="w-4 h-4" />
                                <span className="text-sm">Joined {joinDate}</span>
                              </motion.div>
                              <motion.div 
                                whileHover={{ y: -3 }}
                                className="flex items-center space-x-1 text-pink-400"
                              >
                                <FiBookmark className="w-4 h-4" />
                                <span className="text-sm">{bookmarks.length} Bookmarks</span>
                              </motion.div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Options */}
            <motion.div variants={itemVariants} className="lg:col-span-1 space-y-8">
              {/* Coins Card */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-[#1e2029]/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center">
                      <GiTwoCoins className="mr-2 text-yellow-500" />
                      Your Coins
                    </h2>
                    
                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(234, 179, 8, 0.4)" }}
                      whileTap={{ scale: 0.9 }}
                      className="text-sm px-3 py-1 rounded-xl bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 transition-colors flex items-center"
                      onClick={() => router.push("/coins")}
                    >
                      <span>Get More</span>
                    </motion.button>
                  </div>
                  
                  <div className="bg-[#14161b]/50 rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <motion.div 
                        animate={{ 
                          rotateY: [0, 180, 360],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          repeatType: "loop",
                          ease: "easeInOut",
                          times: [0, 0.5, 1]
                        }}
                        className="w-14 h-14 rounded-full bg-gradient-to-r from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-600/20"
                      >
                        <GiTwoCoins className="w-8 h-8 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">
                          {(userData as any)?.coins || 0}
                        </h3>
                        <p className="text-sm text-gray-400">Available coins</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-500">Last updated</span>
                      <span className="text-sm text-gray-400">Today</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 mt-3">
                    <motion.button
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => router.push("/coins")}
                      className="py-2 px-3 bg-gradient-to-br from-yellow-500/20 to-amber-600/20 hover:from-yellow-500/30 hover:to-amber-600/30 rounded-xl text-yellow-400 font-medium flex items-center justify-center space-x-2 border border-yellow-500/20"
                    >
                      <span>Purchase</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
              
              {/* Data Management Card */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-[#1e2029]/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center">
                      <FiUser className="mr-2 text-purple-500" />
                      Data Management
                    </h2>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-4">
                    Manage your account data and privacy settings
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(168, 85, 247, 0.3)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsConfirmingClearHistory(true)}
                      className="py-2 px-4 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 rounded-xl flex items-center justify-between transition-all duration-300"
                    >
                      <span>Clear Reading History</span>
                      <FiTrash2 className="w-4 h-4" />
                    </motion.button>
                    
                    {isConfirmingClearHistory && (
                      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-[#1e2029] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                        >
                          <h3 className="text-xl font-bold text-white mb-2">Clear Reading History?</h3>
                          <p className="text-gray-300 mb-6">This will permanently delete all your reading history. This action cannot be undone.</p>
                          
                          <div className="flex justify-end space-x-3">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setIsConfirmingClearHistory(false)}
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl"
                            >
                              Cancel
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={async () => {
                                try {
                                  await clearHistory();
                                  toast.success('Reading history cleared');
                                  setIsConfirmingClearHistory(false);
                                } catch (error) {
                                  toast.error('Failed to clear history');
                                  console.error('Error clearing history:', error);
                                }
                              }}
                              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl"
                            >
                              Clear History
                            </motion.button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                    
                    <motion.button
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(168, 85, 247, 0.3)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsConfirmingResetBookmarks(true)}
                      className="py-2 px-4 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 rounded-xl flex items-center justify-between transition-all duration-300"
                    >
                      <span>Reset Bookmarks</span>
                      <FiX className="w-4 h-4" />
                    </motion.button>
                    
                    {isConfirmingResetBookmarks && (
                      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-[#1e2029] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                        >
                          <h3 className="text-xl font-bold text-white mb-2">Reset All Bookmarks?</h3>
                          <p className="text-gray-300 mb-6">This will remove all {bookmarks.length} bookmarks from your library. This action cannot be undone.</p>
                          
                          <div className="flex justify-end space-x-3">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setIsConfirmingResetBookmarks(false)}
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl"
                            >
                              Cancel
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleResetBookmarks}
                              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl"
                            >
                              Reset Bookmarks
                            </motion.button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                    
                    <motion.button
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(239, 68, 68, 0.3)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsConfirmingDeleteAll(true)}
                      className="py-2 px-4 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl flex items-center justify-between transition-all duration-300"
                    >
                      <span>Delete All Data</span>
                      <FiX className="w-4 h-4" />
                    </motion.button>
                    
                    {isConfirmingDeleteAll && (
                      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-[#1e2029] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                        >
                          <h3 className="text-xl font-bold text-white mb-2">Delete All User Data?</h3>
                          <p className="text-gray-300 mb-6">This will permanently delete ALL your data including reading history and bookmarks. This action cannot be undone.</p>
                          
                          <div className="flex justify-end space-x-3">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setIsConfirmingDeleteAll(false)}
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl"
                            >
                              Cancel
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleDeleteAllData}
                              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl"
                            >
                              Delete Everything
                            </motion.button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Right Column - Activity and Bookmarks */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
              {/* Tab Navigation */}
              <motion.div 
                whileHover={{ y: -3 }}
                className="bg-[#1e2029]/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10"
              >
                <div className="flex items-stretch p-2">
                  <motion.button
                    whileHover={{ scale: activeTab === 'stats' ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('stats')}
                    className={`flex-1 py-3 px-4 rounded-2xl flex items-center justify-center space-x-2 transition-all duration-300 ${
                      activeTab === 'stats' 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/20' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FiEye className="w-4 h-4" />
                    <span className="font-medium">Stats</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: activeTab === 'history' ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-3 px-4 mx-2 rounded-2xl flex items-center justify-center space-x-2 transition-all duration-300 ${
                      activeTab === 'history' 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/20' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FiClock className="w-4 h-4" />
                    <span className="font-medium">History</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: activeTab === 'bookmarks' ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('bookmarks')}
                    className={`flex-1 py-3 px-4 rounded-2xl flex items-center justify-center space-x-2 transition-all duration-300 ${
                      activeTab === 'bookmarks' 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/20' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FiBookmark className="w-4 h-4" />
                    <span className="font-medium">Bookmarks</span>
                  </motion.button>
                </div>
              </motion.div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {/* Stats Tab */}
                {activeTab === 'stats' && (
                  <motion.div 
                    key="stats-tab"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ y: -5 }}
                    className="bg-[#1e2029]/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 transition-all duration-300"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold flex items-center">
                          <FiEye className="mr-2 text-purple-500" />
                          Stats & Activity
                        </h2>
                      </div>
                  
                      <div className="grid grid-cols-2 gap-6">
                        {/* Bookmarks */}
                        <motion.div 
                          whileHover={{ y: -5, scale: 1.03 }}
                          className="bg-[#14161b]/50 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg shadow-purple-900/5"
                        >
                          <motion.div 
                            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ duration: 0.5 }}
                            className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center mb-2"
                          >
                            <FiBookmark className="text-purple-400 w-6 h-6" />
                          </motion.div>
                          <span className="text-xl font-bold text-white">{bookmarks.length}</span>
                          <span className="text-sm text-gray-400">Bookmarks</span>
                        </motion.div>
                        
                        {/* Coins */}
                        <motion.div 
                          whileHover={{ y: -5, scale: 1.03 }}
                          className="bg-[#14161b]/50 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg shadow-yellow-900/5"
                        >
                          <motion.div 
                            animate={{ 
                              rotateY: [0, 180, 360],
                            }}
                            transition={{ 
                              duration: 3,
                              repeat: Infinity,
                              repeatType: "loop",
                              ease: "easeInOut",
                            }}
                            className="w-12 h-12 rounded-full bg-yellow-600/20 flex items-center justify-center mb-2"
                          >
                            <GiTwoCoins className="text-yellow-400 w-6 h-6" />
                          </motion.div>
                          <span className="text-xl font-bold text-white">{(userData as any)?.coins || 0}</span>
                          <span className="text-sm text-gray-400">Coins</span>
                        </motion.div>
                      </div>
                      
                      {/* Reading Activity Chart */}
                      <div className="bg-[#14161b]/80 rounded-xl p-4 mb-4 mt-6">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Activity Overview</h4>
                        <div className="flex items-end justify-between h-20 gap-1">
                          {/* Generate a simple activity chart using divs */}
                          {Array.from({ length: 7 }).map((_, i) => {
                            // Get random height for visual appeal
                            const height = getActivityHeightForDay(i);
                            const day = getDayName(i);
                            
                            return (
                              <div key={`day-${i}`} className="flex flex-col items-center">
                                <div 
                                  className="w-8 bg-gradient-to-t from-purple-500 to-purple-400 rounded-sm transition-all duration-300" 
                                  style={{ 
                                    height: `${height}%`,
                                    opacity: height > 0 ? 1 : 0.3
                                  }}
                                ></div>
                                <span className="text-xs text-gray-400 mt-2">{day}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Additional Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#14161b]/50 rounded-xl p-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Favorite Genre</h4>
                          {calculateFavoriteGenre() === "None" ? (
                            <div className="flex flex-col items-start">
                              <p className="text-gray-500 text-sm">No reading data</p>
                              <p className="text-xs text-purple-400 mt-1">Read more to see your preference</p>
                            </div>
                          ) : (
                            <p className="text-lg font-semibold text-white">{calculateFavoriteGenre()}</p>
                          )}
                        </div>
                        
                        <div className="bg-[#14161b]/50 rounded-xl p-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Reading Streak</h4>
                          {calculateReadingStreak() === 0 ? (
                            <div className="flex flex-col items-start">
                              <p className="text-gray-500 text-sm">No active streak</p>
                              <p className="text-xs text-purple-400 mt-1">Read today to start</p>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <p className="text-lg font-semibold text-white mr-2">{calculateReadingStreak()} days</p>
                              <div className="flex">
                                {Array.from({ length: 7 }).map((_, i) => (
                                  <div 
                                    key={`streak-${i}`}
                                    className={`w-2 h-2 rounded-full mx-0.5 ${
                                      i < calculateReadingStreak() 
                                        ? 'bg-green-400' 
                                        : 'bg-gray-600'
                                    }`}
                                  ></div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Reading History Tab */}
                {activeTab === 'history' && (
                  <motion.div 
                    key="history-tab"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ y: -5 }}
                    className="bg-[#1e2029]/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 transition-all duration-300"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold flex items-center">
                          <FiClock className="mr-2 text-purple-500" />
                          Reading History
                        </h2>
                        
                        <Link href="/history">
                          <motion.div
                            whileHover={{ scale: 1.1, backgroundColor: "rgba(168, 85, 247, 0.4)" }}
                            whileTap={{ scale: 0.9 }}
                            className="text-sm px-3 py-1 rounded-xl bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors"
                          >
                            View All
                          </motion.div>
                        </Link>
                      </div>
                      
                      {historyLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : history.length > 0 ? (
                        <div className="space-y-4">
                          {/* Actual reading history items */}
                          {history.slice(0, 5).map((historyItem) => (
                            <Link key={historyItem.id} href={`/read/${historyItem.mangaId}-ch${historyItem.lastChapter}`}>
                              <motion.div 
                                whileHover={{ x: 5 }}
                                className="flex items-center space-x-4 p-3 rounded-xl transition-all duration-300 hover:bg-white/5 cursor-pointer"
                              >
                                <div className="w-12 h-16 rounded-md overflow-hidden relative bg-gray-800 flex-shrink-0">
                                  {historyItem.cover && !historyItem.cover.includes('placeholder') ? (
                                    <Image
                                      src={historyItem.cover}
                                      alt={historyItem.title}
                                      fill
                                      className="object-cover"
                                      sizes="48px"
                                    />
                                  ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-500/30">
                                      <div className="flex items-center justify-center h-full">
                                        <FiBookmark className="text-purple-400 w-6 h-6" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-grow">
                                  <h3 className="font-medium text-white line-clamp-1">{historyItem.title}</h3>
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-400">
                                      Chapter {historyItem.lastChapter}
                                      {historyItem.percentage && historyItem.percentage < 100 ? ` • ${historyItem.percentage}%` : " • Completed"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(historyItem.lastRead).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeFromHistory(historyItem.mangaId);
                                    toast.success('Removed from history');
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#14161b]/80 flex items-center justify-center text-red-400"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </motion.button>
                              </motion.div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto mb-4">
                            <FiClock className="w-8 h-8 text-purple-400" />
                          </div>
                          <h3 className="text-lg font-medium text-white mb-2">No reading history</h3>
                          <p className="text-gray-400 mb-6">You haven&apos;t read any manga yet</p>
                          <Link 
                            href="/"
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg text-sm font-medium"
                          >
                            Browse Series
                          </Link>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              
                {/* Bookmarks Tab */}
                {activeTab === 'bookmarks' && (
                  <motion.div 
                    key="bookmarks-tab"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ y: -5 }}
                    className="bg-[#1e2029]/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 transition-all duration-300"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold flex items-center">
                          <FiBookmark className="mr-2 text-purple-500" />
                          Your Library
                        </h2>
                        
                        <Link href="/bookmarks">
                          <motion.div 
                            whileHover={{ scale: 1.1, backgroundColor: "rgba(168, 85, 247, 0.4)" }}
                            whileTap={{ scale: 0.9 }}
                            className="text-sm px-3 py-1 rounded-xl bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors"
                          >
                            View All
                          </motion.div>
                        </Link>
                      </div>
                      
                      {bookmarks.length > 0 ? (
                        <div className="space-y-4">
                          {bookmarks.slice(0, 5).map((bookmark) => (
                            <Link href={`/manga/${bookmark.mangaId}`} key={bookmark.id}>
                              <motion.div 
                                whileHover={{ x: 5 }}
                                className="flex items-center space-x-4 p-3 rounded-xl transition-all duration-300 hover:bg-white/5 cursor-pointer"
                              >
                                <div className="w-12 h-16 rounded-md overflow-hidden relative bg-gray-800 flex-shrink-0">
                                  {bookmark.cover && !bookmark.cover.includes('placeholder') ? (
                                    <Image 
                                      src={bookmark.cover} 
                                      alt={bookmark.title} 
                                      fill 
                                      className="object-cover"
                                      sizes="48px"
                                    />
                                  ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-500/30">
                                      <div className="flex items-center justify-center h-full">
                                        <FiBookmark className="text-purple-400 w-6 h-6" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-grow">
                                  <h3 className="font-medium text-white line-clamp-1">{bookmark.title}</h3>
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-400">
                                      {bookmark.lastChapter ? `Last read: Ch. ${bookmark.lastChapter}` : 'Not started yet'}
                                    </p>
                                    {bookmark.lastRead && (
                                      <p className="text-xs text-gray-500">
                                        {new Date(bookmark.lastRead).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeFromBookmarks(bookmark.mangaId);
                                    toast.success('Removed from bookmarks');
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#14161b]/80 flex items-center justify-center text-red-400"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </motion.button>
                              </motion.div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto mb-4">
                            <FiBookmark className="w-8 h-8 text-purple-400" />
                          </div>
                          <h3 className="text-lg font-medium text-white mb-2">No bookmarks yet</h3>
                          <p className="text-gray-400 mb-6">Start reading and bookmark your favorite series</p>
                          <Link 
                            href="/"
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg text-sm font-medium"
                          >
                            Browse Series
                          </Link>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
      <Footer />
      
      <style jsx global>{`
        .bg-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
    </>
  );
};

export default ProfilePage; 