"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchLastUpdated } from "@/action/fetchKomik";

// "Complete Collection" — mirrors mythtoons.org's #completed-toons: a header
// (emerald check icon + title + "View All →") above a horizontal, drag-to-scroll
// row of 2:3 poster cards. Each card has a per-card warm-tinted shadow, a ✓
// ribbon (top-left, pulsing emerald dot), a "Completed" pill (top-right) and a
// title + ⭐rating + 👁views row below the cover. Edge-fade gradients on both sides.

type Item = {
  id: string;
  title: string;
  cover: string;
  rating: number | null;
  views: number;
};

// mythtoons' warm card-tint palette, cycled by index.
const PALETTE: [number, number, number][] = [
  [191, 106, 64],
  [144, 32, 32],
  [96, 64, 48],
  [191, 64, 191],
  [128, 48, 48],
  [191, 64, 64],
];

// Compact view count (e.g. 6432 -> "6.4K").
const fmtViews = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
};

const StarIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
  </svg>
);

const EyeIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// One completed poster card (reused by the homepage row and the /completed grid).
export function CompletedPosterCard({ item, index }: { item: Item; index: number }) {
  const [r, g, b] = PALETTE[index % PALETTE.length];
  return (
    <Link draggable={false} className="block select-none" href={`/manga/${item.id}`}>
      <div className="group relative w-[140px] space-y-2 shrink-0">
        <div
          className="relative aspect-[2/3] overflow-hidden rounded-xl transition-all duration-300"
          style={{ boxShadow: `rgba(${r},${g},${b},0.082) 0px 4px 14px, rgba(${r},${g},${b},0.082) 0px 0px 0px 1px` }}
        >
          <Image
            draggable={false}
            alt={item.title}
            fill
            sizes="140px"
            referrerPolicy="no-referrer"
            className="object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none select-none"
            src={item.cover}
          />
          <div
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
            style={{ boxShadow: `rgba(${r},${g},${b},0.376) 0px 0px 0px 2px inset, rgba(${r},${g},${b},0.25) 0px 0px 20px, rgba(0,0,0,0.145) 0px 8px 32px` }}
          />
          {/* ✓ ribbon (top-left) */}
          <div className="absolute top-2 left-2 z-20">
            <div
              className="relative flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: `rgb(${r},${g},${b})`, boxShadow: `rgba(${r},${g},${b},0.376) 0px 4px 12px, rgba(255,255,255,0.3) 0px 1px 0px inset` }}
            >
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
              <span className="relative z-10">✓</span>
              <div className="absolute inset-0 rounded-md bg-gradient-to-b from-white/30 via-transparent to-black/20" />
            </div>
          </div>
          {/* "Completed" pill (top-right) */}
          <div className="absolute top-2 right-2 z-20 px-1.5 py-0.5 rounded-md text-[9px] font-semibold text-white/90 backdrop-blur-md border border-white/10">
            Completed
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-60 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-gray-200 group-hover:text-white transition-colors">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-0.5 font-medium">
              <StarIcon className="h-3 w-3 text-gray-500" />
              {item.rating != null ? item.rating.toFixed(1).replace(/\.0$/, "") : "N/A"}
            </span>
            <span className="text-gray-600">•</span>
            <span className="flex items-center gap-0.5">
              <EyeIcon className="h-3 w-3" />
              {fmtViews(item.views)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Fetch completed series (status COMPLETED) enriched with a Firestore view-count
// map. Shared by the homepage row and the /completed grid.
export async function loadCompleted(limit?: number): Promise<Item[]> {
  const [data, viewsMap] = await Promise.all([
    fetchLastUpdated().catch(() => []),
    (async () => {
      const map = new Map<string, number>();
      try {
        const snap = await getDocs(collection(db, "manga_views"));
        snap.forEach((d) => {
          const v = d.data() as any;
          map.set(v.mangaId || d.id, Number(v.viewCount) || 0);
        });
      } catch {}
      return map;
    })(),
  ]);

  const completed = (data || []).filter(
    (m: any) => (m.status || "").toString().toUpperCase() === "COMPLETED"
  );
  const items: Item[] = completed.map((m: any) => ({
    id: m.id,
    title: m.title,
    cover: m.cover,
    rating: m.rating != null ? Number(m.rating) : m.averageRating != null ? Number(m.averageRating) : null,
    views: viewsMap.get(m.id) || 0,
  }));
  return typeof limit === "number" ? items.slice(0, limit) : items;
}

export default function CompletedCollection() {
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, startX: 0, startScroll: 0 });

  useEffect(() => {
    (async () => {
      try {
        setList(await loadCompleted(24));
      } catch (e) {
        console.error("CompletedCollection load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Hide the whole section if there are no completed series.
  if (!loading && list.length === 0) return null;

  const onDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    drag.current = { down: true, startX: e.pageX, startScroll: el.scrollLeft };
  };
  const onMove = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el || !drag.current.down) return;
    e.preventDefault();
    el.scrollLeft = drag.current.startScroll - (e.pageX - drag.current.startX);
  };
  const stopDrag = () => {
    drag.current.down = false;
  };

  return (
    <section className="py-10 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-emerald-500" aria-hidden="true">
                <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                <path d="m9 11 3 3L22 4" />
              </svg>
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">Complete Collection</h2>
          </div>
          <Link className="text-sm font-medium text-gray-400 hover:text-emerald-500 transition-colors" href="/completed">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-[140px] shrink-0 aspect-[2/3] rounded-xl bg-[#1a1a1a] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden -mx-4 sm:-mx-6 lg:mx-0">
            <div
              ref={scrollRef}
              onMouseDown={onDown}
              onMouseMove={onMove}
              onMouseUp={stopDrag}
              onMouseLeave={stopDrag}
              className="overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              style={{ touchAction: "pan-x" }}
            >
              <div className="flex gap-4 pb-4" style={{ width: "max-content" }}>
                {list.map((item, i) => (
                  <CompletedPosterCard key={`${item.id}-${i}`} item={item} index={i} />
                ))}
              </div>
            </div>
            {/* Edge fade gradients (match mythtoons; #141517 page bg) */}
            <div
              className="absolute left-0 top-0 bottom-0 w-20 sm:w-28 lg:w-40 pointer-events-none z-10"
              style={{ background: "linear-gradient(to right, rgb(20,21,23) 0%, rgb(20,21,23) 15%, rgba(20,21,23,0.9) 40%, rgba(20,21,23,0.5) 70%, transparent 100%)" }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-20 sm:w-28 lg:w-40 pointer-events-none z-10"
              style={{ background: "linear-gradient(to left, rgb(20,21,23) 0%, rgb(20,21,23) 15%, rgba(20,21,23,0.9) 40%, rgba(20,21,23,0.5) 70%, transparent 100%)" }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
