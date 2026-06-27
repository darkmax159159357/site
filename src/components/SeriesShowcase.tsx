"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import { fetchLastUpdated } from "@/action/fetchKomik";
import "@splidejs/react-splide/css";

// Top-of-page "Series" showcase — a looping Splide carousel of large vertical
// poster cards (cover faded into a description). Mirrors mythtoons.org's series
// carousel that sits above everything else.

type Series = {
  id: string;
  title: string;
  cover: string;
  status: string;
  type: string;
  description: string;
};

export default function SeriesShowcase() {
  const [items, setItems] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchLastUpdated();
        const mapped: Series[] = (data || []).slice(0, 12).map((m: any) => ({
          id: m.id,
          title: m.title,
          cover: m.cover,
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

  if (!loading && items.length === 0) return null;

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-1/2 sm:w-1/3 lg:w-1/5 aspect-[0.8/1] bg-white/5 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden series-splide">
      <Splide
        options={{
          type: "loop",
          perPage: 5,
          perMove: 1,
          gap: "1rem",
          autoplay: true,
          interval: 4500,
          pauseOnHover: true,
          arrows: false,
          pagination: false,
          drag: true,
          speed: 600,
          breakpoints: {
            1024: { perPage: 4 },
            768: { perPage: 3 },
            480: { perPage: 2 },
          },
        }}
        aria-roledescription="carousel"
      >
        {items.map((s) => {
          const isOngoing = s.status.toUpperCase() === "ONGOING";
          return (
            <SplideSlide key={s.id}>
              <div className="group latest-poster rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-500 flex flex-col overflow-hidden relative">
                {/* Blurred cover backdrop */}
                <div
                  className="w-full h-full absolute top-0 left-0 bg-cover bg-center blur-3xl opacity-20"
                  style={{ backgroundImage: `url(${s.cover})` }}
                />
                <Link href={`/manga/${s.id}`} className="relative overflow-hidden" title={s.title}>
                  {/* Cover faded into the card */}
                  <div className="relative overflow-hidden aspect-[0.80/1] w-full rounded-xl">
                    <div
                      className="bg-white/5 bg-no-repeat bg-cover bg-[position:0%_23%] w-full h-full absolute top-0 left-0 transition-all"
                      style={{
                        backgroundImage: `url(${s.cover})`,
                        WebkitMaskImage: "linear-gradient(rgba(0,0,0,0.9), transparent)",
                        maskImage: "linear-gradient(rgba(0,0,0,0.9), transparent)",
                      }}
                    />
                    <div className="flex gap-2 flex-col justify-end h-full w-full px-2">
                      <div className="font-bold text-xl leading-[1.35rem] opacity-95 truncate">
                        {s.title}
                      </div>
                      <div className="flex gap-1.5 justify-start items-center">
                        <div className="flex gap-1.5 justify-center items-center w-fit px-2 h-5 bg-white/15 rounded-full">
                          <div
                            className={`w-2 h-2 rounded-full ${isOngoing ? "bg-green-500" : "bg-amber-500"}`}
                          >
                            <div
                              className={`w-full h-full animate-ping rounded-full ${isOngoing ? "bg-green-500" : "bg-amber-500"}`}
                            />
                          </div>
                          <div
                            className={`text-xs font-medium uppercase ${isOngoing ? "text-green-500" : "text-amber-500"}`}
                          >
                            {isOngoing ? "Ongoing" : "Completed"}
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
