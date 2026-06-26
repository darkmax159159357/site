"use client";
import { useState, useEffect, useRef } from "react";
import MangaCard from "./MangaCard";
import LoadingIndicator from "./LoadingIndicator";
import { fetchLastUpdated } from "@/action/fetchKomik";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion"; // Import framer motion for animations
import { usePagination } from "@/contexts/PaginationContext"; // Import our pagination hook
import { useSearchParams } from "next/navigation";

type Chapter = {
  number: number;
  title?: string;
  pages?: string[];
  date?: string;
  added_chap_date?: string;
  added_date?: string;
  release_date?: string;
  isLocked?: boolean;
  unlockTime?: string;
  formattedDate?: string;
  [key: string]: any;
};

type MangaData = {
  id: string;
  title: string;
  cover: string;
  rating?: number;
  status?: "ONGOING" | "COMPLETED" | "RELEASED";
  chapter?: string;
  country?: string;
  slug?: string;
  chapters?: Chapter[];
  description?: string;
  genres?: string[];
  genre?: string;
};

// Function to format date as relative time string
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  // Less than a month
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  
  // Less than a year
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  
  // More than a year
  const years = Math.floor(diffInSeconds / 31536000);
  return `${years} year${years > 1 ? 's' : ''} ago`;
};

// Helper function to extract timestamp from date strings in various formats
const getTimestampFromDate = (dateStr: string): number => {
  if (!dateStr) return 0;
  
  try {
    // Try to parse as DD-MM-YYYY HH:MM am/pm format first
    const dateParts = dateStr.split(' ');
    if (dateParts.length >= 2) {
      const dateComponents = dateParts[0].split('-');
      if (dateComponents.length === 3) {
        const day = parseInt(dateComponents[0]);
        const month = parseInt(dateComponents[1]) - 1; // Months are 0-indexed
        const year = parseInt(dateComponents[2]);
        
        const timeParts = dateParts[1].split(':');
        if (timeParts.length === 2) {
          let hour = parseInt(timeParts[0]);
          const minute = parseInt(timeParts[1]);
          
          // Adjust for AM/PM
          if (dateParts[2]?.toLowerCase() === 'pm' && hour < 12) {
            hour += 12;
          }
          
          const date = new Date(year, month, day, hour, minute);
          if (!isNaN(date.getTime())) {
            return date.getTime();
          }
        }
      }
    }
    
    // If above format fails, try standard ISO format
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
  } catch (e) {
    console.error("Error parsing date:", dateStr, e);
  }
  
  return 0;
};

const LatestComics = ({ viewAll = false, showPagination = true }) => {
  const searchParams = useSearchParams();
  const { getCurrentPage, setCurrentPage } = usePagination(); // Get pagination functions
  const paginationKey = "latest-comics"; // Unique key for this page's pagination state
  
  // Track if we've already initialized from URL to prevent loops
  const initializedFromUrl = useRef(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [mangaList, setMangaList] = useState<MangaData[]>([]);
  const [allMangaData, setAllMangaData] = useState<MangaData[]>([]); // Store all manga data
  
  // Get page from URL or fallback to context/localStorage
  const [currentPage, setCurrentPageState] = useState(() => {
    // First try URL param
    const pageParam = searchParams.get('page');
    if (pageParam) {
      initializedFromUrl.current = true;
      const parsedPage = parseInt(pageParam, 10);
      return !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    }
    // No page param means we're on page 1
    initializedFromUrl.current = true;
    return 1;
  });
  
  // Track if this is a user-initiated page change
  const [isUserNavigation, setIsUserNavigation] = useState(false);
  
  const itemsPerPage = viewAll ? 18 : 9; // Show 9 items on homepage, 18 in view all mode

  // Update stored pagination state when currentPage changes, but only if not initialized from URL
  useEffect(() => {
    // Avoid updating the context if we just initialized from URL parameter
    if (!initializedFromUrl.current) {
      setCurrentPage(paginationKey, currentPage);
    }
    // Reset the flag after first render
    initializedFromUrl.current = false;
  }, [currentPage, setCurrentPage, paginationKey]);

  // Update URL when page changes - MODIFIED to prevent unnecessary updates and hide page=1
  useEffect(() => {
    // Only update URL if we're in a page that shows in browser history
    // and this isn't the first load (avoid polluting history on initial render)
    if (typeof window !== 'undefined' && window.history && !initializedFromUrl.current) {
      const url = new URL(window.location.href);
      const currentPageParam = url.searchParams.get('page');
      
      if (currentPage === 1) {
        // For page 1, remove the page parameter entirely
        url.searchParams.delete('page');
      } else {
        // For other pages, set the page parameter
        url.searchParams.set('page', currentPage.toString());
      }
      
      // Only update if the URL would actually change
      if (url.toString() !== window.location.href) {
        // Use pushState for user navigation to maintain proper history
        // Use replaceState for initial load/programmatic changes
        if (isUserNavigation) {
          window.history.pushState({}, '', url.toString());
        } else {
          window.history.replaceState({}, '', url.toString());
        }
      }
    }
  }, [currentPage, isUserNavigation]);

  useEffect(() => {
    // Create a debounce timer to avoid multiple rapid data fetches
    let debounceTimer: NodeJS.Timeout;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchLastUpdated();
        
        if (!data || data.length === 0) {
          console.log("No manga data received");
          setAllMangaData([]);
          setMangaList([]);
          setIsLoading(false);
          return;
        }
        
        // Process each manga to find the newest chapter
        const processedData = data.map(manga => {
          let latestChapter = null;
          let latestTimestamp = 0;
          
          // Find the newest chapter
          if (manga.chapters && manga.chapters.length > 0) {
            manga.chapters.forEach(chapter => {
              const dateStr = chapter.added_chap_date || chapter.added_date || chapter.release_date;
              const timestamp = getTimestampFromDate(dateStr);
              
              // If this chapter is newer than what we've seen so far
              if (timestamp > latestTimestamp) {
                latestTimestamp = timestamp;
                latestChapter = chapter;
              }
            });
          }
          
          // Return manga with additional sorting fields
          return {
            ...manga,
            _latestTimestamp: latestTimestamp,
            _latestChapterNumber: latestChapter ? latestChapter.number : 0,
            _debugLatestDate: latestTimestamp ? new Date(latestTimestamp).toISOString() : 'none'
          };
        });
        
        // Sort by most recent chapter first
        const sortedData = [...processedData].sort((a, b) => {
          // Sort by timestamp (newest first)
          return b._latestTimestamp - a._latestTimestamp;
        });
        
        // Process all the data for potential pagination
        const enhancedData = sortedData.map((manga) => {
          // Convert genre string to array if it exists
          let genreArray: string[] = [];
          
          if (Array.isArray(manga.genres) && manga.genres.length > 0) {
            // Use existing genres array if available
            genreArray = manga.genres;
          } else if (manga.genre && typeof manga.genre === 'string') {
            // Split by comma and trim whitespace
            genreArray = manga.genre.split(',').map((g: string) => g.trim());
          }
          
          // Format dates for chapters to relative time
          let formattedChapters = [];
          
          if (manga.chapters && manga.chapters.length > 0) {
            // Sort chapters by number (descending)
            formattedChapters = [...manga.chapters]
              .sort((a, b) => b.number - a.number)
              .map(chapter => {
                // Ensure we have a date for each chapter
                const dateStr = chapter.added_chap_date || chapter.added_date || chapter.release_date;
                let formattedDate = "Recently added";
                
                // Only format if we have a valid date
                if (dateStr) {
                  formattedDate = formatRelativeTime(dateStr);
                }
                
                return {
                  ...chapter,
                  formattedDate: formattedDate
                };
              });
          }
          
          return {
            ...manga,
            genres: genreArray.length > 0 ? genreArray : ["N/A"], // Fallback to N/A if no genres
            chapters: formattedChapters.length > 0 ? formattedChapters : manga.chapters
          };
        });
        
        setAllMangaData(enhancedData);
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, enhancedData.length);
        
        // Get current page items
        const currentPageItems = enhancedData.slice(startIndex, endIndex);
        setMangaList(currentPageItems);
        
      } catch (error) {
        console.error("Error loading manga data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the data loading to avoid excessive calls
    debounceTimer = setTimeout(() => {
      loadData();
    }, 300); // 300ms debounce time
    
    // Cleanup timer when component unmounts or dependencies change
    return () => {
      clearTimeout(debounceTimer);
    };
    
  }, [currentPage, itemsPerPage, viewAll]); // Keep these dependencies

  // Calculate total pages
  const totalPages = Math.ceil(allMangaData.length / itemsPerPage);

  // Function to change page
  const goToPage = (pageNumber: number) => {
    // Ensure page number is within valid range and not already the current page
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      // Set flag that this is a user-initiated navigation
      setIsUserNavigation(true);
      
      // Only update the state once - the useEffect hooks will handle context and URL updates
      setCurrentPageState(pageNumber);
      
      // Scroll to top of the section smoothly
      document.getElementById("latest-comics-section")?.scrollIntoView({ behavior: 'smooth' });
      
      // Reset the flag after a short delay
      setTimeout(() => {
        setIsUserNavigation(false);
      }, 100);
    }
  };

  // Generate page numbers to display (always show first, last, current, and 1 page before/after current)
  const getPageNumbers = () => {
    const pages = [];
    
    // Always add page 1
    pages.push(1);
    
    // Add ellipsis if current page is more than 3
    if (currentPage > 3) {
      pages.push('...');
    }
    
    // Add one page before current if it exists and is not 1
    if (currentPage - 1 > 1) {
      pages.push(currentPage - 1);
    }
    
    // Add current page if not 1 or last page
    if (currentPage !== 1 && currentPage !== totalPages) {
      pages.push(currentPage);
    }
    
    // Add one page after current if it exists and is not the last page
    if (currentPage + 1 < totalPages) {
      pages.push(currentPage + 1);
    }
    
    // Add ellipsis if current page is less than total pages - 2
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    
    // Always add last page if more than one page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="w-full" id="latest-comics-section">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF7F57]/20 to-[#FF9F57]/20 
              flex items-center justify-center border border-[#FF7F57]/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} 
                stroke="currentColor" className="w-4 h-4 text-[#FF7F57]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            Latest Updates
          </h2>
        <Link 
          href="/latestupdated" 
            className="text-white bg-gradient-to-r from-[#FF7F57] to-[#FF9F57] text-sm px-5 py-2 rounded-full hover:from-[#ff6a3d] hover:to-[#FF8F57] transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[#FF7F57]/20"
        >
          View All
        </Link>
        </div>
        
        {/* Blue glowing divider right after the heading */}
        <div className="relative mb-6">
          <div className="w-full h-px bg-[#FF7F57]/30"></div>
          <div className="absolute -top-[1px] left-0 w-1/3 h-[2px] bg-gradient-to-r from-[#FF7F57] to-[#FF9F57] rounded-full shadow-[0_0_10px_rgba(255,127,87,0.7)]"></div>
        </div>
      </div>

      <AnimatePresence mode="wait">
      {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-3 sm:gap-4"
          >
            {[...Array(itemsPerPage)].map((_, index) => (
            <div key={index} className="bg-[#222224] rounded-xl h-[120px] xs:h-[130px] animate-pulse flex">
              <div className="w-[110px] xs:w-[130px] bg-black rounded-l-xl"></div>
              <div className="flex-1 p-3 flex flex-col">
                <div className="w-3/4 h-4 bg-gray-800 rounded mb-2"></div>
                <div className="w-1/2 h-3 bg-gray-800 rounded"></div>
                <div className="mt-auto space-y-2">
                  <div className="w-full h-8 bg-gray-800 rounded-xl"></div>
                </div>
              </div>
            </div>
          ))}
          </motion.div>
      ) : mangaList.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[#222224] rounded-xl p-8 text-center"
          >
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-white text-lg font-medium mb-2">No Comics Found</h3>
            <p className="text-gray-400">We couldn't find any comics matching your criteria.</p>
          </motion.div>
      ) : (
          <>
            <motion.div 
              key={`page-${currentPage}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-3 sm:gap-4"
            >
          {mangaList.map((manga, index) => (
            <MangaCard
              key={manga.id}
              id={manga.id}
              title={manga.title}
              cover={manga.cover}
              rating={manga.rating || 4.5}
              status={manga.status || "ONGOING"}
              chapter={manga.chapter || "Chapter 1"}
              country={manga.country || "jp"}
              slug={manga.slug || manga.id}
              chapters={manga.chapters || [
                { 
                  number: manga.id === "the-perfect-male-lead" ? 25 : (manga.id === "the-demon-lord" ? 6 : 1), 
                  date: manga.chapters?.[0]?.added_chap_date || manga.chapters?.[0]?.added_date || manga.chapters?.[0]?.release_date || new Date(Date.now() - 86400000 * 2).toISOString(),
                  formattedDate: "2 days ago"
                },
                { 
                  number: manga.id === "the-perfect-male-lead" ? 24 : (manga.id === "the-demon-lord" ? 5 : 2), 
                  date: manga.chapters?.[1]?.added_chap_date || manga.chapters?.[1]?.added_date || manga.chapters?.[1]?.release_date || new Date(Date.now() - 86400000 * 4).toISOString(),
                  formattedDate: "4 days ago"
                }
              ]}
              genres={manga.genres || ["ACTION", "FANTASY"]}
                  has_chapters={true}
                  isFeature={index === 0} 
            />
          ))}
            </motion.div>
            
            {/* Pagination Controls - Only show when showPagination is true and there are multiple pages */}
            {showPagination && totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="bg-gradient-to-br from-[#12121a]/90 to-[#080810]/90 backdrop-blur-xl 
                  rounded-xl overflow-hidden border border-[#FF7F57]/10 shadow-lg p-2 inline-flex items-center">
                  
                  {/* Previous Page Button */}
                  <button 
                    onClick={() => goToPage(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mr-2 
                      ${currentPage === 1 
                        ? 'text-gray-600 cursor-not-allowed' 
                        : 'text-white/80 hover:text-white bg-[#16161f]/80 hover:bg-[#FF7F57]/20 border border-white/5 hover:border-[#FF7F57]/30 transition-all duration-300'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-2">
                    {getPageNumbers().map((pageNum, index) => (
                      pageNum === '...' ? (
                        <span key={`ellipsis-${index}`} className="text-gray-500 px-1">...</span>
                      ) : (
                        <button
                          key={`page-${pageNum}`}
                          onClick={() => goToPage(pageNum as number)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300
                            ${currentPage === pageNum 
                              ? 'bg-gradient-to-br from-[#FF7F57] to-[#FF9F57] text-white font-medium shadow-lg shadow-[#FF7F57]/20' 
                              : 'text-white/80 hover:text-white bg-[#16161f]/80 hover:bg-[#FF7F57]/20 border border-white/5 hover:border-[#FF7F57]/30'}`}
                        >
                          {pageNum}
                        </button>
                      )
                    ))}
                  </div>

                  {/* Next Page Button */}
                  <button 
                    onClick={() => goToPage(currentPage + 1)} 
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ml-2
                      ${currentPage === totalPages || totalPages === 0
                        ? 'text-gray-600 cursor-not-allowed' 
                        : 'text-white/80 hover:text-white bg-[#16161f]/80 hover:bg-[#FF7F57]/20 border border-white/5 hover:border-[#FF7F57]/30 transition-all duration-300'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LatestComics;
