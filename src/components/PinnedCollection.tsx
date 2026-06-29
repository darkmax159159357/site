"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import { Pin } from "lucide-react";
import "@splidejs/react-splide/css";
import "@/styles/pintoons.css";

// "Pinned Collection" — a neon-framed Splide carousel of editor-featured series.
// Mirrors mythtoons.org's pintoons-splide section: each card gets one of six
// cycling neon palettes, a rank badge, cover, and an overlaid caption (title,
// genres, description, ⭐ rating / chapter-count stats).

type Item = {
  id: string;
  slug: string;
  title: string;
  cover: string;
  genres: string[];
  description: string;
  chaptersCount: string;
  rating: number | null;
  status: string;
};

// Normalize catalog status to mythtoons' wording (CSS capitalizes it):
// RELEASING/ONGOING -> "ongoing", COMPLETED -> "completed", HIATUS -> "hiatus".
const statusLabel = (s?: string): string => {
  const t = (s || "").toString().toUpperCase();
  if (t.includes("COMPLETE")) return "completed";
  if (t.includes("HIATUS")) return "hiatus";
  if (t.includes("RELEAS") || t.includes("ONGOING")) return "ongoing";
  return s ? s.toLowerCase() : "ongoing";
};

// Six neon themes cycled per card (same palette/order as mythtoons).
const NEON_THEMES = [
  { name: "purple", border: "rgba(168,85,247,0.6)", accent: "#a855f7", gradient: "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(124,58,237,0.05))", glow: "0 0 20px rgba(168,85,247,0.4), 0 0 40px rgba(168,85,247,0.2)", glowHover: "0 0 30px rgba(168,85,247,0.6), 0 0 60px rgba(168,85,247,0.4), 0 0 80px rgba(168,85,247,0.2)" },
  { name: "cyan", border: "rgba(34,211,238,0.6)", accent: "#22d3ee", gradient: "linear-gradient(135deg, rgba(34,211,238,0.1), rgba(6,182,212,0.05))", glow: "0 0 20px rgba(34,211,238,0.4), 0 0 40px rgba(34,211,238,0.2)", glowHover: "0 0 30px rgba(34,211,238,0.6), 0 0 60px rgba(34,211,238,0.4), 0 0 80px rgba(34,211,238,0.2)" },
  { name: "pink", border: "rgba(236,72,153,0.6)", accent: "#ec4899", gradient: "linear-gradient(135deg, rgba(236,72,153,0.1), rgba(219,39,119,0.05))", glow: "0 0 20px rgba(236,72,153,0.4), 0 0 40px rgba(236,72,153,0.2)", glowHover: "0 0 30px rgba(236,72,153,0.6), 0 0 60px rgba(236,72,153,0.4), 0 0 80px rgba(236,72,153,0.2)" },
  { name: "blue", border: "rgba(59,130,246,0.6)", accent: "#3b82f6", gradient: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(37,99,235,0.05))", glow: "0 0 20px rgba(59,130,246,0.4), 0 0 40px rgba(59,130,246,0.2)", glowHover: "0 0 30px rgba(59,130,246,0.6), 0 0 60px rgba(59,130,246,0.4), 0 0 80px rgba(59,130,246,0.2)" },
  { name: "orange", border: "rgba(251,146,60,0.6)", accent: "#fb923c", gradient: "linear-gradient(135deg, rgba(251,146,60,0.1), rgba(249,115,22,0.05))", glow: "0 0 20px rgba(251,146,60,0.4), 0 0 40px rgba(251,146,60,0.2)", glowHover: "0 0 30px rgba(251,146,60,0.6), 0 0 60px rgba(251,146,60,0.4), 0 0 80px rgba(251,146,60,0.2)" },
  { name: "green", border: "rgba(34,197,94,0.6)", accent: "#22c55e", gradient: "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(22,163,74,0.05))", glow: "0 0 20px rgba(34,197,94,0.4), 0 0 40px rgba(34,197,94,0.2)", glowHover: "0 0 30px rgba(34,197,94,0.6), 0 0 60px rgba(34,197,94,0.4), 0 0 80px rgba(34,197,94,0.2)" },
] as const;

export default function PinnedCollection() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const splideRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        // Read the raw catalog directly: fetchLastUpdated() strips the `status`
        // and `rating` fields the card needs (status badge + ⭐ value).
        const res = await fetch("/Medusa/manga/manga.json");
        const data = res.ok ? await res.json() : [];
        const mapped: Item[] = (data || []).slice(0, 14).map((m: any) => ({
          id: m.id,
          slug: m.id,
          title: m.title || "Untitled",
          cover: m.cover || "/fallback-image.svg",
          genres: Array.isArray(m.genres)
            ? m.genres
            : m.genre
            ? m.genre.split(",").map((g: string) => g.trim())
            : [],
          description: m.description || "",
          chaptersCount: Array.isArray(m.chapters) ? String(m.chapters.length) : "0",
          rating:
            m.rating != null && !isNaN(Number(m.rating)) ? Number(m.rating) : null,
          status: statusLabel(m.status),
        }));
        setItems(mapped);
      } catch (e) {
        console.error("Pinned Collection load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-2xl font-bold text-gray-400 animate-pulse">Loading…</div>
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  const go = (dir: "<" | ">") => splideRef.current?.splide?.go(dir);

  return (
    <section className="w-screen relative left-1/2 right-1/2 -mx-[50vw] py-8">
      {/* Header */}
      <div className="mb-8 max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 ring-1 ring-purple-500/30">
            <Pin className="h-5 w-5 text-purple-500" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Pinned Collection</h2>
            <p className="text-sm text-gray-400">Featured series by our editors</p>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative pintoons-splide">
        <button onClick={() => go("<")} aria-label="Previous" className="neon-arrow-prev">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button onClick={() => go(">")} aria-label="Next" className="neon-arrow-next">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <Splide
          ref={splideRef}
          options={{
            type: "loop",
            focus: "center",
            perPage: 5,
            perMove: 1,
            gap: "0.875rem",
            trimSpace: false,
            autoplay: true,
            interval: 4000,
            pauseOnHover: true,
            arrows: false,
            pagination: false,
            drag: true,
            snap: true,
            speed: 800,
            easing: "cubic-bezier(0.25, 1, 0.5, 1)",
            breakpoints: {
              // Keep 5-per-row (width calc(20% - 0.7rem)) on all wide screens,
              // exactly like mythtoons — no 6-per-row override at 1920+.
              1200: { perPage: 4, gap: "0.875rem" },
              1024: { perPage: 3, gap: "0.75rem" },
              768: { perPage: 3, gap: "0.75rem" },
              640: { perPage: 3, gap: "0.4rem" },
              480: { perPage: 2, gap: "0.4rem" },
            },
          }}
          aria-roledescription="carousel"
        >
          {items.map((item, i) => {
            const theme = NEON_THEMES[i % NEON_THEMES.length];
            return (
              <SplideSlide key={item.id}>
                <Link href={`/manga/${item.slug}`} className="group block">
                  <div
                    data-theme={theme.name}
                    className="neon-card mx-auto"
                    style={
                      {
                        "--neon-border": theme.border,
                        "--neon-glow": theme.glow,
                        "--neon-glow-hover": theme.glowHover,
                        "--neon-gradient": theme.gradient,
                        "--neon-accent": theme.accent,
                      } as React.CSSProperties
                    }
                  >
                    <div className="neon-corner neon-corner-tl" />
                    <div className="neon-corner neon-corner-tr" />
                    <div className="neon-corner neon-corner-bl" />
                    <div className="neon-corner neon-corner-br" />
                    <div className="neon-badge">{String(i + 1).padStart(2, "0")}</div>

                    {/* Cover */}
                    <div className="absolute inset-0 w-full h-full">
                      <Image
                        src={item.cover}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 220px"
                        referrerPolicy="no-referrer"
                        className="object-cover"
                        priority={i < 5}
                        quality={90}
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-[65%] bg-gradient-to-t from-black from-20% via-black/90 via-50% to-transparent" />
                    </div>

                    {/* Caption */}
                    <div className="neon-caption">
                      <h3 className="neon-title">{item.title}</h3>
                      {item.genres.length > 0 && (
                        <div className="flex flex-wrap justify-center mt-2 mb-3">
                          {item.genres.slice(0, 3).map((g, gi) => (
                            <span key={gi} className="neon-genre-tag">{g}</span>
                          ))}
                        </div>
                      )}
                      {item.description && <p className="neon-description">{item.description}</p>}
                      <div className="neon-divider" />
                      <div className="neon-stats">
                        <div className="neon-stat">
                          <span className="neon-stat-icon">⭐</span>
                          <span className="neon-stat-value">
                            {typeof item.rating === "number" ? item.rating.toFixed(1) : "N/A"}
                          </span>
                        </div>
                        <div className="neon-stat">
                          <span className="neon-stat-label">Ch.</span>
                          <span className="neon-stat-value">{item.chaptersCount || "0"}+</span>
                        </div>
                        <div className="neon-stat">
                          <span className="neon-status">{item.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </SplideSlide>
            );
          })}
        </Splide>
      </div>
    </section>
  );
}
