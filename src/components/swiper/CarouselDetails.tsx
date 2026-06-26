"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import { MotionDiv } from "../motion/MotionDiv";
import "swiper/css";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import NavLink from "../navlink/NavLink";
import { fetchMangaByAdvSearch } from "@/action/fetchKomik";

const variant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

type DataFetch = {
  id: string;
  title: string;
  banner: string;
  cover: string;
};

const CarouselDetails = () => {
  const [data, setData] = useState<DataFetch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const results = await fetchMangaByAdvSearch("Manhwa");
        console.log("Loaded manhwa data from local file:", results);
        
        // Process the results to ensure correct image paths
        const processedResults = results ? results.map(item => {
          let coverPath = item.cover;
          let bannerPath = item.banner;
          
          // Use static-files API for blue-star manga
          if (item.id === 'blue-star') {
            coverPath = `/api/static-files?path=manga/blue-star/cover.jpg`;
            bannerPath = `/api/static-files?path=manga/blue-star/banner.jpg`;
            console.log(`Using static-files API for ${item.title} in CarouselDetails:`, coverPath);
          }
          
          return {
            ...item,
            cover: coverPath,
            banner: bannerPath
          };
        }) : [];
        
        setData(processedResults || []);
      } catch (error) {
        console.error("Error loading manhwa data from local file:", error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <Swiper
      slidesPerView={3}
      spaceBetween={10}
      breakpoints={{
        640: {
          slidesPerView: 4,
          spaceBetween: 10,
        },
        768: {
          slidesPerView: 4,
          spaceBetween: 10,
        },
        1024: {
          slidesPerView: 6,
          spaceBetween: 10,
        },
      }}
      className="mySwiper"
    >
      {isLoading
        ? [1, 2, 3, 4, 5, 6].map((item) => (
            <SwiperSlide key={item}>
              <div className="item group">
                <div className="images rounded-md overflow-hidden w-full sm:h-56 h-36 m-3 bg-[#ccc] animate-pulse"></div>
              </div>
            </SwiperSlide>
          ))
        : data?.map((item: DataFetch, i: number) => (
            <SwiperSlide key={i}>
              <NavLink href={`/manga/${item?.id}`}>
                <MotionDiv
                  className="item sm:px-1 group"
                  variants={variant}
                  animate="visible"
                  initial="hidden"
                  transition={{
                    delay: i * 0.15,
                    ease: "easeInOut",
                    duration: "0.5",
                  }}
                  viewport={{ amount: 0 }}
                >
                  <div className="images rounded-md overflow-hidden h-40 sm:h-60">
                    <Image
                      src={item?.banner || item?.cover || "/fallback-image.svg"}
                      alt={item.title}
                      priority={true}
                      width={300}
                      height={300}
                      referrerPolicy="no-referrer"
                      className="group-hover:scale-105 object-cover duration-200 cursor-pointer brightness-90 w-64 h-40 sm:h-60"
                      onError={(e) => {
                        console.log(`Image failed to load for ${item.title} in carousel`);
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "/fallback-image.svg";
                      }}
                      unoptimized={true}
                    />
                  </div>
                  <div className="title mt-2">
                    <h1 className="font-karla font-medium flex gap-2 items-center text-xs sm:text-base text-white">
                      <span className="dots bg-green-600 py-[4px] px-[4px] rounded-full block"></span>
                      {item.title.length > 10
                        ? item.title.substring(0, 15) + "..."
                        : item.title}
                    </h1>
                  </div>
                </MotionDiv>
              </NavLink>
            </SwiperSlide>
          ))}
    </Swiper>
  );
};

export default CarouselDetails;
