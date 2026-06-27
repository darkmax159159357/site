"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// "Editor's Choice" — a featured spotlight (large cover + Start Reading) with a
// scrollable thumbnail strip to switch the highlighted series. Mirrors
// mythtoons.org's Editor's Choice section (purple/pink theme, sourced from
// completed series).

type Pick = {
  id: string;
  slug: string;
  title: string;
  cover: string;
  genres: string[];
  description: string;
  status: string;
};

export default function PinnedCollection() {
  const [items, setItems] = useState<Pick[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Client-side fetch of the static catalog — reliable on Vercel
        // (server action can return [] on the read-only serverless FS).
        const res = await fetch("/Medusa/manga/manga.json", { cache: "no-store" });
        const all = await res.json();
        const data = Array.isArray(all) ? all : [];
        // Prefer completed series (like mythtoons); fall back to everything.
        const completed = data.filter(
          (m: any) => (m.status || "").toString().toUpperCase() === "COMPLETED"
        );
        const source = completed.length ? completed : data;
        const mapped: Pick[] = source.slice(0, 10).map((m: any) => ({
          id: m.id,
          slug: m.id,
          title: m.title,
          cover: m.cover,
          genres: Array.isArray(m.genres)
            ? m.genres
            : m.genre
            ? m.genre.split(",").map((g: string) => g.trim())
            : [],
          description: m.description || "No description available",
          status: m.status || "ONGOING",
        }));
        setItems(mapped);
      } catch (e) {
        console.error("Editor's Choice load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const featured = items[active];

  const scrollThumbs = (dir: -1 | 1) => {
    setActive((prev) => {
      const next = prev + dir;
      if (next < 0) return items.length - 1;
      if (next >= items.length) return 0;
      return next;
    });
  };

  if (loading) {
    return (
      <div className="w-full md:h-[35rem] h-auto relative overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 lg:rounded-2xl h-full w-full absolute bottom-0 left-0 shadow-2xl" />
        <div className="flex items-center justify-center h-72 md:h-full">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!featured) return null;

  return (
    <div className="w-full md:h-[35rem] h-auto relative overflow-visible rounded-2xl">
      {/* Glass panel background */}
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 lg:rounded-2xl h-full w-full absolute bottom-0 left-0 shadow-2xl" />

      <div className="lg:grid flex flex-col lg:gap-8 gap-4 lg:py-8 lg:px-6 p-4 lg:grid-cols-2 min-h-full w-full relative">
        {/* LEFT: label, title, genres, description, thumbnail strip */}
        <div className="flex flex-col justify-between lg:gap-6 gap-4 min-h-0 order-2 lg:order-1">
          <div className="grid gap-4 flex-shrink-0">
            {/* Section label */}
            <div className="lg:flex hidden gap-1.5 justify-center items-center w-fit">
              <svg fill="currentColor" viewBox="0 0 20 20" className="w-7 h-7 text-white">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h2
                style={{
                  textShadow:
                    "0 0 20px rgba(168,85,247,0.8), 0 0 40px rgba(168,85,247,0.4), 0 0 60px rgba(217,70,239,0.2)",
                }}
                className="sm:text-2xl text-[5.5vw] font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300"
              >
                Editor's Choice
              </h2>
            </div>

            {/* Title + genres + description */}
            <div className="grid lg:gap-4 gap-2 h-fit lg:ml-8">
              <h1 className="md:text-5xl sm:text-4xl text-2xl font-black text-white line-clamp-2 md:line-clamp-none">
                {featured.title}
              </h1>
              {featured.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {featured.genres.slice(0, 4).map((g, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 md:px-3 md:py-1 bg-purple-500/30 backdrop-blur-sm border border-purple-400/50 rounded-full text-xs font-semibold text-purple-200 hover:bg-purple-500/50 transition-all duration-300"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-gray-300 text-xs md:text-sm leading-relaxed line-clamp-3 md:line-clamp-6">
                {featured.description}
              </div>
            </div>
          </div>

          {/* Thumbnail strip */}
          <div className="md:h-40 h-28 w-full relative overflow-visible px-1 md:px-2 flex-shrink-0">
            <div className="relative h-full w-full md:px-14 px-10">
              <div className="flex gap-2 md:gap-4 h-full overflow-x-auto pb-2 scrollbar-thin px-1">
                {items.map((it, i) => (
                  <button
                    key={it.id}
                    onClick={() => setActive(i)}
                    className={
                      "relative flex-shrink-0 rounded-xl overflow-hidden transition-all duration-500 ease-out h-full aspect-[2/3] group " +
                      (i === active
                        ? "opacity-100 scale-105 ring-2 ring-purple-400/70"
                        : "opacity-50 hover:opacity-75 scale-100 hover:scale-105")
                    }
                  >
                    <div
                      style={{ backgroundImage: `url(${it.cover})` }}
                      className="w-full h-full absolute top-0 left-0 bg-cover bg-center blur-2xl opacity-25"
                    />
                    <div
                      style={{
                        backgroundImage: `url(${it.cover})`,
                        WebkitMaskImage:
                          "linear-gradient(to bottom, rgba(0,0,0,1.5), transparent)",
                      }}
                      className="bg-white/10 bg-no-repeat bg-cover bg-center w-full h-full absolute top-0 left-0 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-500/0 group-hover:from-purple-500/20 to-transparent transition-all duration-300" />
                  </button>
                ))}
              </div>

              {/* Prev / Next */}
              <button
                onClick={() => scrollThumbs(-1)}
                aria-label="Previous"
                className="absolute left-0 md:left-2 top-1/2 -translate-y-1/2 md:w-10 md:h-10 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/80 to-purple-600/80 backdrop-blur-md text-white hover:from-purple-500 hover:to-purple-600 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-purple-500/50 border border-white/20 z-20 hover:scale-110 active:scale-95"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="md:w-6 md:h-6 w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => scrollThumbs(1)}
                aria-label="Next"
                className="absolute right-0 md:right-2 top-1/2 -translate-y-1/2 md:w-10 md:h-10 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/80 to-purple-600/80 backdrop-blur-md text-white hover:from-purple-500 hover:to-purple-600 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-purple-500/50 border border-white/20 z-20 hover:scale-110 active:scale-95"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="md:w-6 md:h-6 w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: featured cover + Start Reading + status badge */}
        <div className="md:h-full h-64 flex lg:justify-end items-end lg:p-8 md:p-6 p-3 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-xl bg-center bg-cover relative overflow-hidden border border-white/20 shadow-xl order-1 lg:order-2">
          <div className="absolute inset-0">
            <Image
              src={featured.cover}
              alt={featured.title}
              fill
              className="object-cover object-top"
              referrerPolicy="no-referrer"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          <Link href={`/manga/${featured.slug}`} className="relative z-10">
            <button className="md:h-11 h-9 md:px-5 px-3 flex items-center gap-2 md:gap-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full transition-all duration-300 overflow-hidden shadow-lg hover:shadow-purple-500/50 hover:scale-105 active:scale-95 border border-white/20 backdrop-blur-sm">
              <svg fill="currentColor" viewBox="0 0 20 20" className="md:w-7 md:h-7 w-5 h-5 text-white">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="font-medium text-white md:text-base text-sm">Start Reading</div>
            </button>
          </Link>

          {/* Status badge */}
          <div className="absolute top-2 md:top-4 right-2 md:right-4 md:px-3 md:py-1.5 px-2 py-1 bg-white/15 backdrop-blur-md rounded-full border border-white/30 flex items-center gap-2 z-10 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-white text-[10px] md:text-xs font-medium capitalize">
              {featured.status.toLowerCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
