"use client";

import BreadcumbPath from "@/components/ui/BreadcumbPath";
import { fetchPornhwa } from "@/action/genreFilters";
import MangaCard from "@/components/MangaCard";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePagination } from "@/contexts/PaginationContext";
import { useSearchParams } from "next/navigation";

const PornhwaClient = () => {
  const searchParams = useSearchParams();
  const { getCurrentPage, setCurrentPage } = usePagination();
  const paginationKey = "pornhwa";
  
  const [getData, setGetData] = useState<any[]>([]);
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
  
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const itemsPerPage = 6;

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
        console.log("Fetching Pornhwa content...");
        const data = await fetchPornhwa();
        console.log("Fetched Pornhwa Data:", data);
        setGetData(data);
      } catch (error) {
        console.error("Error fetching Pornhwa data:", error);
        setError("Failed to load Pornhwa content.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate pagination and apply it to filtered data
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, getData.length);
    setFilteredData(getData.slice(startIndex, endIndex));
  }, [getData, currentPage]);

  // Calculate total pages
  const totalPages = Math.ceil(getData.length / itemsPerPage);

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
      document.getElementById("pornhwa-section")?.scrollIntoView({ behavior: 'smooth' });
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
    <div className="w-[90%] m-auto mb-32" id="pornhwa-section">
      <BreadcumbPath />
      <div className="mt-5">
        <h1 className="text-white text-2xl sm:text-3xl text-center">
          Pornhwa Content
        </h1>
        <p className="text-gray-400 mt-2 text-sm text-center">
          Adult Korean comics with mature themes.
        </p>
        
        {/* Pink/Rose glowing divider */}
        <div className="relative mt-4 mb-6">
          <div className="w-full h-px bg-pink-500/30"></div>
          <div className="absolute -top-[1px] left-0 w-1/3 h-[2px] bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.7)]"></div>
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
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-pink-500 border-r-2 border-pink-500 border-b-2 border-transparent"></div>
            <p className="text-gray-400 mt-4">Loading Pornhwa content...</p>
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
              key={`pornhwa-page-${currentPage}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 mt-5"
            >
              {filteredData.map((item) => (
                <MangaCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  cover={item.cover}
                  rating={4.5}
                  status="ONGOING"
                  chapter="Chapter 1"
                  country="kr"
                  slug={item.id}
                  chapters={item.chapters.map((ch: { number: number, added_date?: string, added_chap_date?: string, release_date?: string, title?: string }) => ({
                    number: ch.number,
                    title: ch.title,
                    date: ch.added_chap_date || ch.added_date || ch.release_date || new Date().toISOString(),
                    added_chap_date: ch.added_chap_date,
                    added_date: ch.added_date,
                    release_date: ch.release_date
                  }))}
                  genres={Array.isArray(item.genres) && item.genres.length > 0 ? item.genres : 
                         (item.genre && typeof item.genre === 'string' ? item.genre.split(',').map((g: string) => g.trim()) : ["Pornhwa"])}
                  has_chapters={true}
                />
              ))}
            </motion.div>

            {!loading && filteredData.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 bg-[#12121a]/80 backdrop-blur-xl rounded-2xl border border-pink-500/10 shadow-lg"
              >
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-white text-lg font-medium mb-2">No Pornhwa Content Found</h3>
                <p className="text-gray-400">Check back later for updates.</p>
              </motion.div>
            )}
            
            {/* Pagination Controls - Game-inspired Design */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="bg-gradient-to-br from-[#12121a]/90 to-[#080810]/90 backdrop-blur-xl 
                  rounded-xl overflow-hidden border border-pink-500/10 shadow-lg p-2 inline-flex items-center">
                  
                  {/* Previous Page Button */}
                  <button 
                    onClick={() => goToPage(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mr-2 
                      ${currentPage === 1 
                        ? 'text-gray-600 cursor-not-allowed' 
                        : 'text-white/80 hover:text-white bg-[#16161f]/80 hover:bg-pink-500/20 border border-white/5 hover:border-pink-500/30 transition-all duration-300'}`}
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
                              ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white font-medium shadow-lg shadow-pink-500/20' 
                              : 'text-white/80 hover:text-white bg-[#16161f]/80 hover:bg-pink-500/20 border border-white/5 hover:border-pink-500/30'}`}
                        >
                          {pageNum}
                        </button>
                      )
                    ))}
                  </div>

                  {/* Next Page Button */}
                  <button 
                    onClick={() => goToPage(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ml-2 
                      ${currentPage === totalPages 
                        ? 'text-gray-600 cursor-not-allowed' 
                        : 'text-white/80 hover:text-white bg-[#16161f]/80 hover:bg-pink-500/20 border border-white/5 hover:border-pink-500/30 transition-all duration-300'}`}
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

export default PornhwaClient; 