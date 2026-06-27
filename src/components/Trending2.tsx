"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { collection, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Set to false for production
const DEBUG_MODE = false;

type Toon = {
  id: string;
  slug: string;
  title: string;
  cover: string;
  description?: string;
  views: number;
  rating: number;
  totalRatings?: number;
  genres?: string[];
  lastUpdated?: Timestamp;
  isMock?: boolean;
  chaptersCount?: string;
  chapters?: any[];
};

const tabs = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
];

// Flame icon used on each ranked row (mythtoons uses a lucide flame).
const Flame = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="#ef4444"
    stroke="#ef4444"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

// Rank badge: gold/silver/bronze medal for 1-3, cyan ring for 4+.
const RankBadge = ({ rank }: { rank: number }) => {
  const medals: Record<number, { ring: string; face: string }> = {
    1: { ring: "from-yellow-300 to-amber-500", face: "from-yellow-200 to-amber-400" },
    2: { ring: "from-gray-200 to-gray-400", face: "from-gray-100 to-gray-300" },
    3: { ring: "from-orange-300 to-amber-700", face: "from-orange-200 to-amber-600" },
  };

  if (rank <= 3) {
    const m = medals[rank];
    return (
      <div className={`w-6 h-6 md:w-10 md:h-10 rounded-full p-[2px] bg-gradient-to-br ${m.ring} shadow-md`}>
        <div className={`w-full h-full rounded-full bg-gradient-to-br ${m.face} flex items-center justify-center`}>
          <span className="text-[10px] md:text-sm font-black text-black/80 drop-shadow">{rank}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-6 h-6 md:w-10 md:h-10 rounded-full border-2 border-cyan-400/70 flex items-center justify-center bg-[#0f1014] shadow-[0_0_8px_rgba(34,211,238,0.4)]">
      <span className="text-[10px] md:text-sm font-bold text-cyan-300">{rank}</span>
    </div>
  );
};

// One ranked row in the "TOP SERIES" grid.
const RankRow = ({ toon, rank }: { toon: Toon; rank: number }) => (
  <Link
    href={`/manga/${toon.slug}`}
    className="group flex items-center gap-1.5 md:gap-3 bg-[#1a1a1a] hover:bg-[#252525] rounded-xl p-1.5 md:p-4 border border-gray-800 hover:border-gray-700 transition-all"
  >
    <div className="flex-shrink-0 w-6 md:w-12 h-6 md:h-12 flex items-center justify-center">
      <RankBadge rank={rank} />
    </div>
    <div className="relative w-10 md:w-20 h-10 md:h-20 rounded-xl overflow-hidden flex-shrink-0">
      <Image
        src={toon.cover}
        alt={toon.title}
        fill
        sizes="80px"
        referrerPolicy="no-referrer"
        className="object-cover group-hover:scale-110 transition-transform"
      />
    </div>
    <div className="flex flex-col flex-1 min-w-0">
      <h3 className="text-xs md:text-base font-bold text-white mb-1 line-clamp-1 md:line-clamp-2">
        {toon.title}
      </h3>
      <div className="flex flex-wrap gap-1 text-xs text-gray-400 mb-1">
        {toon.genres?.slice(0, 2).map((g, i) => (
          <span key={i}>{g}</span>
        ))}
      </div>
      <div className="text-xs text-gray-500">{toon.chaptersCount} chapters</div>
    </div>
    <div className="flex-shrink-0">
      <Flame className="w-4 md:w-5 h-4 md:h-5" />
    </div>
  </Link>
);

const Trending2 = () => {
  const [activeTab, setActiveTab] = useState("today");
  const [isLoading, setIsLoading] = useState(true);
  const [toons, setToons] = useState<Record<string, Toon[]>>({
    today: [],
    week: [],
    month: [],
  });
  const [usingMockData, setUsingMockData] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let mangaData: Toon[] = [];

        // 1) Top-rated from manga_ratings
        try {
          const ratingsSnapshot = await getDocs(
            query(collection(db, "manga_ratings"), orderBy("averageRating", "desc"), limit(20))
          );

          if (ratingsSnapshot.size > 0) {
            const mangaPromises = ratingsSnapshot.docs.map(async (docRef) => {
              const data = docRef.data();

              const ratingKey = Object.keys(data).find(
                (key) =>
                  key.toLowerCase() === "averagerating" ||
                  key.toLowerCase() === "average_rating" ||
                  key.toLowerCase() === "avgrating" ||
                  key.toLowerCase() === "rating"
              );

              let rating = 4.5;
              try {
                if (data.averageRating !== undefined) rating = Number(data.averageRating);
                else if (ratingKey) rating = Number(data[ratingKey]);
                else if (data.sumOfRatings && data.totalRatings)
                  rating = Number(data.sumOfRatings) / Number(data.totalRatings);
              } catch {}

              const mangaSlug = data.mangaId || docRef.id;
              let mangaDetails: any = { genres: [], chaptersCount: "?", chapters: [] };
              const coverPath = data.cover || `/Medusa/manga/${mangaSlug}/cover.jpg`;

              // Enrich from manga.json (best effort).
              try {
                const response = await fetch(`/Medusa/manga/manga.json`);
                if (response.ok) {
                  const jsonData = await response.json();
                  const specific = jsonData.find(
                    (item: any) => item.id === mangaSlug || item.slug === mangaSlug
                  );
                  if (specific) mangaDetails = specific;
                }
              } catch {}

              const description = data.description || mangaDetails.description || "No description available";
              const genres =
                Array.isArray(data.genres) && data.genres.length
                  ? data.genres
                  : mangaDetails.genres || [];
              const chaptersCount =
                data.chaptersCount?.toString() ||
                mangaDetails.chapters?.length?.toString() ||
                "?";

              return {
                id: docRef.id,
                slug: mangaSlug,
                title:
                  data.title ||
                  mangaDetails.title ||
                  mangaSlug.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
                cover: coverPath,
                description,
                views: data.viewCount || 0,
                rating,
                totalRatings: data.totalRatings || 0,
                genres,
                chaptersCount,
                chapters: mangaDetails.chapters || [],
                isMock: false,
                lastUpdated: data.lastUpdated,
              } as Toon;
            });

            mangaData = await Promise.all(mangaPromises);
          }
        } catch (error) {
          console.error("Error fetching from manga_ratings:", error);
        }

        // 2) Fallback to manga_views
        if (mangaData.length === 0) {
          try {
            const viewsSnapshot = await getDocs(
              query(collection(db, "manga_views"), orderBy("viewCount", "desc"), limit(20))
            );
            if (viewsSnapshot.size > 0) {
              const mangaPromises = viewsSnapshot.docs.map(async (docRef) => {
                const data = docRef.data();
                const mangaSlug = data.mangaId || docRef.id;
                let mangaDetails: any = { genres: [], chapters: [] };
                try {
                  const response = await fetch(`/Medusa/manga/manga.json`);
                  if (response.ok) {
                    const jsonData = await response.json();
                    const specific = jsonData.find(
                      (item: any) => item.id === mangaSlug || item.slug === mangaSlug
                    );
                    if (specific) mangaDetails = specific;
                  }
                } catch {}

                const coverPath = data.cover || mangaDetails.cover || `/Medusa/manga/${mangaSlug}/cover.jpg`;
                return {
                  id: docRef.id,
                  slug: mangaSlug,
                  title:
                    data.title ||
                    mangaDetails.title ||
                    mangaSlug.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
                  cover: coverPath,
                  description: mangaDetails.description || data.description || "",
                  views: data.viewCount || 0,
                  rating: Number(data.averageRating ?? data.rating ?? 4.5),
                  genres: mangaDetails.genres || data.genres || [],
                  chaptersCount: mangaDetails.chapters?.length?.toString() || "?",
                  chapters: mangaDetails.chapters || [],
                  isMock: false,
                  lastUpdated: data.lastViewed,
                } as Toon;
              });
              mangaData = await Promise.all(mangaPromises);
            }
          } catch (error) {
            console.error("Error fetching from manga_views:", error);
          }
        }

        setToons({
          today: [...mangaData],
          week: [...mangaData].sort((a, b) => b.rating - a.rating),
          month: [...mangaData].sort((a, b) => {
            if (a.lastUpdated && b.lastUpdated)
              return b.lastUpdated.toMillis() - a.lastUpdated.toMillis();
            return a.title.localeCompare(b.title);
          }),
        });
        setUsingMockData(false);
      } catch (error) {
        console.error("Error fetching trending data:", error);
        setErrorMessage(`Firebase error: ${error instanceof Error ? error.message : String(error)}`);
        setToons({ today: [], week: [], month: [] });
        setUsingMockData(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const currentToons = toons[activeTab] || [];
  const featured = currentToons[0];
  // Medal grid shows ranks 1-6 (featured duplicates rank 1, matching mythtoons).
  const col1 = currentToons.slice(0, 3); // ranks 1-3
  const col2 = currentToons.slice(3, 6); // ranks 4-6

  return (
    <div className="w-full mt-6 bg-[#0f0f0f] rounded-3xl p-4 md:p-6 border border-gray-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-center md:justify-between mb-6 gap-4 md:gap-0">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Trending Now</h1>
          <p className="text-xs md:text-base text-gray-400">Discover what&#39;s blowing up today!</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto flex-wrap md:flex-nowrap justify-center md:justify-end">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-full text-xs md:text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-black"
                  : "bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="w-full h-96 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin" />
        </div>
      ) : currentToons.length === 0 ? (
        <div className="w-full h-96 flex items-center justify-center">
          <p className="text-gray-400">No manga available</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Featured rank #1 */}
          {featured && (
            <div className="w-full md:w-[280px] flex-shrink-0 mb-6 md:mb-0">
              <Link
                href={`/manga/${featured.slug}`}
                className="group relative rounded-2xl overflow-hidden bg-black block border border-gray-700"
              >
                <div className="relative w-full h-[180px] md:h-[280px] rounded-t-2xl overflow-hidden">
                  <Image
                    src={featured.cover}
                    alt={featured.title}
                    fill
                    sizes="280px"
                    referrerPolicy="no-referrer"
                    className="object-cover object-top md:object-center"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <RankBadge rank={1} />
                  </div>
                </div>
                <div className="relative bg-black p-2 md:p-3">
                  <h2 className="text-sm md:text-base font-bold text-white mb-1 line-clamp-2">
                    {featured.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                      {featured.chaptersCount} chapters
                    </span>
                    <span>⭐ {featured.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {featured.genres?.slice(0, 2).map((g, i) => (
                      <span key={i} className="bg-white/10 text-white text-xs px-2 py-0.5 rounded">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* TOP SERIES medal grid */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-center gap-4 mt-0 md:-mt-6 mb-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
              <h2 className="text-white font-bold text-sm md:text-base whitespace-nowrap tracking-wider">
                TOP SERIES
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 flex-1">
              <div className="flex flex-col gap-1.5 md:gap-2 flex-1 justify-between">
                {col1.map((t, i) => (
                  <RankRow key={t.id} toon={t} rank={i + 1} />
                ))}
              </div>
              <div className="flex flex-col gap-1.5 md:gap-2 flex-1 justify-between">
                {col2.map((t, i) => (
                  <RankRow key={t.id} toon={t} rank={i + 4} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {DEBUG_MODE && usingMockData && (
        <div className="mt-2 p-2 text-amber-500 text-[10px] rounded">
          Using mock data: {errorMessage || "No manga data available in database"}
        </div>
      )}
    </div>
  );
};

export default Trending2;
