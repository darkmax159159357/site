"use client";

import { useEffect, useState } from "react";
import { CompletedPosterCard, loadCompleted } from "@/components/CompletedCollection";

type Item = Awaited<ReturnType<typeof loadCompleted>>[number];

// Full grid of completed series for the /completed page. Reuses the same poster
// card and data loader as the homepage "Complete Collection" row.
export default function CompletedGrid() {
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setList(await loadCompleted());
      } catch (e) {
        console.error("CompletedGrid load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-emerald-500" aria-hidden="true">
            <path d="M21.801 10A10 10 0 1 1 17 3.335" />
            <path d="m9 11 3 3L22 4" />
          </svg>
        </span>
        <h2 className="text-xl font-bold tracking-tight text-white">Complete Collection</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-4">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-[#1a1a1a] animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="text-gray-400">No completed series yet.</p>
      ) : (
        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-4 justify-items-center">
          {list.map((item, i) => (
            <CompletedPosterCard key={`${item.id}-${i}`} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
