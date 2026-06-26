"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaSort, FaFilter, FaSearch, FaTimes, FaTags } from "react-icons/fa";
import Navbar from "@/components/Navbar";
import MangaCard from "@/components/MangaCard";
import BreadcumbPath from "@/components/ui/BreadcumbPath";

type MangaData = {
  id: string;
  title: string;
  cover: string;
  banner?: string;
  description?: string;
  genre?: string;
  genres?: string[];
  chapters?: any[];
  slug?: string;
  status?: string;
  rating?: number;
};

interface TagClientProps {
  manga: MangaData[];
  tag: string;
  allGenres: string[];
}

const TagClient = ({ manga, tag, allGenres }: TagClientProps) => {
  const [filteredManga, setFilteredManga] = useState<MangaData[]>(manga);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([tag]);
  const [showGenreFilter, setShowGenreFilter] = useState(false);
  const [sortOption, setSortOption] = useState("default");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Filter and sort manga when dependencies change
  useEffect(() => {
    if (!isClient) return;

    let result = [...manga];
    
    // Apply genre filter if any additional genres are selected
    if (selectedGenres.length > 0) {
      result = result.filter(item => {
        if (!item.genres || !Array.isArray(item.genres)) return false;
        return selectedGenres.every(genre => 
          item.genres?.some(g => g.toLowerCase() === genre.toLowerCase())
        );
      });
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(query)
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
      case "chapters-desc":
        result.sort((a, b) => 
          (b.chapters?.length || 0) - (a.chapters?.length || 0)
        );
        break;
      default:
        // Default sorting
        break;
    }
    
    setFilteredManga(result);
  }, [manga, selectedGenres, sortOption, searchQuery, isClient, tag]);

  // Toggle genre selection
  const toggleGenre = (genre: string) => {
    // Always keep the main tag selected
    if (genre.toLowerCase() === tag.toLowerCase()) return;
    
    setSelectedGenres(prev => 
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  // Get genres excluding the main tag
  const otherGenres = allGenres.filter(
    genre => genre.toLowerCase() !== tag.toLowerCase()
  );

  // Clear filters except the main tag
  const clearFilters = () => {
    setSelectedGenres([tag]);
    setSortOption("default");
    setSearchQuery("");
  };

  return (
    <>
      <div className="w-[90%] max-w-7xl mx-auto pb-32">
        <BreadcumbPath />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5"
        >
          <h1 className="text-white text-2xl sm:text-3xl md:text-4xl text-center font-bold">
            <FaTags className="inline-block mr-2 mb-1" />
            {tag} <span className="text-orange-500">Manga</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base text-center max-w-3xl mx-auto">
            Found {filteredManga.length} titles tagged with &quot;{tag}&quot;. 
            Explore our collection of {tag.toLowerCase()} manga and manhwa titles.
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
              className="w-full bg-[#1e1e24] text-gray-200 px-4 py-3 pl-10 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300"
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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowGenreFilter(!showGenreFilter)}
            className={`px-4 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors duration-300 ${
              selectedGenres.length > 1 ? 'bg-orange-500 text-white' : 'bg-[#1e1e24] text-gray-200 hover:bg-[#2a2a36]'
            }`}
          >
            <FaFilter />
            <span>Filter {selectedGenres.length > 1 && `(${selectedGenres.length})`}</span>
          </motion.button>
          
          {/* Sort Button */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSortOptions(!showSortOptions)}
              className="w-full px-4 py-3 rounded-xl shadow-lg bg-[#1e1e24] text-gray-200 flex items-center justify-center gap-2 hover:bg-[#2a2a36] transition-colors duration-300"
            >
              <FaSort />
              <span>Sort</span>
            </motion.button>
            
            {/* Sort Options Dropdown */}
            <AnimatePresence>
              {showSortOptions && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-[#1e1e24] rounded-xl shadow-lg z-10 border border-gray-700 overflow-hidden"
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setSortOption("default");
                        setShowSortOptions(false);
                      }}
                      className={`block w-full text-left px-4 py-3 text-sm ${
                        sortOption === "default" ? "text-orange-500 bg-[#2a2a36]" : "text-gray-200"
                      } hover:bg-[#2a2a36] transition-colors duration-200`}
                    >
                      Default
                    </button>
                    <button
                      onClick={() => {
                        setSortOption("title-asc");
                        setShowSortOptions(false);
                      }}
                      className={`block w-full text-left px-4 py-3 text-sm ${
                        sortOption === "title-asc" ? "text-orange-500 bg-[#2a2a36]" : "text-gray-200"
                      } hover:bg-[#2a2a36] transition-colors duration-200`}
                    >
                      Title (A-Z)
                    </button>
                    <button
                      onClick={() => {
                        setSortOption("title-desc");
                        setShowSortOptions(false);
                      }}
                      className={`block w-full text-left px-4 py-3 text-sm ${
                        sortOption === "title-desc" ? "text-orange-500 bg-[#2a2a36]" : "text-gray-200"
                      } hover:bg-[#2a2a36] transition-colors duration-200`}
                    >
                      Title (Z-A)
                    </button>
                    <button
                      onClick={() => {
                        setSortOption("chapters-desc");
                        setShowSortOptions(false);
                      }}
                      className={`block w-full text-left px-4 py-3 text-sm ${
                        sortOption === "chapters-desc" ? "text-orange-500 bg-[#2a2a36]" : "text-gray-200"
                      } hover:bg-[#2a2a36] transition-colors duration-200`}
                    >
                      Most Chapters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        
        {/* Genre Filter Panel */}
        <AnimatePresence>
          {showGenreFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 bg-[#1e1e24] rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-semibold">Filter by Genre</h3>
                  {selectedGenres.length > 1 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-orange-500 hover:text-orange-400"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {/* Main tag always selected */}
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 rounded-full bg-orange-500 text-white text-sm cursor-default flex items-center"
                  >
                    {tag}
                  </motion.div>
                  
                  {/* Other available genres */}
                  {otherGenres.map((genre) => (
                    <motion.button
                      key={genre}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleGenre(genre)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors duration-200 ${
                        selectedGenres.includes(genre)
                          ? "bg-[#2a2a36] text-orange-500 font-medium"
                          : "bg-[#2a2a36] text-gray-300 hover:bg-[#353542]"
                      }`}
                    >
                      {genre}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Clear Filters Button - Only show if filters are applied */}
        {(selectedGenres.length > 1 || sortOption !== "default" || searchQuery) && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-red-500 text-white shadow-lg mx-auto block hover:bg-red-600 transition-colors duration-300"
          >
            Clear All Filters
          </motion.button>
        )}
        
        {/* Manga Grid */}
        <div className="mt-8">
          {filteredManga.length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 auto-rows-fr gap-2 xs:gap-3 sm:gap-4 mt-5">
              {filteredManga.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="h-full"
                >
                  <MangaCard
                    id={item.id}
                    title={item.title}
                    cover={item.cover}
                    rating={item.rating || 0}
                    status={item.status as any || "ONGOING"}
                    chapter={item.chapters?.length ? `Chapter ${item.chapters.length}` : "N/A"}
                    country="jp"
                    slug={item.slug || item.id}
                    chapters={item.chapters?.map((ch: any) => ({
                      number: ch.number,
                      title: ch.title,
                      date: ch.added_chap_date || ch.added_date || ch.release_date || new Date().toISOString(),
                      added_chap_date: ch.added_chap_date,
                      added_date: ch.added_date,
                      release_date: ch.release_date
                    })) || []}
                    genres={item.genres}
                    has_chapters={true}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <h3 className="text-xl text-white mb-2">No manga found</h3>
              <p className="text-gray-400">
                Try adjusting your filters or search terms.
              </p>
            </motion.div>
          )}
        </div>
        
        {/* More Genres Section */}
        <div className="mt-16">
          <h2 className="text-xl text-white font-semibold mb-4">Explore More Genres</h2>
          <div className="flex flex-wrap gap-3">
            {allGenres.slice(0, 15).map(genre => (
              <Link
                key={genre}
                href={`/tag/${encodeURIComponent(genre.toLowerCase())}`}
                className={`px-4 py-2 rounded-xl text-sm transition-all duration-300 ${
                  genre.toLowerCase() === tag.toLowerCase()
                    ? "bg-orange-500 text-white font-medium"
                    : "bg-[#1e1e24] text-gray-300 hover:bg-[#2a2a36] hover:text-white hover:scale-105"
                }`}
              >
                {genre}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default TagClient; 