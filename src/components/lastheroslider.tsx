"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchLastUpdated } from '@/action/fetchKomik';

// Define the type for manga data
interface MangaItem {
  id: string;
  title: string;
  cover: string;
  rating?: number;
  status?: "ONGOING" | "COMPLETED" | "RELEASED";
  chapter?: string;
  country?: string;
  slug?: string;
  description?: string;
  genres?: string[];
  chapters?: any[];
  banner?: string;
}

const AnimeHeroSlider = () => {
  const [selectedManga, setSelectedManga] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Fetch manga data directly using the server action
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchLastUpdated();
        if (data && data.length > 0) {
          // Select manga for the hero slider
          const selected = data.slice(0, 5).map((item) => ({
            ...item,
            cover: item.cover,
            banner: item.banner || item.cover,
            rating: item.rating || (4.5 + (Math.random() * 0.5)),
            status: item.type?.toUpperCase() || ["ONGOING", "COMPLETED", "RELEASED"][Math.floor(Math.random() * 3)] as "ONGOING" | "COMPLETED" | "RELEASED",
            slug: item.id,
            genres: Array.isArray(item.genres) && item.genres.length > 0 ? item.genres : 
                   (item.genre && typeof item.genre === 'string' ? item.genre.split(',').map((g: string) => g.trim()) : ["Action", "Fantasy"]),
            chapter: item.chapters && item.chapters.length > 0 
              ? item.chapters[item.chapters.length - 1].number.toString() 
              : "1"
          }));
          setSelectedManga(selected);
        }
      } catch (error) {
        console.error("Error fetching manga data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Auto-advance slides every 6 seconds
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % (selectedManga.length || 1));
    }, 6000);
    
    return () => clearInterval(interval);
  }, [selectedManga.length]);

  // Navigation handlers
  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % selectedManga.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + selectedManga.length) % selectedManga.length);
  };

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
  };

  if (loading) {
    return (
      <div className="w-full h-[450px] bg-gray-900 rounded-lg overflow-hidden flex justify-center items-center">
        {/* Simple clean loading animation */}
        <motion.div 
          animate={{ 
            rotate: 360,
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="w-12 h-12 rounded-full border-t-2 border-r-2 border-white"
        />
      </div>
    );
  }

  if (!selectedManga.length) {
    return (
      <div className="w-full h-[450px] bg-gray-900 rounded-lg overflow-hidden flex justify-center items-center">
        <div className="text-white text-lg font-medium">No content available</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[450px] bg-gray-900 rounded-lg overflow-hidden relative">
      {/* Main slider container with grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 h-full">
        {/* Left content side */}
        <div className="relative flex items-center p-6 md:p-12 z-10 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${activeIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              {/* Animated accent line - anime style */}
              <motion.div 
                className="w-16 h-1 bg-red-500 mb-4"
                layoutId="accent-line"
              />
              
              {/* Title with Japanese-inspired typography */}
              <h2 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold mb-3 leading-tight">
                {selectedManga[activeIndex].title}
              </h2>
              
              {/* Status and ratings - minimal clean design */}
              <div className="flex flex-wrap gap-4 items-center mb-4">
                <div className="px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded">
                  {selectedManga[activeIndex].status}
                </div>
                
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-400">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white text-sm">
                    {selectedManga[activeIndex].rating?.toFixed(1)}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-400">
                    <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                  </svg>
                  <span className="text-white text-sm">
                    Chapter {selectedManga[activeIndex].chapter}
                  </span>
                </div>
              </div>
              
              {/* Genres with clean styling */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedManga[activeIndex].genres?.slice(0, 3).map((genre, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 bg-gray-800 text-gray-200 text-xs rounded-md"
                  >
                    {genre}
                  </span>
                ))}
              </div>
              
              {/* Description with clean typography */}
              <p className="text-gray-300 text-sm md:text-base mb-6 line-clamp-3">
                {selectedManga[activeIndex].description || 
                 "Experience this thrilling story with stunning artwork and an engaging narrative that will keep you hooked from start to finish."}
              </p>
              
              {/* Simple clean button */}
              <Link href={`/manga/${selectedManga[activeIndex].slug || selectedManga[activeIndex].id}`}>
                <motion.button 
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-md flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  Read Now
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </motion.button>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Right image side with anime-style presentation */}
        <div className="relative hidden md:block">
          {/* Main image showcase */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={`image-${activeIndex}`}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative h-full w-full">
                {/* Main visual with subtle dark gradient overlay */}
                <Image 
                  src={selectedManga[activeIndex].banner}
                  alt={selectedManga[activeIndex].title}
                  fill
                  className="object-cover"
                  sizes="50vw"
                  priority
                  quality={90}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/fallback-image.svg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-transparent"></div>
                
                {/* Cover image floating on top */}
                <div className="absolute bottom-10 right-10 w-[120px] h-[170px] shadow-2xl">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="relative w-full h-full rounded-md overflow-hidden border border-white/10"
                  >
                    <Image 
                      src={selectedManga[activeIndex].cover}
                      alt={selectedManga[activeIndex].title}
                      fill
                      className="object-cover"
                      sizes="120px"
                      quality={90}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/fallback-image.svg';
                      }}
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Simple decorative elements */}
          <div className="absolute top-10 right-10 h-16 w-0.5 bg-red-500/50"></div>
          <div className="absolute bottom-32 right-32 h-0.5 w-16 bg-red-500/50"></div>
        </div>
      </div>
      
      {/* Navigation controls - clean minimal style */}
      <div className="absolute bottom-6 left-6 flex items-center gap-4 z-20">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <motion.button 
            className="w-8 h-8 flex items-center justify-center text-white border border-white/20 rounded-full"
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrev}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </motion.button>
          
          <motion.button 
            className="w-8 h-8 flex items-center justify-center text-white border border-white/20 rounded-full"
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </motion.button>
        </div>
        
        {/* Page indicator */}
        <div className="text-sm text-white/70 font-medium">
          <span className="text-white">{activeIndex + 1}</span>
          <span className="mx-1">/</span>
          <span>{selectedManga.length}</span>
        </div>
        
        {/* Dots indicator */}
        <div className="flex items-center gap-1">
          {selectedManga.map((_, index) => (
            <button 
              key={index}
              onClick={() => handleDotClick(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === activeIndex ? 'bg-red-500' : 'bg-white/30'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimeHeroSlider; 