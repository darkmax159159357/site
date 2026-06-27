"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import "@/styles/series-splide.css";

// Top "Series" showcase — a center-focus looping Splide carousel of large
// vertical poster cards. Matches mythtoons.org's hero series row exactly:
// fixed 20rem slides, the cover fades (mask gradient) into a big title + status
// pill + type tag + description, and non-active slides dim to opacity .2.

type Series = {
  id: string;
  title: string;
  cover: string;
  status: string;
  type: string;
  description: string;
};

// Status pill config (mythtoons: ongoing=green+pulse, completed/upcoming=blue).
const statusInfo = (status?: string) => {
  const t = (status || "ongoing").toLowerCase();
  if (t.includes("completed")) return { color: "blue", text: "Completed", animate: false };
  if (t.includes("upcoming")) return { color: "blue", text: "Upcoming", animate: false };
  return { color: "green", text: "Ongoing", animate: true };
};

export default function SeriesShowcase() {
  const [items, setItems] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const splideRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        // Client-side fetch of the static catalog — reliable on Vercel
        // (the server action fetchLastUpdated() can return [] on the
        // read-only serverless filesystem). Same source as TrendingSection.
        const res = await fetch("/Medusa/manga/manga.json", { cache: "no-store" });
        const all = await res.json();
        const mapped: Series[] = (Array.isArray(all) ? all : [])
          .slice(0, 12)
          .map((m: any) => ({
            id: m.id,
            title: m.title || "Untitled",
            cover: m.cover || "/fallback-image.svg",
            status: (m.status || "ONGOING").toString(),
            type: m.type || "Manhwa",
            description: m.description || "",
          }));
        setItems(mapped);
      } catch (e) {
        console.error("SeriesShowcase load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (items.length === 0) return null;

  const go = (dir: "<" | ">") => splideRef.current?.splide?.go(dir);

  return (
    <div className="w-full overflow-hidden relative series-splide">
      {/* Prev / Next arrows (mythtoons purple) */}
      <button
        onClick={() => go("<")}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-purple-600/80 hover:bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
      >
        <span className="text-2xl font-bold leading-none">‹</span>
      </button>
      <button
        onClick={() => go(">")}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-purple-600/80 hover:bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
      >
        <span className="text-2xl font-bold leading-none">›</span>
      </button>

      <Splide
        ref={splideRef}
        options={{
          type: "loop",
          perPage: 5,
          perMove: 1,
          gap: "1rem",
          focus: "center",
          trimSpace: false,
          autoplay: true,
          interval: 5000,
          pauseOnHover: true,
          pauseOnFocus: false,
          arrows: false,
          pagination: false,
          drag: true,
          snap: true,
          speed: 900,
          easing: "cubic-bezier(0.25, 1, 0.5, 1)",
          breakpoints: {
            1200: { perPage: 4, gap: "1rem" },
            768: { perPage: 3, gap: "1rem" },
            480: { perPage: 2, gap: "1rem" },
          },
        }}
        aria-roledescription="carousel"
      >
        {items.map((s) => {
          const info = statusInfo(s.status);
          const dotColor = info.color === "green" ? "bg-green-500" : "bg-blue-500";
          const textColor = info.color === "green" ? "text-green-500" : "text-blue-500";
          return (
            <SplideSlide key={s.id}>
              {/* Exactly mythtoons' markup: plain background-image divs (no
                  next/image) so a card always renders even if a cover is slow,
                  and the cover fades into the card via a mask gradient. */}
              <div
                data-img={s.cover}
                className="latest-poster group rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-500 flex flex-col overflow-hidden relative"
              >
                {/* Blurred cover backdrop */}
                <div
                  className="w-full h-full absolute top-0 left-0 bg-cover bg-center blur-3xl opacity-20"
                  style={{ backgroundImage: `url("${s.cover}")` }}
                />
                <Link href={`/manga/${s.id}`} className="relative overflow-hidden" title={s.title}>
                  <div className="relative overflow-hidden w-full rounded-xl" style={{ aspectRatio: "0.8 / 1" }}>
                    <div
                      className="bg-white/5 bg-no-repeat bg-cover w-full h-full absolute top-0 left-0 transition-all"
                      style={{
                        backgroundImage: `url("${s.cover}")`,
                        backgroundPosition: "0% 23%",
                        WebkitMaskImage: "linear-gradient(rgba(0,0,0,0.9), transparent)",
                        maskImage: "linear-gradient(rgba(0,0,0,0.9), transparent)",
                      }}
                    />
                    <div className="relative z-10 flex gap-2 flex-col justify-end h-full w-full px-2">
                      <div className="font-bold text-xl leading-[1.35rem] opacity-95 truncate">
                        {s.title}
                      </div>
                      <div className="flex gap-1.5 justify-start items-center">
                        <div className="flex gap-1.5 justify-center items-center w-fit px-2 h-5 bg-white/15 rounded-full">
                          <div className={`relative w-2 h-2 rounded-full ${dotColor}`}>
                            {info.animate && (
                              <div className={`w-full h-full animate-ping rounded-full ${dotColor}`} />
                            )}
                          </div>
                          <div className={`text-xs font-medium uppercase ${textColor}`}>
                            {info.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Type tag */}
                  <div className="p-1.5 absolute top-0 left-0 flex flex-wrap gap-1 z-[1]">
                    <span className="bg-zinc-950/50 border border-white/5 backdrop-blur-3xl w-fit h-fit px-1 rounded-xl text-xs capitalize">
                      {s.type}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="grid gap-2 p-2">
                    <div className="text-xs opacity-50 line-clamp-2 whitespace-pre-line">
                      {s.description}
                    </div>
                  </div>
                </Link>
              </div>
            </SplideSlide>
          );
        })}
      </Splide>
    </div>
  );
}
