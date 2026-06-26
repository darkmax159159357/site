"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

interface MangaItem {
  id: string;
  mangaId: string;
  title: string;
  cover: string;
  viewCount: number;
  type?: string;
  language?: string;
  isNew?: boolean;
  genres?: string[];
  genre?: string;
}

const TrendingSection = () => {
  const [trendingManga, setTrendingManga] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchTrendingManga = async () => {
      setLoading(true);
      try {
        // Query the manga_views collection, ordering by viewCount in descending order
        const mangaViewsRef = collection(db, 'manga_views');
        const q = query(mangaViewsRef, orderBy('viewCount', 'desc'), limit(7));
        const querySnapshot = await getDocs(q);
        
        const mangaData: MangaItem[] = [];
        
        // Get IDs of all manga in the query
        const mangaIds: string[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as MangaItem;
          mangaIds.push(data.mangaId || doc.id);
        });
        
        // Fetch manga JSON data to get genres
        const response = await fetch('/Medusa/manga/manga.json');
        const allManga = await response.json();
        const mangaGenresMap = new Map();
        
        allManga.forEach((manga: any) => {
          if (mangaIds.includes(manga.id)) {
            mangaGenresMap.set(manga.id, {
              genres: manga.genres || [],
              type: manga.type || 'Manhwa'
            });
          }
        });
        
        // Create the final manga data with genres
        querySnapshot.forEach((doc) => {
          const data = doc.data() as MangaItem;
          const mangaId = data.mangaId || doc.id;
          const mangaInfo = mangaGenresMap.get(mangaId);
          
          mangaData.push({
            id: doc.id,
            mangaId: mangaId,
            title: data.title || 'Unknown Title',
            cover: data.cover || '/fallback-image.svg',
            viewCount: data.viewCount || 0,
            type: mangaInfo?.type || 'Manhwa',
            language: 'English',
            genres: mangaInfo?.genres || []
          });
        });
        
        setTrendingManga(mangaData);
        console.log('Fetched trending manga:', mangaData);
      } catch (error) {
        console.error('Error fetching trending manga from Firebase:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingManga();
  }, []);

  // Auto scroll functionality
  const scrollStep = useCallback(() => {
    if (!sliderRef.current || isAutoScrollPaused) return;
    
    const scrollAmount = 1; // Pixels to scroll each step
    sliderRef.current.scrollLeft += scrollAmount;
    
    // If reached the end, reset to beginning
    if (sliderRef.current.scrollLeft >= sliderRef.current.scrollWidth - sliderRef.current.clientWidth - 10) {
      sliderRef.current.scrollLeft = 0;
    }
  }, [isAutoScrollPaused]);

  // Set up auto scroll
  useEffect(() => {
    const interval = setInterval(() => {
      scrollStep();
    }, 30); // Adjust timing for smoother or faster scrolling

    return () => {
      clearInterval(interval);
    };
  }, [scrollStep]);

  // Handle mouse interaction with auto-scroll
  const pauseAutoScroll = useCallback(() => {
    setIsAutoScrollPaused(true);
    
    // Clear any existing resume timer
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }
    
    // Resume auto-scroll after 2 seconds of no interaction
    interactionTimerRef.current = setTimeout(() => {
      setIsAutoScrollPaused(false);
    }, 2000);
  }, []);

  // Mouse event handlers for draggable slider
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    
    pauseAutoScroll();
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    
    e.preventDefault();
    pauseAutoScroll();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Multiply for faster scrolling
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (autoScrollTimerRef.current) clearTimeout(autoScrollTimerRef.current);
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    };
  }, []);

  // Format view count for display
  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Get appropriate tag based on genres
  const getSpecialTag = (genres: string[] = []) => {
    if (!genres.length) return null;
    
    const normalizedGenres = genres.map(genre => genre.toLowerCase());
    
    if (normalizedGenres.includes('r-19')) {
      return {
        text: "R-19",
        color: "bg-red-500/80"
      };
    } else if (normalizedGenres.includes('pornhwa')) {
      return {
        text: "Pornhwa",
        color: "bg-pink-500/80"
      };
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Most Popular</h2>
        {/* Blue glowing divider right after the heading */}
        <div className="relative mb-4">
          <div className="w-full h-px bg-blue-500/30"></div>
          <div className="absolute -top-[1px] left-0 w-1/3 h-[2px] bg-gradient-to-r from-blue-500 to-blue-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.7)]"></div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div 
            ref={sliderRef}
            className="flex overflow-x-auto scrollbar-hide pb-6 cursor-grab select-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={() => pauseAutoScroll()}
          >
            {trendingManga.map((manga, index) => (
              <div 
                key={manga.id} 
                className={`group relative flex-shrink-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ 
                  width: 'calc(20% - 16px)',
                  marginRight: '20px',
                  minWidth: '180px',
                }}
              >
                {/* Slate shadow card effect on hover */}
                <div className="absolute -inset-2 rounded-xl bg-transparent transition-all duration-300 
                  group-hover:bg-slate-800/80 group-hover:shadow-[0_8px_30px_rgb(15,23,42,0.7)] 
                  group-hover:translate-y-[8px] -z-10 blur-[3px] group-hover:blur-[6px]"></div>
                
                <Link href={`/manga/${manga.mangaId}`} className="block w-full">
                  {/* Image Container */}
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-md transition-all duration-300 
                    group-hover:translate-y-[4px] group-hover:shadow-lg">
                    {/* Image Background */}
                    <Image 
                      src={manga.cover} 
                      alt={manga.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      priority={index < 5}
                    />

                    {/* View count badge */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className="bg-blue-600/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        {formatViewCount(manga.viewCount)}
                      </span>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 z-10 flex gap-1 flex-wrap">
                      {manga.genres && getSpecialTag(manga.genres) && (
                        <span className={`${getSpecialTag(manga.genres)?.color} text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-lg backdrop-blur-sm`}>
                          {getSpecialTag(manga.genres)?.text}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Rank Number + Title and Genres */}
                <div className="mt-3 flex items-start gap-3 transition-transform duration-300 group-hover:translate-y-[4px]">
                  <div className="text-5xl font-bold text-white opacity-90">{index + 1}</div>
                  <div className="flex flex-col">
                    <Link href={`/manga/${manga.mangaId}`}>
                      <h3 className="text-white text-base font-semibold leading-tight hover:text-blue-400 transition-colors">
                        {manga.title.length > 18 ? `${manga.title.substring(0, 18)}...` : manga.title}
                      </h3>
                    </Link>
                    <p className="text-sm mt-1 text-white/70">
                      {manga.genres && manga.genres.slice(0, 2).map((genre, i) => (
                        <span key={i}>
                          {genre}
                          {i < Math.min(manga.genres?.length || 0, 2) - 1 && ', '}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Hint for mobile users */}
          <div className="text-center text-xs text-gray-400 mt-2 md:hidden">
            Swipe to see more
          </div>
        </>
      )}
    </div>
  );
};

export default TrendingSection;
