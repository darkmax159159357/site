"use client";
import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';

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
  views?: number;
}

const HeroSlider = () => {
  const [selectedManga, setSelectedManga] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        let mangaData: MangaItem[] = [];
        
        // Try to fetch from manga_views collection (most viewed)
        try {
          console.log("LOADING HERO SLIDER FROM MANGA_VIEWS");
          const viewsQuery = query(
            collection(db, "manga_views"),
            orderBy("viewCount", "desc"),
            limit(5)
          );
          
          const viewsSnapshot = await getDocs(viewsQuery);
          console.log(`Hero Slider: found ${viewsSnapshot.size} documents in manga_views`);
          
          if (viewsSnapshot.size > 0) {
            const mangaPromises = viewsSnapshot.docs.map(async (docRef) => {
              const data = docRef.data();
              console.log(`Hero manga view document:`, data);
              
              // Ensure we have a valid rating
              let rating = 4.5; // Default fallback
              if (data.averageRating !== undefined && data.averageRating !== null) {
                rating = Number(data.averageRating);
              } else if (data.rating !== undefined && data.rating !== null) {
                rating = Number(data.rating);
              }
              
              const mangaSlug = data.mangaId || docRef.id;
              
              // Determine the best cover and banner paths
              const coverPath = data.cover || data.coverImage || `/Medusa/manga/${mangaSlug}/cover.jpg`;
              let bannerPath = data.banner || coverPath; // Fallback to cover if banner is missing
              
              // Extract base path to find manga.json
              const basePath = `/Medusa/manga`;
              let mangaDetails: any = {
                genres: ["Romance", "Fantasy"],
                chaptersCount: "?",
                chapters: []
              };
              
              // Try to fetch manga.json
              try {
                const response = await fetch(`${basePath}/manga.json`);
                if (response.ok) {
                  const jsonData = await response.json();
                  
                  // Find specific manga in the json array
                  const specificManga = jsonData.find((item: any) => 
                    item.id === mangaSlug || item.slug === mangaSlug
                  );
                  
                  if (specificManga) {
                    mangaDetails = specificManga;
                    console.log(`Found specific manga details for ${mangaSlug} in manga.json`);
                  } else {
                    // If not found in global, try individual manga.json
                    const individualPath = `${basePath}/${mangaSlug}/manga.json`;
                    const individualResponse = await fetch(individualPath);
                    if (individualResponse.ok) {
                      mangaDetails = await individualResponse.json();
                      console.log(`Loaded individual manga.json for ${mangaSlug}`);
                    }
                  }
                } else {
                  // Try individual manga.json as fallback
                  const individualPath = `${basePath}/${mangaSlug}/manga.json`;
                  const individualResponse = await fetch(individualPath);
                  if (individualResponse.ok) {
                    mangaDetails = await individualResponse.json();
                    console.log(`Loaded individual manga.json for ${mangaSlug}`);
                  }
                }
              } catch (error) {
                console.error(`Error loading manga.json for ${mangaSlug}:`, error);
              }
              
              // Ensure we have description with fallbacks
              const description = mangaDetails.description || data.description || "No description available";
              
              return {
                id: docRef.id,
                slug: mangaSlug,
                title: data.title || data.mangaTitle || mangaDetails.title || mangaSlug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                cover: coverPath,
                banner: bannerPath,
                description: description,
                views: data.viewCount || data.totalViews || 0,
                rating: rating,
                status: mangaDetails.status || ["ONGOING", "COMPLETED", "RELEASED"][Math.floor(Math.random() * 3)] as "ONGOING" | "COMPLETED" | "RELEASED",
                genres: mangaDetails.genres || data.genres || ["Romance", "Fantasy"],
                chapter: mangaDetails.chapters && mangaDetails.chapters.length > 0 
                  ? mangaDetails.chapters[mangaDetails.chapters.length - 1].number.toString() 
                  : "1",
                chapters: mangaDetails.chapters || []
              };
            });
            
            mangaData = await Promise.all(mangaPromises);
          }
        } catch (error) {
          console.error("Error fetching from manga_views:", error);
        }

        // If no data from manga_views, try to use local JSON files
        if (mangaData.length === 0) {
          try {
            console.log("FALLBACK: Loading local JSON files from manga_views directory");
            
            // Hardcoded list of manga IDs to try (based on folder structure)
            const mangaIds = [
              'blue-star',
              'collecting-the-male-leads-first-nights',
              'once-upon-a-time',
              'sex-training-with-my-boss',
              'shh-i-m-tutoring'
            ];
            
            const mangaPromises = mangaIds.map(async (mangaId) => {
              try {
                const response = await fetch(`/app/manga_views/${mangaId}.json`);
                if (response.ok) {
                  const data = await response.json();
                  
                  const coverPath = data.coverImage || `/Medusa/manga/${mangaId}/cover.jpg`;
                  const bannerPath = data.banner || coverPath;
                  
                  return {
                    id: mangaId,
                    slug: mangaId,
                    title: data.mangaTitle || mangaId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                    cover: coverPath,
                    banner: bannerPath,
                    description: data.description || "No description available",
                    views: data.totalViews || 0,
                    rating: 4.5,
                    status: "ONGOING" as "ONGOING" | "COMPLETED" | "RELEASED",
                    genres: ["Romance", "Fantasy"],
                    chapter: "1",
                    chapters: []
                  };
                }
              } catch (error) {
                console.error(`Error loading local JSON for ${mangaId}:`, error);
                return null;
              }
              return null;
            });
            
            const results = await Promise.all(mangaPromises);
            mangaData = results.filter(Boolean) as MangaItem[];
          } catch (error) {
            console.error("Error fetching from local JSON files:", error);
          }
        }
        
        console.log("HeroSlider - Processed manga data:", mangaData);
        setSelectedManga(mangaData);
      } catch (error) {
        console.error("Error fetching manga data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[150px] sm:h-[180px] md:h-[250px] lg:h-[300px] xl:h-[350px] bg-gray-800 animate-pulse rounded-2xl">
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-sm sm:text-base">Loading amazing content...</div>
        </div>
      </div>
    );
  }

  if (!selectedManga.length) {
    return (
      <div className="w-full h-[150px] sm:h-[180px] md:h-[250px] lg:h-[300px] xl:h-[350px] bg-gray-900 rounded-2xl flex items-center justify-center">
        <div className="text-white text-sm sm:text-base">No manga content available. Please check back later.</div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl">
      <Swiper
        effect={'fade'}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        speed={1000} // Increase transition speed for smoother animations
        fadeEffect={{ crossFade: true }} // Enable cross fade for smoother transitions
        pagination={{
          clickable: true,
          dynamicBullets: true, // Dynamic bullets for better visual feedback
        }}
        navigation={{
          enabled: true,
          hideOnClick: false,
        }}
        modules={[Autoplay, EffectFade, Pagination, Navigation]}
        className="mySwiper w-full h-[150px] sm:h-[180px] md:h-[250px] lg:h-[300px] xl:h-[350px]"
      >
        {selectedManga.map((manga, index) => (
          <SwiperSlide key={manga.id || index} className="relative">
            {/* Make entire slide clickable */}
            <Link href={`/manga/${manga.slug || manga.id}`} className="block w-full h-full">
              <div className="relative w-full h-full cursor-pointer hover:scale-[1.02] transition-transform duration-300 group">
                {/* Background Image (Blurred) */}
                <div className="absolute inset-0 w-full h-full">
                  <Image
                    src={manga.banner || manga.cover}
                    alt={manga.title}
                    fill
                    className="object-cover blur-sm brightness-50 transition-all duration-700 group-hover:brightness-60" // Added hover effect
                    priority
                    sizes="100vw"
                    quality={60} // Lower quality for background is fine
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Prevent infinite loop
                      target.src = '/fallback-image.svg';
                      console.log(`Failed to load background image for ${manga.title}, using fallback`);
                    }}
                    unoptimized={true} // Disable Next.js image optimization to prevent caching issues
                  />
                </div>
                
                {/* Content Container */}
                <div className="relative z-10 flex flex-row items-center h-full w-full px-2 sm:px-4 md:px-8 lg:px-16">
                  {/* Text Content - Adjusted for better alignment */}
                  <div className="w-2/3 sm:w-3/5 md:w-2/3 text-white flex flex-col h-full justify-evenly items-start py-2 sm:py-3 md:py-4">
                    {/* Top section: Tags/Genres */}
                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-1 sm:mb-2 w-full">
                      {/* Display up to 3 genres if available */}
                      {Array.isArray(manga.genres) && manga.genres.slice(0, 3).map((genre, idx) => (
                        <motion.span 
                          key={idx} 
                          className="bg-[#FF7F57]/80 text-white text-[8px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full group-hover:bg-[#FF7F57] transition-colors duration-300"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 * idx }}
                        >
                          {genre}
                        </motion.span>
                      ))}
                      <motion.span 
                        className="hidden xs:inline-block bg-blue-500/80 text-white text-[8px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full group-hover:bg-blue-500 transition-colors duration-300"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                      >
                        {manga.status}
                      </motion.span>
                      
                      {/* Views tag */}
                      {manga.views && manga.views > 0 && (
                        <motion.span 
                          className="hidden xs:inline-flex bg-green-500/80 text-white text-[8px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full group-hover:bg-green-500 transition-colors duration-300 items-center gap-1"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.4 }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2 h-2 sm:w-3 sm:h-3">
                            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {manga.views.toLocaleString()}
                        </motion.span>
                      )}
                    </div>
                    
                    {/* Title */}
                    <motion.h1 
                      className="text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold line-clamp-2 group-hover:text-[#FF7F57] transition-colors duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      {manga.title}
                    </motion.h1>
                    
                    {/* Description - Improved for mobile */}
                    <motion.p 
                      className="text-[10px] leading-[1.2] sm:text-xs md:text-sm lg:text-base text-gray-200 line-clamp-2 sm:line-clamp-3 md:line-clamp-4 lg:line-clamp-5 w-full group-hover:text-gray-100 transition-colors duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      {manga.description && manga.description.trim() !== "" 
                        ? manga.description 
                        : "Experience this exciting manga adventure with stunning artwork and an engaging storyline that will keep you hooked from start to finish."}
                    </motion.p>
                    
                    {/* Read Button - Now just visual indicator */}
                    <motion.div
                      className="w-full"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-[#FF7F57] group-hover:bg-[#FF7F57]/90 text-white text-xs sm:text-sm px-3 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 rounded-full flex items-center gap-1 sm:gap-2 w-fit transition-all duration-300"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                          />
                        </svg>
                        Read Now
                      </motion.div>
                    </motion.div>
                  </div>
                  
                  {/* Cover Image - Prominent display extending beyond container */}
                  <motion.div
                    className="w-1/3 sm:w-1/3 md:w-1/3 lg:w-1/3 h-full flex items-center justify-end relative z-20 pr-2 sm:pr-8 md:pr-10"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                  >
                    <motion.div 
                      initial={{ scale: 0.95, y: 5 }}
                      animate={{ 
                        scale: 1, 
                        y: 0,
                        transition: { 
                          repeat: Infinity, 
                          repeatType: "reverse", 
                          duration: 3 
                        }
                      }}
                      whileHover={{ scale: 1.07 }}
                      className="relative h-[140%] w-full max-w-[170px] sm:max-w-[210px] md:max-w-[250px] lg:max-w-[300px] -mt-6 -mb-6 group-hover:translate-y-[-8px] transition-all duration-300"
                    >
                      <div 
                        className="absolute inset-0 rounded-lg overflow-hidden group-hover:shadow-2xl transition-shadow duration-300"
                        style={{
                          transform: "rotate(13deg) translateX(-15px)",
                          transformOrigin: "bottom right",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
                        }}
                      >
                        <Image 
                          src={manga.cover} 
                          alt={manga.title}
                          fill
                          className="object-cover"
                          priority
                          sizes="(max-width: 640px) 120px, (max-width: 768px) 150px, (max-width: 1024px) 180px, 220px"
                          onError={(e) => {
                            // Fallback if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // Prevent infinite loop
                            target.src = '/fallback-image.svg';
                            console.log(`Failed to load cover image for ${manga.title}, using fallback`);
                          }}
                          unoptimized={true}
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Custom CSS for navigation arrows */}
      <style jsx global>{`
        @media (max-width: 640px) {
          .swiper-button-next,
          .swiper-button-prev {
            display: none !important;
          }
        }
        
        .swiper-button-next,
        .swiper-button-prev {
          width: 40px !important;
          height: 40px !important;
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          color: white !important;
          z-index: 30 !important;
        }
        
        .swiper-button-next:hover,
        .swiper-button-prev:hover {
          background-color: rgba(255, 127, 87, 0.8);
        }
        
        .swiper-button-next:after,
        .swiper-button-prev:after {
          font-size: 18px !important;
        }
        
        .swiper-pagination {
          z-index: 30 !important;
        }
        
        .swiper-pagination-bullet {
          background-color: rgba(255, 255, 255, 0.5) !important;
        }
        
        .swiper-pagination-bullet-active {
          background-color: #FF7F57 !important;
        }
      `}</style>
    </div>
  );
};

export default HeroSlider;