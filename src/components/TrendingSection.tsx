"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";

interface MangaItem {
  id: string;
  mangaId: string;
  title: string;
  cover: string;
  viewCount: number;
  type?: string;
  description?: string;
  genres?: string[];
}

// Country/type badge shown on the slide (mythtoons-style label).
const getTypeBadge = (type: string = "Manhwa") => {
  const t = (type || "Manhwa").toUpperCase();
  return (
    <span className="absolute top-2 left-2 z-[101] bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded">
      {t}
    </span>
  );
};

const TrendingSection = () => {
  const [trendingManga, setTrendingManga] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingManga = async () => {
      setLoading(true);
      try {
        const mangaViewsRef = collection(db, "manga_views");
        const q = query(mangaViewsRef, orderBy("viewCount", "desc"), limit(10));
        const querySnapshot = await getDocs(q);

        const mangaIds: string[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as MangaItem;
          mangaIds.push(data.mangaId || doc.id);
        });

        // Enrich with genres / type / description from the catalog.
        const infoMap = new Map<string, any>();
        try {
          const response = await fetch("/Medusa/manga/manga.json");
          const allManga = await response.json();
          allManga.forEach((manga: any) => {
            if (mangaIds.includes(manga.id)) {
              infoMap.set(manga.id, {
                genres: manga.genres || [],
                type: manga.type || "Manhwa",
                description: manga.description || "",
              });
            }
          });
        } catch (e) {
          console.warn("Most Popular: catalog enrich failed", e);
        }

        const mangaData: MangaItem[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as MangaItem;
          const mangaId = data.mangaId || doc.id;
          const info = infoMap.get(mangaId);
          mangaData.push({
            id: doc.id,
            mangaId,
            title: data.title || "Unknown Title",
            cover: data.cover || "/fallback-image.svg",
            viewCount: data.viewCount || 0,
            type: info?.type || "Manhwa",
            description: info?.description || data.description || "",
            genres: info?.genres || [],
          });
        });

        setTrendingManga(mangaData);
      } catch (error) {
        console.error("Error fetching trending manga from Firebase:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingManga();
  }, []);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Most Popular</h2>
        {/* Blue glowing divider right after the heading (matches mythtoons) */}
        <div className="relative mb-4">
          <div className="w-full h-px bg-blue-500/30"></div>
          <div className="absolute -top-[1px] left-0 w-1/3 h-[2px] bg-gradient-to-r from-blue-500 to-blue-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.7)]"></div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : trendingManga.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-gray-400">No popular series yet</div>
      ) : (
        <div className="w-full overflow-hidden trending-splide">
          <Splide
            options={{
              type: "loop",
              perPage: 5,
              perMove: 1,
              gap: "0.25rem",
              focus: "center",
              trimSpace: false,
              autoplay: true,
              interval: 5000,
              pauseOnHover: true,
              pauseOnFocus: true,
              arrows: false,
              pagination: false,
              drag: true,
              snap: true,
              speed: 600,
              easing: "cubic-bezier(0.25, 1, 0.5, 1)",
              breakpoints: {
                1200: { perPage: 4, gap: "0.5rem" },
                768: { perPage: 3, gap: "0.25rem" },
                480: { perPage: 2, gap: "0.25rem" },
              },
            }}
            aria-roledescription="carousel"
          >
            {trendingManga.map((manga) => (
              <SplideSlide key={manga.id}>
                <div className="embla__slide group relative px-1">
                  <Link href={`/manga/${manga.mangaId}`} className="block h-full w-full">
                    <div className="flex-none overflow-hidden rounded-2xl w-full aspect-square relative shadow">
                      {getTypeBadge(manga.type)}
                      <div className="block h-full w-full opacity-75">
                        <Image
                          alt={manga.title}
                          loading="lazy"
                          width={280}
                          height={280}
                          referrerPolicy="no-referrer"
                          className="object-cover aspect-[1/1] object-[100%_10%] h-full w-full"
                          src={manga.cover || "/placeholder-cover.svg"}
                          sizes="(max-width: 768px) 45vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                      <div className="absolute w-full h-full bg-gradient-to-t from-black/80 via-black/20 to-transparent z-50 top-0"></div>
                      <div
                        style={{ textShadow: "0 0 8px rgba(0,0,0,0.8)" }}
                        className="slide-caption absolute bottom-4 left-4 right-4 z-[100] text-white text-center"
                      >
                        <h5 className="font-semibold text-sm lg:text-base mb-2">{manga.title}</h5>
                        {manga.description && (
                          <div className="text-white/90 text-xs lg:text-sm line-clamp-2 lg:line-clamp-3">
                            {manga.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              </SplideSlide>
            ))}
          </Splide>

          {/* Center-focus styling: only the active slide is full-color + caption visible */}
          <style jsx global>{`
            .trending-splide .splide__slide {
              transition: all 0.25s linear;
            }
            .trending-splide .splide__slide .embla__slide {
              opacity: 0.3;
              filter: saturate(0);
            }
            .trending-splide .splide__slide.is-active .embla__slide {
              opacity: 1;
              filter: saturate(1);
            }
            .trending-splide .splide__slide.is-prev .embla__slide,
            .trending-splide .splide__slide.is-next .embla__slide {
              opacity: 0.62;
              filter: saturate(0);
            }
            .trending-splide .slide-caption {
              opacity: 0;
              visibility: hidden;
              transition: opacity 0.25s linear;
            }
            .trending-splide .splide__slide.is-active .slide-caption {
              opacity: 1;
              visibility: visible;
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default TrendingSection;
