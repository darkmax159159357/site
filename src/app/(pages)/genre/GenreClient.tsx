"use client";

import { useState, useEffect, useRef } from "react";
import BreadcumbPath from "@/components/ui/BreadcumbPath";
import { fetchAllMangaWithGenres } from "@/action/genreFilters";
import Navbar from "@/components/Navbar";
import MangaCard from "@/components/MangaCard";
import { motion, AnimatePresence } from "framer-motion";
import { FaSort, FaFilter, FaSearch, FaTimes } from "react-icons/fa";
import Link from "next/link";
import { usePagination } from "@/contexts/PaginationContext";
import { useSearchParams, useRouter } from "next/navigation";

type DataFetch = {
  id: string;
  title: string;
  cover: string;
  banner?: string;
  description?: string;
  genre?: string;
  genres?: string[];
  chapters?: any[];
};

const GenreClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getCurrentPage, setCurrentPage } = usePagination();
  const paginationKey = "genre";
  
  // Track component state
  const isInitialized = useRef(false);
  const filterChangeRef = useRef(false);
  // Add navigation flag to distinguish between filter changes and navigation
  const isNavigatingBack = useRef(false);
  
  // Get page from URL or fallback to context/localStorage
  const pageFromURL = searchParams.get('page');
  const initialPage = pageFromURL ? parseInt(pageFromURL, 10) : getCurrentPage(paginationKey);
  
  // State for data
  const [mangaList, setMangaList] = useState<DataFetch[]>([]);
  const [filteredList, setFilteredList] = useState<DataFetch[]>([]);
  const [displayedItems, setDisplayedItems] = useState<DataFetch[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenreFilter, setShowGenreFilter] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  
  // Filter state
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Current page state (initialized properly)
  const [currentPage, setCurrentPageState] = useState(initialPage);
  
  const itemsPerPage = 9;
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  // Detect navigation using the performance API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'navigation' in window.performance) {
      const nav = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (nav && nav.type === 'back_forward') {
        isNavigatingBack.current = true;
      }
    }
    
    // Mark the component as initialized after first render
    if (!isInitialized.current) {
      isInitialized.current = true;
    }
    
    return () => {
      // Reset navigation flag when component unmounts
      isNavigatingBack.current = false;
    };
  }, []);
  
  // Always keep the context updated with the current page
  useEffect(() => {
    // Save current page to context whenever it changes
    setCurrentPage(paginationKey, currentPage);
    
    // Only update URL if we're in a client environment and the component is initialized
    if (typeof window !== 'undefined' && isInitialized.current) {
      const url = new URL(window.location.href);
      const currentPageParam = url.searchParams.get('page');
      
      // Only update if the URL param doesn't already match the current page
      if (currentPageParam !== currentPage.toString()) {
        url.searchParams.set('page', currentPage.toString());
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [currentPage, paginationKey, setCurrentPage]);
  
  // Fetch data once on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const data = await fetchAllMangaWithGenres();
        setMangaList(data);
        
        // Extract all unique genres
        const allGenres = new Set<string>();
        data.forEach(item => {
          if (Array.isArray(item.genres)) {
            item.genres.forEach((genre: string) => {
              if (genre && genre !== "Unknown") {
                allGenres.add(genre);
              }
            });
          }
        });
        
        setAvailableGenres(Array.from(allGenres).sort());
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load genre data.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Apply filters and sort
  useEffect(() => {
    if (mangaList.length === 0) return;
    
    let result = [...mangaList];
    
    // Apply genre filter
    if (selectedGenres.length > 0) {
      result = result.filter(manga => {
        if (!manga.genres || !Array.isArray(manga.genres)) return false;
        return selectedGenres.some(genre => manga.genres?.includes(genre));
      });
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(manga => 
        manga.title.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    switch (sortOption) {
      case "title-asc":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "latest":
        // Assuming the first items in the array are the latest
        break;
      default:
        break;
    }
    
    setFilteredList(result);
    
    // Flag that filters have changed - only when not navigating back
    if (isInitialized.current && !isNavigatingBack.current) {
      filterChangeRef.current = true;
    }
  }, [mangaList, selectedGenres, sortOption, searchQuery]);
  
  // Handle filter changes and page resets
  useEffect(() => {
    // Skip if we haven't initialized or if we're navigating back
    if (!isInitialized.current || isNavigatingBack.current) {
      return;
    }
    
    // Only reset page if filters changed (not during initial load or navigation)
    if (filterChangeRef.current) {
      filterChangeRef.current = false;
      
      // Only reset if we're not already on page 1
      if (currentPage !== 1) {
        setCurrentPageState(1);
      }
    }
  }, [filteredList]);
  
  // Update displayed items based on current page
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredList.length);
    setDisplayedItems(filteredList.slice(startIndex, endIndex));
  }, [filteredList, currentPage, itemsPerPage]);
  
  // Function to change page - Updated to be more robust
  const goToPage = (pageNumber: number) => {
    // Ensure page number is valid and not already the current page
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      // Update state - the useEffect hook will handle updating context and URL
      setCurrentPageState(pageNumber);
      
      // Scroll to top of the section smoothly
      document.getElementById("genre-section")?.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Generate page numbers to display
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
  
  // Toggle genre selection
  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSelectedGenres([]);
    setSortOption("default");
    setSearchQuery("");
  };

  return (
    <>
      <div className="w-[90%] max-w-7xl mx-auto pb-32" id="genre-section">
        <BreadcumbPath />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5"
        >
          <h1 className="text-white text-2xl sm:text-3xl md:text-4xl text-center font-bold">
            Browse by Genre
          </h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base text-center max-w-3xl mx-auto">
            Explore our collection by genre, sort, and filter to find your next favorite read.
          </p>
        </motion.div>
        
        {/* Search, Filter and Sort Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {/* Search Input */}
          <div className="relative flex-grow col-span-1 lg:col-span-2">
            <input
              type="text"
              placeholder="Search titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e1e24] text-gray-200 px-4 py-3 pl-10 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>
            )}
          </div>
          
          {/* Filter Button */}
          <div className="col-span-1">
            <button 
              onClick={() => setShowGenreFilter(!showGenreFilter)}
              className={`w-full px-4 py-3 flex items-center justify-center space-x-2 rounded-xl shadow-lg ${showGenreFilter ? 'bg-green-600 text-white' : 'bg-[#1e1e24] text-gray-200'} hover:bg-green-500 hover:text-white transition-all duration-300`}
            >
              <FaFilter className={showGenreFilter ? 'text-white' : 'text-gray-400'} />
              <span>Filter by Genre {showGenreFilter ? '(Close)' : ''}</span>
            </button>
          </div>
          
          {/* Sort Button */}
          <div className="col-span-1 relative">
            <button 
              onClick={() => setShowSortOptions(!showSortOptions)}
              className={`w-full px-4 py-3 flex items-center justify-center space-x-2 rounded-xl shadow-lg ${showSortOptions ? 'bg-green-600 text-white' : 'bg-[#1e1e24] text-gray-200'} hover:bg-green-500 hover:text-white transition-all duration-300`}
            >
              <FaSort className={showSortOptions ? 'text-white' : 'text-gray-400'} />
              <span>Sort {sortOption !== 'default' ? '(Active)' : ''}</span>
            </button>
            
            {/* Sort Options Popup */}
            {showSortOptions && (
              <div className="absolute right-0 mt-2 w-full bg-[#1e1e24] rounded-xl shadow-xl z-10 overflow-hidden border border-green-500/20">
                <div className="p-3 space-y-2">
                  <button 
                    onClick={() => {setSortOption('default'); setShowSortOptions(false);}}
                    className={`w-full text-left px-3 py-2 rounded-lg ${sortOption === 'default' ? 'bg-green-500/20 text-green-400' : 'text-gray-300 hover:bg-[#252530]'}`}
                  >
                    Default
                  </button>
                  <button 
                    onClick={() => {setSortOption('title-asc'); setShowSortOptions(false);}}
                    className={`w-full text-left px-3 py-2 rounded-lg ${sortOption === 'title-asc' ? 'bg-green-500/20 text-green-400' : 'text-gray-300 hover:bg-[#252530]'}`}
                  >
                    Title (A-Z)
                  </button>
                  <button 
                    onClick={() => {setSortOption('title-desc'); setShowSortOptions(false);}}
                    className={`w-full text-left px-3 py-2 rounded-lg ${sortOption === 'title-desc' ? 'bg-green-500/20 text-green-400' : 'text-gray-300 hover:bg-[#252530]'}`}
                  >
                    Title (Z-A)
                  </button>
                  <button 
                    onClick={() => {setSortOption('latest'); setShowSortOptions(false);}}
                    className={`w-full text-left px-3 py-2 rounded-lg ${sortOption === 'latest' ? 'bg-green-500/20 text-green-400' : 'text-gray-300 hover:bg-[#252530]'}`}
                  >
                    Latest Updates
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Genre Filter Tags */}
        {showGenreFilter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-[#1e1e24] rounded-xl border border-green-500/10 shadow-lg"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-medium">Select Genres</h3>
              {selectedGenres.length > 0 && (
                <button 
                  onClick={clearFilters}
                  className="text-sm text-green-400 hover:text-green-300"
                >
                  Clear All Filters
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableGenres.map(genre => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedGenres.includes(genre)
                      ? 'bg-green-500 text-white'
                      : 'bg-[#252530] text-gray-300 hover:bg-[#2a2a35]'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Applied Filters Display */}
        {(selectedGenres.length > 0 || sortOption !== 'default' || searchQuery) && !showGenreFilter && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-gray-400 text-sm">Active filters:</span>
            
            {selectedGenres.map(genre => (
              <span 
                key={genre}
                className="bg-green-500/20 text-green-400 text-sm px-2 py-1 rounded-full flex items-center"
              >
                {genre}
                <button 
                  onClick={() => toggleGenre(genre)}
                  className="ml-1 text-green-400 hover:text-white"
                >
                  <FaTimes size={12} />
                </button>
              </span>
            ))}
            
            {sortOption !== 'default' && (
              <span className="bg-green-500/20 text-green-400 text-sm px-2 py-1 rounded-full flex items-center">
                Sort: {sortOption === 'title-asc' ? 'A-Z' : sortOption === 'title-desc' ? 'Z-A' : 'Latest'}
                <button 
                  onClick={() => setSortOption('default')}
                  className="ml-1 text-green-400 hover:text-white"
                >
                  <FaTimes size={12} />
                </button>
              </span>
            )}
            
            {searchQuery && (
              <span className="bg-green-500/20 text-green-400 text-sm px-2 py-1 rounded-full flex items-center">
                Search: {searchQuery}
                <button 
                  onClick={() => setSearchQuery('')}
                  className="ml-1 text-green-400 hover:text-white"
                >
                  <FaTimes size={12} />
                </button>
              </span>
            )}
            
            <button 
              onClick={clearFilters}
              className="text-sm text-green-400 hover:text-green-300 ml-auto"
            >
              Clear All
            </button>
          </div>
        )}
        
        {/* Main Content */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-10 py-20 text-center"
              >
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-green-500 border-r-2 border-green-500 border-b-2 border-transparent"></div>
                <p className="text-gray-400 mt-4">Loading genre data...</p>
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
                {displayedItems.length > 0 ? (
                  <motion.div
                    key={`genre-page-${currentPage}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-3 sm:gap-4"
                  >
                    {displayedItems.map((manga, index) => (
                    <motion.div
                      key={manga.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.3 }}
                    >
                      <MangaCard
                        id={manga.id}
                        title={manga.title}
                        cover={manga.cover}
                        rating={0}
                        status="ONGOING"
                        chapter={manga.chapters?.length ? `Chapter ${manga.chapters.length}` : ""}
                        country="jp"
                        slug={manga.id}
                        chapters={manga.chapters?.map((ch: any) => ({
                          number: ch.number,
                          title: ch.title,
                          date: ch.added_chap_date || ch.added_date || ch.release_date || new Date().toISOString(),
                          added_chap_date: ch.added_chap_date,
                          added_date: ch.added_date,
                          release_date: ch.release_date
                        })) || []}
                          genres={manga.genres || []}
                        has_chapters={true}
                      />
                    </motion.div>
                  ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 bg-[#12121a]/80 backdrop-blur-xl rounded-2xl border border-green-500/10 shadow-lg"
                  >
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-white text-lg font-medium mb-2">No manga found</h3>
                    <p className="text-gray-400">Try adjusting your filters or search terms.</p>
                  </motion.div>
                )}

                {/* Pagination Controls - Only show if there are items and more than one page */}
                {filteredList.length > 0 && totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="bg-gradient-to-br from-[#12121a]/90 to-[#080810]/90 backdrop-blur-xl 
                      rounded-xl overflow-hidden border border-green-500/10 shadow-lg p-2 inline-flex items-center">
                      
                      {/* Previous Page Button */}
                      <button 
                        onClick={() => goToPage(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center mr-2 
                          ${currentPage === 1 
                            ? 'text-gray-600 cursor-not-allowed' 
                            : 'text-white/80 hover:text-white bg-[#16161f]/80 hover:bg-green-500/20 border border-white/5 hover:border-green-500/30 transition-all duration-300'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center space-x-2">
                        {getPageNumbers().map((pageNum, index) => (
                          <div key={`page-${index}`}>
                            {pageNum === '...' ? (
                              <span className="w-10 h-10 flex items-center justify-center text-gray-400">...</span>
                            ) : (
                              <button
                                onClick={() => goToPage(pageNum as number)}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300
                                  ${currentPage === pageNum 
                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white font-medium shadow-lg shadow-green-500/20' 
                                    : 'text-white/80 hover:text-white bg-[#16161f]/80 hover:bg-green-500/20 border border-white/5 hover:border-green-500/30'}`}
                              >
                                {pageNum}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Next Page Button */}
                      <button 
                        onClick={() => goToPage(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ml-2 
                          ${currentPage === totalPages 
                            ? 'text-gray-600 cursor-not-allowed' 
                            : 'text-white/80 hover:text-white bg-[#16161f]/80 hover:bg-green-500/20 border border-white/5 hover:border-green-500/30 transition-all duration-300'}`}
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
      </div>
    </>
  );
};

export default GenreClient; 