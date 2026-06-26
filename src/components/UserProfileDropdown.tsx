'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { useReadingHistory } from '@/contexts/ReadingHistoryContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiBookmark, FiLogOut, FiSettings, FiClock } from 'react-icons/fi';
import { GiTwoCoins } from 'react-icons/gi';
import { FaGift } from 'react-icons/fa';
import { userMenuLinks } from './utils/NavLink';

const UserProfileDropdown: React.FC = () => {
  const { user, userData, logout } = useAuth();
  const { bookmarks } = useBookmarks();
  const { history } = useReadingHistory();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state for SSR compatibility
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle escape key to close dropdown
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  // Update dropdown position when window resizes
  useEffect(() => {
    const handleResize = () => {
      updateDropdownPosition();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;
      
      if (isMobile) {
        // On mobile, position at bottom right of screen
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          right: 16, // 16px from right edge
          left: 'auto'
        });
      } else {
        // On desktop, position below the button
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: Math.max(window.innerWidth - 280, rect.right - 256), // Prevent overflow
          right: 'auto'
        });
      }
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  if (!user && !userData) return null;

  // Get display name from Firebase user data
  const displayName = userData?.displayName || 'User';
  
  // Get the first letter of the display name
  const firstLetter = displayName.charAt(0).toUpperCase();

  const dropdownVariants = {
    hidden: { 
      opacity: 0, 
      y: -5,
      scale: 0.95,
      transition: { duration: 0.2 }
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      y: -5,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (custom: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: 0.1 + custom * 0.05 }
    })
  };

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className="flex items-center space-x-2 focus:outline-none group"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-base bg-red-600">
            {firstLetter}
          </div>
          <span className="text-white hidden md:inline group-hover:text-orange-500 transition-colors duration-300">
            {displayName}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-gray-400 transition-transform duration-300 group-hover:text-orange-500 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isMounted && typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop overlay */}
              <div 
                className="fixed inset-0 w-full h-full"
                style={{ zIndex: 2147483646 }}
                aria-hidden="true"
              />
              {/* Dropdown menu */}
              <motion.div
                ref={dropdownRef}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={dropdownVariants}
                className="fixed w-64 bg-gradient-to-b from-[#1A1B1E] to-[#252830] rounded-xl shadow-2xl py-2 border border-gray-700"
                style={{ 
                  top: dropdownPosition.top,
                  left: dropdownPosition.left !== 'auto' ? dropdownPosition.left : undefined,
                  right: dropdownPosition.right !== 'auto' ? dropdownPosition.right : undefined,
                  zIndex: 2147483647, // Maximum possible z-index value
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div className="px-4 py-3 border-b border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-lg bg-red-600">
                      {firstLetter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{displayName}</p>
                      <p className="text-gray-400 text-sm truncate">{userData?.email || user?.email || ''}</p>
                      <p className="text-amber-400 text-sm truncate flex items-center">
                        <GiTwoCoins className="mr-1 flex-shrink-0" /> {userData?.coins || 0} coins
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="py-1">
                  <motion.div custom={0} variants={itemVariants}>
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 hover:text-orange-500 w-full text-left transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <FiUser className="mr-3 text-orange-500 flex-shrink-0" />
                      <span>Profile</span>
                    </Link>
                  </motion.div>
                  
                  <motion.div custom={1} variants={itemVariants}>
                    <Link
                      href="/bookmarks"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 hover:text-orange-500 w-full text-left transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <FiBookmark className="mr-3 text-orange-500 flex-shrink-0" />
                      <span>My Library</span>
                      <span className="ml-auto bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full text-xs flex-shrink-0">
                        {bookmarks.length}
                      </span>
                    </Link>
                  </motion.div>
                  
                  <motion.div custom={2} variants={itemVariants}>
                    <Link
                      href="/history"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 hover:text-orange-500 w-full text-left transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <FiClock className="mr-3 text-orange-500 flex-shrink-0" />
                      <span>Reading History</span>
                      <span className="ml-auto bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full text-xs flex-shrink-0">
                        {history.length}
                      </span>
                    </Link>
                  </motion.div>

                  <motion.div custom={3} variants={itemVariants}>
                    <Link
                      href="/redeem"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 hover:text-orange-500 w-full text-left transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <FaGift className="mr-3 text-orange-500 flex-shrink-0" />
                      <span>Redeem Code</span>
                    </Link>
                  </motion.div>
                </div>
                
                <div className="border-t border-gray-700/50 mt-1 pt-1">
                  <motion.div custom={4} variants={itemVariants}>
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 hover:text-red-500 w-full text-left transition-colors duration-200"
                    >
                      <FiLogOut className="mr-3 text-red-500 flex-shrink-0" />
                      <span>Sign out</span>
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default UserProfileDropdown;