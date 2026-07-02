"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// "Top Rated" — mirrors mythtoons.org's #top-charts: a trophy-headed section
// ("Top Rated" + subtitle) above a 1/2/3-column grid of ranked rows. Rank 1 gets
// a crown, 2-3 get medals (silver / bronze), 4+ get a plain number; the top three
// rows carry a faint gradient tint. Each row = rank badge + cover + title + up to
// two genre tags + ⭐rating + 👁views. Data: manga_ratings -> manga_views fallback.

type Toon = {
  id: string;
  slug: string;
  title: string;
  cover: string;
  views: number;
  rating: number;
  genres: string[];
};

const fmtViews = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
};

const Trophy = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const Crown = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" /><path d="M5 21h14" />
  </svg>
);

const Medal = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" /><path d="M11 12 5.12 2.2" /><path d="m13 12 5.88-9.8" /><path d="M8 7h8" /><circle cx="12" cy="17" r="5" /><path d="M12 18v-2h-.5" />
  </svg>
);

const Star = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
  </svg>
);

const Eye = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />
  </svg>
);

// Medal styling for ranks 1-3 (gold / silver / bronze). Neutral `zinc` for silver
// so #2 reads as metallic silver, not blue. Each badge gets a pulsing coloured
// glow + a periodic white shine sweep (see the .medal-shine keyframes below).
const MEDAL: Record<1 | 2 | 3, { grad: string; ring: string; shadow: string; glow: string; icon: string }> = {
  1: { grad: "from-amber-500/25 to-yellow-500/25", ring: "ring-amber-400/50", shadow: "shadow-amber-500/30", glow: "rgba(251,191,36,0.5)", icon: "text-amber-300" },
  2: { grad: "from-zinc-200/40 to-zinc-400/50", ring: "ring-zinc-100/70", shadow: "shadow-zinc-300/40", glow: "rgba(228,228,231,0.55)", icon: "text-zinc-100" },
  3: { grad: "from-orange-600/25 to-amber-700/25", ring: "ring-orange-500/50", shadow: "shadow-orange-500/30", glow: "rgba(251,146,60,0.5)", icon: "text-orange-300" },
};

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank >= 1 && rank <= 3) {
    const m = MEDAL[rank as 1 | 2 | 3];
    const Icon = rank === 1 ? Crown : Medal;
    return (
      <div className="relative">
        {/* pulsing coloured glow behind the medal */}
        <div className="absolute inset-0 rounded-xl blur-md animate-pulse" style={{ background: m.glow }} />
        <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-gradient-to-br ${m.grad} ring-1 ${m.ring} shadow-lg ${m.shadow}`}>
          <Icon className={`h-5 w-5 ${m.icon} drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]`} />
          {/* metallic shine sweep */}
          <span className="medal-shine" />
        </div>
      </div>
    );
  }
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
      style={{ backgroundColor: "rgba(192,128,128,0.082)", color: "rgb(192,128,128)", boxShadow: "rgba(192,128,128,0.082) 0px 2px 8px, rgba(192,128,128,0.125) 0px 0px 0px 1px inset" }}
    >
      {rank}
    </div>
  );
};

const TOP_GRAD: Record<number, string> = {
  1: "from-amber-500/20 to-yellow-500/20",
  2: "from-zinc-300/20 to-zinc-400/20",
  3: "from-orange-600/20 to-amber-700/20",
};

const RankRow = ({ toon, rank }: { toon: Toon; rank: number }) => (
  <Link
    href={`/manga/${toon.slug}`}
    className="group relative flex gap-4 items-center p-4 rounded-2xl ring-1 ring-white/5 hover:ring-white/10 transition-all duration-300"
    style={rank > 3 ? { backgroundColor: "rgba(192,128,128,0.03)", borderColor: "rgba(192,128,128,0.125)", boxShadow: "rgba(192,128,128,0.03) 0px 2px 12px" } : undefined}
  >
    {/* faint gradient tint for the top three rows */}
    {rank <= 3 && (
      <div className={`absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-r ${TOP_GRAD[rank]} opacity-30 group-hover:opacity-50 transition-opacity duration-300`} />
    )}
    <div className="relative w-12 flex justify-center shrink-0">
      <RankBadge rank={rank} />
    </div>
    <div className="relative h-28 w-20 overflow-hidden rounded-xl shrink-0" style={{ boxShadow: "rgba(192,128,128,0.145) 0px 4px 16px, rgba(192,128,128,0.125) 0px 0px 0px 1px" }}>
      <Image
        src={toon.cover}
        alt={toon.title}
        fill
        sizes="80px"
        referrerPolicy="no-referrer"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
    <div className="relative flex-1 min-w-0 space-y-2">
      <h3 className="font-semibold text-sm line-clamp-2 text-white leading-snug">{toon.title}</h3>
      {toon.genres?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {toon.genres.slice(0, 2).map((g, i) => (
            <span key={i} className="inline-flex items-center rounded-md h-5 px-2 text-[10px] font-medium" style={{ backgroundColor: "rgba(192,128,128,0.082)", color: "rgb(192,128,128)" }}>
              {g}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1 font-medium" style={{ color: "rgb(176,112,96)" }}>
          <Star className="h-3.5 w-3.5" />
          {toon.rating ? toon.rating.toFixed(1) : "N/A"}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {fmtViews(toon.views)}
        </span>
      </div>
    </div>
  </Link>
);

const Trending2 = () => {
  const [toons, setToons] = useState<Toon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Load the catalog once for genre/title/cover enrichment.
        let catalog: any[] = [];
        try {
          const res = await fetch("/Medusa/manga/manga.json");
          if (res.ok) catalog = await res.json();
        } catch {}
        const findManga = (slug: string) => catalog.find((m) => m.id === slug || m.slug === slug);

        const build = (docs: any[], ratingKey: string): Toon[] =>
          docs.map((docRef) => {
            const data = docRef.data();
            const slug = data.mangaId || docRef.id;
            const info = findManga(slug) || {};
            const rawRating = data[ratingKey] ?? data.averageRating ?? data.rating ?? info.rating;
            return {
              id: docRef.id,
              slug,
              title: data.title || info.title || slug.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
              cover: data.cover || info.cover || `/Medusa/manga/${slug}/cover.jpg`,
              views: Number(data.viewCount) || 0,
              rating: Number(rawRating) || 0,
              genres: Array.isArray(data.genres) && data.genres.length ? data.genres : info.genres || [],
            };
          });

        let list: Toon[] = [];
        // 1) Top-rated from manga_ratings
        try {
          const snap = await getDocs(query(collection(db, "manga_ratings"), orderBy("averageRating", "desc"), limit(20)));
          if (snap.size > 0) list = build(snap.docs, "averageRating");
        } catch (e) {
          console.error("Top Rated: manga_ratings error", e);
        }
        // 2) Fallback to manga_views
        if (list.length === 0) {
          try {
            const snap = await getDocs(query(collection(db, "manga_views"), orderBy("viewCount", "desc"), limit(20)));
            if (snap.size > 0) list = build(snap.docs, "averageRating");
          } catch (e) {
            console.error("Top Rated: manga_views error", e);
          }
        }

        list.sort((a, b) => b.rating - a.rating || b.views - a.views);
        setToons(list.slice(0, 9));
      } catch (error) {
        console.error("Top Rated: fetch error", error);
        setToons([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!isLoading && toons.length === 0) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-1 ring-amber-500/30">
          <Trophy className="h-5 w-5 text-amber-500" />
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Top Rated</h2>
          <p className="text-sm text-gray-400">Top ranked series by our readers</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[124px] rounded-2xl bg-[#141414] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {toons.map((t, i) => (
            <RankRow key={t.id} toon={t} rank={i + 1} />
          ))}
        </div>
      )}

      {/* Metallic shine sweep for the rank medals (gold/silver/bronze). */}
      <style jsx global>{`
        .medal-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.5) 50%, transparent 65%);
          transform: translateX(-130%);
          animation: medalShine 3.8s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes medalShine {
          0%, 55% { transform: translateX(-130%); }
          82%, 100% { transform: translateX(130%); }
        }
      `}</style>
    </div>
  );
};

export default Trending2;
