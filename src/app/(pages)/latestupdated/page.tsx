"use client";

import BreadcumbPath from "@/components/ui/BreadcumbPath";
import { fetchLastUpdated } from "@/action/fetchKomik";
import MangaCard from "@/components/MangaCard";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Content2 } from '@/components/ads/AdPositions';
import { usePagination } from "@/contexts/PaginationContext";
import { useSearchParams } from "next/navigation";

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

const Page = () => {
  const searchParams = useSearchParams();
  const { getCurrentPage, setCurrentPage } = usePagination();
  const paginationKey = "latestupdated";
  
  const [allMangaData, setAllMangaData] = useState<any[]>([]);
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get page from URL or fallback to context/localStorage
  const [currentPage, setCurrentPageState] = useState(() => {
    // First try URL param
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const parsedPage = parseInt(pageParam, 10);
      return !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    }
    // Then try context
    return getCurrentPage(paginationKey);
  });
  
  const itemsPerPage = 9;

  // Update context when page changes
  useEffect(() => {
    setCurrentPage(paginationKey, currentPage);
  }, [currentPage, setCurrentPage, paginationKey]);

  // Update URL when page changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', currentPage.toString());
    window.history.replaceState({}, '', url.toString());
  }, [currentPage]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await fetchLastUpdated();
        
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
            _latestChapterNumber: latestChapter ? latestChapter.number : 0
          };
        });
        
        // Sort by most recent chapter first
        const sortedData = [...processedData].sort((a, b) => {
          // Sort by timestamp (newest first)
          return b._latestTimestamp - a._latestTimestamp;
        });
        
        // Process the data to ensure genres are properly formatted and chapters have time information
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
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load manga updates.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate pagination whenever all manga data or current page changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, allMangaData.length);
    setMangaList(allMangaData.slice(startIndex, endIndex));
  }, [allMangaData, currentPage]);

  // Calculate total pages
  const totalPages = Math.ceil(allMangaData.length / itemsPerPage);

  // Function to change page
  const goToPage = (pageNumber: number) => {
    // Ensure page number is within valid range
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      // Update state and context
      setCurrentPageState(pageNumber);
      setCurrentPage(paginationKey, pageNumber);
      
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('page', pageNumber.toString());
      window.history.replaceState({}, '', url.toString());
      
      // Scroll to top of the section smoothly
      document.getElementById("latest-updates-section")?.scrollIntoView({ behavior: 'smooth' });
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
    <div className="w-[90%] m-auto mb-32" id="latest-updates-section">
      <BreadcumbPath />
      <div className="mt-5">
        <h1 className="text-white text-2xl sm:text-3xl text-center flex items-center justify-center gap-2">
          Latest Updated
        </h1>
        <div className="mt-4">
          <Content2 />
        </div>
        
        {/* Orange glowing divider */}
        <div className="relative mt-4 mb-6">
          <div className="w-full h-px bg-[#FF7F57]/30"></div>
          <div className="absolute -top-[1px] left-0 w-1/3 h-[2px] bg-gradient-to-r from-[#FF7F57] to-[#FF9F57] rounded-full shadow-[0_0_10px_rgba(255,127,87,0.7)]"></div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center mt-10 py-20"
          >
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-[#FF7F57] border-r-2 border-[#FF7F57] border-b-2 border-transparent"></div>
            <p className="text-gray-400 mt-4">Loading manga updates...</p>
          </motion.div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-red-500 mt-10 py-20"
          >
            {error}
          </motion.div>
        ) : (
          <>
            <motion.div 
              key={`updates-page-${currentPage}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 mt-5"
            >
              {mangaList.map((manga, index) => (
                <MangaCard
                  key={manga.id}
                  id={manga.id}
                  title={manga.title}
                  cover={manga.cover}
                  rating={manga.rating ? parseFloat(manga.rating) : 4.5}
                  status={manga.status || "ONGOING"}
                  chapter={manga.chapter || "Chapter 1"}
                  country={manga.country || "jp"}
                  slug={manga.slug || manga.manga_slug || manga.id}
                  chapters={manga.chapters || []}
                  genres={manga.genres || ["ACTION", "FANTASY"]}
                  has_chapters={true}
                  isFeature={index === 0} // Highlight the first/latest manga
                />
              ))}
            </motion.div>

            {!loading && mangaList.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 bg-[#12121a]/80 backdrop-blur-xl rounded-2xl border border-[#FF7F57]/10 shadow-lg"
              >
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-white text-lg font-medium mb-2">No Manga Updates Found</h3>
                <p className="text-gray-400">Check back later for updates.</p>
              </motion.div>
            )}
            
            {/* Pagination Controls - Game-inspired Design */}
            {totalPages > 1 && (
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

export default Page;
