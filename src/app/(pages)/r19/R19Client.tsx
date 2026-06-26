"use client";

import BreadcumbPath from "@/components/ui/BreadcumbPath";
import { fetchR19Manga } from "@/action/genreFilters";
import MangaCard from "@/components/MangaCard";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePagination } from "@/contexts/PaginationContext";
import { useRouter, useSearchParams } from "next/navigation";

const R19Client = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getCurrentPage, setCurrentPage } = usePagination();
  const paginationKey = "r19";
  
  const [getData, setGetData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const itemsPerPage = 9;

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
        console.log("Fetching R19 content...");
        const data = await fetchR19Manga();
        console.log("Fetched R19 Data:", data);
        setGetData(data);
      } catch (error) {
        console.error("Error fetching R19 data:", error);
        setError("Failed to load R19 content.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, getData.length);
    setFilteredData(getData.slice(startIndex, endIndex));
  }, [getData, currentPage]);

  const totalPages = Math.ceil(getData.length / itemsPerPage);

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      // Update state and context
      setCurrentPageState(pageNumber);
      setCurrentPage(paginationKey, pageNumber);
      
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('page', pageNumber.toString());
      window.history.replaceState({}, '', url.toString());
      
      document.getElementById("r19-section")?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    
    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('...');
    }
    
    if (currentPage - 1 > 1) {
      pages.push(currentPage - 1);
    }
    
    if (currentPage !== 1 && currentPage !== totalPages) {
      pages.push(currentPage);
    }
    
    if (currentPage + 1 < totalPages) {
      pages.push(currentPage + 1);
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="w-[90%] m-auto mb-32" id="r19-section">
      <BreadcumbPath />
      <div className="mt-5">
        <h1 className="text-white text-2xl sm:text-3xl text-center">
          R19 Content
        </h1>
        <p className="text-gray-400 mt-2 text-sm text-center">
          Content with age restrictions. Must be 18+ to view.
        </p>
        
        <div className="relative mt-4 mb-6">
          <div className="w-full h-px bg-purple-500/30"></div>
          <div className="absolute -top-[1px] left-0 w-1/3 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.7)]"></div>
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
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-purple-500 border-r-2 border-purple-500 border-b-2 border-transparent"></div>
            <p className="text-gray-400 mt-4">Loading R19 content...</p>
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
              key={`r19-page-${currentPage}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 mt-5"
            >
              {filteredData.map((item, index) => (
                <div key={item.id || index}>
                  <MangaCard
                    id={item.id}
                    title={item.title}
                    cover={item.cover}
                    rating={4.5}
                    status="ONGOING"
                    chapter="Chapter 1"
                    country="jp"
                    slug={item.id}
                    chapters={item.chapters.map((ch: { number: number, added_date?: string, added_chap_date?: string, release_date?: string, title?: string }) => ({
                      number: ch.number,
                      title: ch.title || `Chapter ${ch.number}`,
                      date: ch.added_chap_date || ch.added_date || ch.release_date || new Date().toISOString(),
                      added_chap_date: ch.added_chap_date,
                      added_date: ch.added_date,
                      release_date: ch.release_date
                    }))}
                    genres={Array.isArray(item.genres) && item.genres.length > 0 ? item.genres : 
                           (item.genre && typeof item.genre === 'string' ? item.genre.split(',').map((g: string) => g.trim()) : ["R19"])}
                    has_chapters={true}
                  />
                </div>
              ))}
            </motion.div>

            {!loading && filteredData.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 bg-[#12121a]/80 backdrop-blur-xl rounded-2xl border border-purple-500/10 shadow-lg"
              >
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-white text-lg font-medium mb-2">No R19 Content Found</h3>
                <p className="text-gray-400">Check back later for updates.</p>
              </motion.div>
            )}
            
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="bg-gradient-to-br from-[#12121a]/90 to-[#080810]/90 backdrop-blur-xl 
                  rounded-xl overflow-hidden border border-purple-500/10 shadow-lg p-2 inline-flex items-center">
                  
                  <button 
                    onClick={() => goToPage(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mr-2 
                      ${currentPage === 1 
                        ? 'text-gray-600 cursor-not-allowed' 
                        : 'text-white/80 hover:text-white bg-[#16161f]/80 hover:bg-purple-500/20 border border-white/5 hover:border-purple-500/30 transition-all duration-300'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  
                  <div className="flex space-x-2">
                    {getPageNumbers().map((page, index) => (
                      <div key={`page-${index}`}>
                        {page === '...' ? (
                          <span className="w-10 h-10 flex items-center justify-center text-gray-400">...</span>
                        ) : (
                          <button
                            onClick={() => goToPage(page as number)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center
                              ${currentPage === page
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                                : 'text-white/80 hover:text-white bg-[#16161f]/80 hover:bg-purple-500/20 border border-white/5 hover:border-purple-500/30 transition-all duration-300'}`}
                          >
                            {page}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => goToPage(currentPage + 1)} 
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ml-2
                      ${currentPage === totalPages || totalPages === 0
                        ? 'text-gray-600 cursor-not-allowed' 
                        : 'text-white/80 hover:text-white bg-[#16161f]/80 hover:bg-purple-500/20 border border-white/5 hover:border-purple-500/30 transition-all duration-300'}`}
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

export default R19Client; 