"use client";
import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fetchLastUpdated } from '@/action/fetchKomik';

// Import Swiper styles
import 'swiper/css';
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
  alternativeTitles?: string[];
}

const HeroSlider = () => {
  const [mangaList, setMangaList] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch manga data directly using the server action
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchLastUpdated();
        console.log("HeroSlider - Fetched data:", data);
        if (data && data.length > 0) {
          // Process manga data
          const processedData = data.map((item, index) => {
            // Process image paths for each manga
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
              alternativeTitles: item.alternativeTitles || [],
              chapter: item.chapters && item.chapters.length > 0 
                ? item.chapters[item.chapters.length - 1].number.toString() 
                : "1"
            };
          });
          
          console.log("HeroSlider - Processed manga data:", processedData);
          setMangaList(processedData);
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
      <div className="w-full h-[300px] bg-gray-800 animate-pulse rounded-lg">
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-base">Loading amazing content...</div>
        </div>
      </div>
    );
  }

  if (!mangaList.length) {
    return (
      <div className="w-full h-[300px] bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-white text-base">No manga content available. Please check back later.</div>
      </div>
    );
  }

  return (
    <section className="splide series-splide grid col-span-full sm:w-full">
      <Swiper
        slidesPerView="auto"
        spaceBetween={16}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        speed={800}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        navigation={true}
        modules={[Autoplay, Pagination, Navigation]}
        className="w-full"
      >
        {mangaList.map((manga, index) => (
          <SwiperSlide 
            key={manga.id || index}
            className="group latest-poster rounded-lg bg-white/5 hover:bg-white/10 transition-all flex flex-col overflow-hidden relative"
            style={{ width: '20rem' }}
          >
            {/* Background blur effect */}
            <div 
              style={{ backgroundImage: `url(${manga.banner || manga.cover})` }} 
              className="w-full h-full absolute top-0 left-0 bg-cover bg-center blur-3xl opacity-25"
            ></div>
            
            <Link href={`/manga/${manga.slug || manga.id}`} alt={manga.title} title={manga.title} className="relative overflow-hidden">
              {/* Main content container */}
              <div className="relative overflow-hidden aspect-[0.80/1] w-full">
                {/* Cover image with gradient overlay */}
                <div 
                  className="bg-white/10 bg-no-repeat bg-cover bg-[position:0%_23%] w-full h-full absolute top-0 left-0 transition-all" 
                  style={{ 
                    backgroundImage: `url(${manga.cover})`,
                    WebkitMaskImage: "linear-gradient(to bottom, hsl(0deg 0% 0% / 80%), transparent)"
                  }}
                ></div>
                
                <div className="flex gap-2 flex-col justify-end h-full w-full px-2">
                  {/* Alternative titles if available */}
                  {manga.alternativeTitles && manga.alternativeTitles.length > 0 && (
                    <div className="grid gap-1 w-full opacity-80">
                      {manga.alternativeTitles.slice(0, 2).map((title, idx) => (
                        <span key={idx} className="text-sm leading-none">{title}</span>
                      ))}
                    </div>
                  )}
                  
                  {/* Title */}
                  <div className="font-bold text-xl leading-[1.35rem] opacity-80 truncate">
                    {manga.title}
                  </div>
                  
                  {/* Status indicator */}
                  <div className="flex gap-1.5 justify-start items-center">
                    <div className="flex gap-1.5 justify-center items-center w-fit px-2 h-5 bg-white/15 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full">
                        <div className="w-full h-full bg-green-500 animate-ping rounded-full"></div>
                      </div>
                      <div className="text-xs text-green-500 font-medium uppercase">
                        {manga.status}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tags on top left */}
              <div className="p-1.5 absolute top-0 left-0 flex flex-wrap gap-1 z-1">
                {index < 2 && (
                  <span className="bg-zinc-950/50 border border-white/5 backdrop-blur-3xl w-fit h-fit px-1 rounded-md text-xs">New</span>
                )}
                <span className="bg-zinc-950/50 border border-white/5 backdrop-blur-3xl w-fit h-fit px-1 rounded-md text-xs capitalize">
                  {manga.country?.toLowerCase() || 'manga'}
                </span>
              </div>
              
              {/* Description at bottom */}
              <div className="grid gap-2 p-2">
                <div className="text-xs opacity-50 line-clamp-2">
                  {manga.description && manga.description.trim() !== "" 
                    ? manga.description 
                    : "Experience this exciting manga adventure with stunning artwork and an engaging storyline."}
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Custom styling for navigation arrows */}
      <style jsx global>{`
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
          transform: rotate(180deg);
        }

        .swiper-button-next:after {
          transform: rotate(0deg);
        }
      `}</style>
    </section>
  );
};

export default HeroSlider;