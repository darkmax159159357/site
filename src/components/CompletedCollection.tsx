"use client";

import { useEffect, useState } from "react";
import MangaCard from "./MangaCard";
import { FaCheckCircle } from "react-icons/fa";

// "Completed Collection" — manhwa whose status is COMPLETED.
export default function CompletedCollection() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Client-side fetch of the static catalog — reliable on Vercel.
        const res = await fetch("/Medusa/manga/manga.json", { cache: "no-store" });
        const all = await res.json();
        const data = Array.isArray(all) ? all : [];
        const completed = data.filter(
          (m: any) => (m.status || "").toString().toUpperCase() === "COMPLETED"
        );
        setList(completed.slice(0, 9));
      } catch (e) {
        console.error("CompletedCollection load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Hide the whole section if there are no completed series.
  if (!loading && list.length === 0) return null;

  return (
    <div className="px-2 sm:px-0">
      {/* Section header (matches the site's accent style) */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white">
          <FaCheckCircle />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Completed <span className="text-emerald-400">Collection</span>
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/50 to-transparent" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#222224] rounded-xl aspect-video animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-3 sm:gap-4">
          {list.map((manga, index) => (
            <MangaCard
              key={manga.id || index}
              id={manga.id}
              title={manga.title}
              image={manga.cover}
              cover={manga.cover}
              genres={Array.isArray(manga.genres) ? manga.genres : (manga.genre ? manga.genre.split(",").map((g: string) => g.trim()) : [])}
              chapters={manga.chapters || []}
              status={manga.status || "COMPLETED"}
              type={manga.type}
            />
          ))}
        </div>
      )}
    </div>
  );
}
