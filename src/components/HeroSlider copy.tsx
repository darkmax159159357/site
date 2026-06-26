"use client";
import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fetchLastUpdated } from '@/action/fetchKomik';

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
}

const HeroSlider = () => {
  const [selectedManga, setSelectedManga] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch manga data directly using the server action
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchLastUpdated();
        console.log("HeroSlider - Fetched data:", data);
        if (data && data.length > 0) {
          // Select 5 random manga for the hero slider
          const selected = data.slice(0, 5).map((item, index) => {
            // Process image paths for each manga - use standard paths
            // Banner handling is now done in fetchKomik.ts
            let coverPath = item.cover;
            let bannerPath = item.banner || item.cover; // Fallback to cover if banner is missing
            
            return {
              ...item,
              // Update paths
              cover: coverPath,
              banner: bannerPath,
              // Add mock data for fields that might be missing
              rating: item.rating || (4.5 + (Math.random() * 0.5)),
              status: item.type?.toUpperCase() || ["ONGOING", "COMPLETED", "RELEASED"][Math.floor(Math.random() * 3)] as "ONGOING" | "COMPLETED" | "RELEASED",
              slug: item.id,
              // Ensure genres are properly handled
              genres: Array.isArray(item.genres) && item.genres.length > 0 ? item.genres : 
                     (item.genre && typeof item.genre === 'string' ? item.genre.split(',').map((g: string) => g.trim()) : ["N/A"]),
              chapter: item.chapters && item.chapters.length > 0 
                ? item.chapters[item.chapters.length - 1].number.toString() 
                : "1"
            };
          });
          console.log("HeroSlider - Processed manga data:", selected);
          setSelectedManga(selected);
        }
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
            {/* Background Image (Blurred) */}
            <div className="absolute inset-0 w-full h-full">
              <Image
                src={manga.banner || manga.cover}
                alt={manga.title}
                fill
                className="object-cover blur-sm brightness-50 transition-all duration-700" // Added transition for smoother loading
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
                      className="bg-[#FF7F57]/80 text-white text-[8px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * idx }}
                    >
                      {genre}
                    </motion.span>
                  ))}
                  <motion.span 
                    className="hidden xs:inline-block bg-blue-500/80 text-white text-[8px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    {manga.status}
                  </motion.span>
                </div>
                
                {/* Title */}
                <motion.h1 
                  className="text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold line-clamp-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {manga.title}
                </motion.h1>
                
                {/* Description - Improved for mobile */}
                <motion.p 
                  className="text-[10px] leading-[1.2] sm:text-xs md:text-sm lg:text-base text-gray-200 line-clamp-2 sm:line-clamp-3 md:line-clamp-4 lg:line-clamp-5 w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {manga.description && manga.description.trim() !== "" 
                    ? manga.description 
                    : "Experience this exciting manga adventure with stunning artwork and an engaging storyline that will keep you hooked from start to finish."}
                </motion.p>
                
                {/* Read Button */}
                <motion.div
                  className="w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <Link href={`/manga/${manga.slug || manga.id}`}>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-[#FF7F57] hover:bg-[#FF7F57]/90 text-white text-xs sm:text-sm px-3 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 rounded-full flex items-center gap-1 sm:gap-2"
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
                    </motion.button>
                  </Link>
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
                  className="relative h-[180%] w-full max-w-[170px] sm:max-w-[220px] md:max-w-[270px] lg:max-w-[320px] -mt-22 -mb-22 hover:translate-y-[-10px] transition-all duration-300"
                >
                  <div 
                    className="absolute inset-0 rounded-lg overflow-hidden"
                    style={{
                      transform: "rotate(15deg) translateX(-20px)",
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
        }
        
        .swiper-button-next:hover,
        .swiper-button-prev:hover {
          background-color: rgba(255, 127, 87, 0.8);
        }
        
        .swiper-button-next:after,
        .swiper-button-prev:after {
          font-size: 18px !important;
        }
      `}</style>
    </div>
  );
};

export default HeroSlider; 