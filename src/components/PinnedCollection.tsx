"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchLastUpdated } from "@/action/fetchKomik";
import "swiper/css";

// "Pinned Collection" (Editor's Picks) — a polaroid-style carousel of the
// highest-rated series. Selection is automatic: top-rated from Firestore
// (consistent with the "Top Rated" section), enriched with cover/title/genres
// from the bundled catalog.

type Pin = {
  id: string;
  title: string;
  cover: string;
  genres: string[];
  rating: number;
};

// Deterministic tilt (-3deg .. 3deg) derived from the id so each polaroid
// looks hand-pinned but stays stable between renders. Same idea as the
// per-card hue in MangaCard.
const getTilt = (id: string): number => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 7) - 3; // -3 .. 3
};

export default function PinnedCollection() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // 1) Build a lookup of catalog entries (covers/titles/genres).
        const catalog = await fetchLastUpdated();
        const bySlug = new Map<string, any>();
        (catalog || []).forEach((m: any) => bySlug.set(m.id, m));

        let result: Pin[] = [];

        // 2) Preferred: top-rated series from Firestore.
        try {
          const ratingsSnap = await getDocs(
            query(
              collection(db, "manga_ratings"),
              orderBy("averageRating", "desc"),
              limit(12)
            )
          );

          result = ratingsSnap.docs
            .map((d) => {
              const data = d.data() as any;
              const slug = data.mangaId || d.id;
              const cat = bySlug.get(slug);
              const cover = cat?.cover || data.cover;
              if (!cover) return null;
              return {
                id: slug,
                title: cat?.title || data.title || slug.replace(/-/g, " "),
                cover,
                genres: Array.isArray(cat?.genres) ? cat.genres : [],
                rating: Number(data.averageRating) || 0,
              } as Pin;
            })
            .filter(Boolean) as Pin[];
        } catch (e) {
          console.warn("PinnedCollection: ratings query failed, using catalog", e);
        }

        // 3) Fallback: if Firestore is empty, just use the first catalog entries.
        if (result.length === 0) {
          result = (catalog || []).slice(0, 8).map((m: any) => ({
            id: m.id,
            title: m.title,
            cover: m.cover,
            genres: Array.isArray(m.genres) ? m.genres : [],
            rating: 0,
          }));
        }

        setPins(result.slice(0, 8));
      } catch (e) {
        console.error("PinnedCollection load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!loading && pins.length === 0) return null;

  return (
    <div className="px-2 sm:px-0">
      {/* Section header (amber accent, matches the site's section style) */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.5)]">
          {/* Pushpin */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M16 3l5 5-1.5 1.5-1-1-4 4 .5 4.5L13 19l-3.5-3.5L4 21l-1-1 5.5-5.5L5 11l2-1.5 4.5.5 4-4-1-1L16 3z" />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Pinned <span className="text-amber-400">Collection</span>
        </h2>
        {/* Sticky note */}
        <span className="hidden sm:inline-block -rotate-3 bg-yellow-300 text-black text-[11px] font-bold px-2 py-1 rounded shadow-md">
          ★ Editor's Picks
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-amber-500/50 to-transparent" />
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-[150px] bg-white/90 rounded-lg p-2 pb-4 shadow-lg animate-pulse"
            >
              <div className="aspect-[3/4] bg-gray-300 rounded" />
              <div className="h-3 bg-gray-300 rounded mt-3 w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      ) : (
        <Swiper
          modules={[Autoplay]}
          slidesPerView={2.2}
          spaceBetween={16}
          autoplay={{ delay: 3500, disableOnInteraction: true }}
          breakpoints={{
            480: { slidesPerView: 3.2, spaceBetween: 16 },
            768: { slidesPerView: 4.2, spaceBetween: 20 },
            1024: { slidesPerView: 5.2, spaceBetween: 22 },
            1280: { slidesPerView: 6, spaceBetween: 24 },
          }}
          className="!py-4 !px-1"
        >
          {pins.map((pin) => {
            const tilt = getTilt(pin.id);
            return (
              <SwiperSlide key={pin.id} className="!h-auto">
                <Link
                  href={`/manga/${pin.id}`}
                  className="group block bg-white rounded-lg p-2 pb-4 shadow-lg transition-transform duration-300 hover:scale-105 hover:!rotate-0 relative"
                  style={{ transform: `rotate(${tilt}deg)` }}
                >
                  {/* Red pin */}
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10 w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_2px_4px_rgba(0,0,0,0.4)] ring-2 ring-red-300/60" />

                  {/* Cover */}
                  <div className="relative aspect-[3/4] overflow-hidden rounded bg-gray-200">
                    <Image
                      src={pin.cover}
                      alt={pin.title}
                      fill
                      sizes="(max-width: 768px) 40vw, 200px"
                      referrerPolicy="no-referrer"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  {/* Caption (polaroid handwriting feel) */}
                  <h3 className="text-black text-center text-sm font-semibold mt-3 px-1 line-clamp-1">
                    {pin.title}
                  </h3>

                  {/* Genre stickers */}
                  <div className="flex flex-wrap justify-center gap-1 mt-1.5">
                    {pin.genres.slice(0, 2).map((g, i) => (
                      <span
                        key={i}
                        className="bg-yellow-300 text-black text-[9px] font-bold px-1.5 py-0.5 rounded"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}
    </div>
  );
}
