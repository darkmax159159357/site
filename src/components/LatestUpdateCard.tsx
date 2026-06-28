"use client";

import Image from "next/image";
import Link from "next/link";

// "Latest Updates" card — mirrors mythtoons.org's redesigned card: a per-card
// hue (derived from the manga id) tints the border/shadows/hover-glow and the
// chapter divider; chapters are split into a recent group (newest 2, with coin
// pill + NEW badge) and an older group, separated by a tinted divider.

type Chapter = {
  number: number;
  added_chap_date?: string;
  added_date?: string;
  release_date?: string;
  date?: string;
  coinAmount?: number;
  isLocked?: boolean;
  [key: string]: any;
};

type Props = {
  id: string;
  title: string;
  cover: string;
  chapters?: Chapter[];
};

// Deterministic hue (0-359) from the id, so each card keeps a stable colour.
const hueFromId = (id: string): number => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 360;
};

// Parse a chapter date (ISO 8601 or "DD-MM-YYYY HH:MM am/pm") to ms; 0 if invalid.
const parseTs = (s?: string): number => {
  if (!s || typeof s !== "string") return 0;
  if (s.includes(" ") && !s.includes("T")) {
    const [d, t, ap] = s.split(" ");
    const [day, mon, yr] = d.split("-").map((n) => parseInt(n));
    if (day && mon && yr) {
      const [hh, mm] = (t || "").split(":").map((n) => parseInt(n));
      let hour = hh || 0;
      if (ap?.toLowerCase() === "pm" && hour < 12) hour += 12;
      if (ap?.toLowerCase() === "am" && hour === 12) hour = 0;
      const dt = new Date(yr, mon - 1, day, hour, mm || 0);
      if (!isNaN(dt.getTime())) return dt.getTime();
    }
  }
  const p = new Date(s);
  return isNaN(p.getTime()) ? 0 : p.getTime();
};

const timeAgo = (ts: number): string => {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) { const m = Math.floor(diff / 60); return `${m} minute${m > 1 ? "s" : ""} ago`; }
  if (diff < 86400) { const h = Math.floor(diff / 3600); return `${h} hour${h > 1 ? "s" : ""} ago`; }
  if (diff < 604800) { const d = Math.floor(diff / 86400); return `${d} day${d > 1 ? "s" : ""} ago`; }
  if (diff < 2592000) { const w = Math.floor(diff / 604800); return `${w} week${w > 1 ? "s" : ""} ago`; }
  if (diff < 31536000) { const mo = Math.floor(diff / 2592000); return `${mo} month${mo > 1 ? "s" : ""} ago`; }
  const dt = new Date(ts);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const LockIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
  </svg>
);

export default function LatestUpdateCard({ id, title, cover, chapters = [] }: Props) {
  const hue = hueFromId(id);
  const accent = `hsl(${hue} 35% 55%)`;
  const mix = (pct: number) => `color-mix(in oklab, ${accent} ${pct}%, transparent)`;

  // Newest first, take up to 4.
  const sorted = [...chapters]
    .map((c) => ({ ...c, _ts: parseTs(c.added_chap_date || c.added_date || c.release_date || c.date) }))
    .sort((a, b) => (b.number || 0) - (a.number || 0))
    .slice(0, 4);
  const recent = sorted.slice(0, 2);
  const older = sorted.slice(2, 4);

  const ChapterRow = ({ ch, showMeta }: { ch: any; showMeta: boolean }) => {
    const iso = ch.added_chap_date || ch.added_date || ch.release_date || ch.date || "";
    const isNew = ch._ts > 0 && Date.now() - ch._ts < 86400000;
    const coin = showMeta && Number(ch.coinAmount) > 1;
    return (
      <Link
        href={`/read/${id}-ch${ch.number}`}
        className="flex items-center justify-between text-xs group/chapter py-1 px-1.5 rounded-xl -mx-1.5 cursor-pointer transition-all duration-200 will-change-transform hover:translate-x-[1px] hover:scale-[1.01] active:scale-[0.99]"
        style={{ ["--hover-color" as any]: accent }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-medium text-gray-400 group-hover/chapter:text-white transition-colors whitespace-nowrap">Ch. {ch.number}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-gray-500 text-[10px]">
            <span className="text-[0.60rem] whitespace-nowrap" title={iso}>{timeAgo(ch._ts)}</span>
          </span>
          {coin && (
            <span className="inline-flex items-center gap-1.5 bg-amber-500/10 px-1.5 py-0.5 rounded-[6px]">
              <LockIcon className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] text-amber-500 font-semibold">{ch.coinAmount}c</span>
            </span>
          )}
          {isNew && <span className="text-[9px] font-semibold text-red-500">NEW</span>}
        </div>
      </Link>
    );
  };

  return (
    <div className="block cursor-pointer manga-card-clickable" style={{ position: "relative" }}>
      <Link href={`/manga/${id}`} className="absolute inset-0 z-0" aria-label={title} tabIndex={-1} />
      <div
        className="group relative flex gap-4 bg-[#16161b] p-3 rounded-xl border transition-all duration-300 h-48"
        style={{ borderColor: mix(25), boxShadow: `${mix(8)} 0px 2px 12px` }}
      >
        {/* Hover glow ring */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
          style={{ boxShadow: `${mix(38)} 0px 0px 0px 1px inset, ${mix(18)} 0px 4px 20px` }}
        />
        {/* Cover */}
        <Link href={`/manga/${id}`} className="shrink-0 relative z-10">
          <div
            className="relative h-36 w-28 sm:h-40 sm:w-32 overflow-hidden rounded-xl transition-all duration-300"
            style={{ boxShadow: `${mix(25)} 0px 4px 16px, ${mix(25)} 0px 0px 0px 1px` }}
          >
            <Image
              src={cover}
              alt={title}
              fill
              sizes="128px"
              referrerPolicy="no-referrer"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div
              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ boxShadow: `${mix(55)} 0px 0px 0px 2px inset` }}
            />
          </div>
        </Link>

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0 relative z-10">
          <Link href={`/manga/${id}`}>
            <h3 className="font-semibold text-sm line-clamp-2 transition-colors mb-2 leading-snug">
              <span className="text-white transition-colors">{title}</span>
            </h3>
          </Link>
          <div className="flex-1 min-h-0">
            <div className="space-y-2 chapter-section">
              <div className="space-y-0.5">
                {recent.map((ch) => (
                  <ChapterRow key={`r-${ch.number}`} ch={ch} showMeta />
                ))}
              </div>
              {older.length > 0 && (
                <>
                  <div className="border-t transition-colors duration-300" style={{ borderColor: mix(25) }} />
                  <div className="space-y-0.5">
                    {older.map((ch) => (
                      <ChapterRow key={`o-${ch.number}`} ch={ch} showMeta={false} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
