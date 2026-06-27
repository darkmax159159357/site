"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { collection, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import "../styles/trending-animations.css";
import "../styles/neon-theme.css"; // Import neon theme
import "../styles/fluid-styles.css";
import "../styles/neon-theme.css";

// Set to false for production
const DEBUG_MODE = false;

// Crown icon SVG for #1 badge
const crownBadge = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 lg:w-4 lg:h-4 text-white">
    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
  </svg>
);

// Fire icon for hot trending items
const fireIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-orange-500">
    <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd" />
  </svg>
);

// Function to check for special tags based on genres
const getSpecialTag = (genres: string[] = []) => {
  if (!genres.length) return null;
  
  const normalizedGenres = genres.map(genre => genre.toLowerCase());
  
  if (normalizedGenres.includes('r-19')) {
    return {
      text: "R-19",
      color: "bg-red-500/80"
    };
  } else if (normalizedGenres.includes('pornhwa')) {
    return {
      text: "Pornhwa",
      color: "bg-pink-500/80"
    };
  }
  return null;
};

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

const badgeGradients = [
  "bg-gradient-to-r from-amber-400 to-yellow-300", // 1 - Gold
  "bg-gradient-to-r from-orange-500 to-red-500", // 2 - Orange/Red
  "bg-gradient-to-r from-lime-500 to-emerald-500", // 3 - Lime/Green
  "bg-gradient-to-r from-pink-500 to-rose-500", // 4 - Pink/Rose
  "bg-gradient-to-r from-blue-500 to-cyan-500", // 5 - Blue/Cyan
  "bg-gradient-to-r from-purple-500 to-fuchsia-500", // 6 - Purple/Fuchsia
];

// Keep these style variables to make editing easier
const styleVars = {
  cardBg: "linear-gradient(180deg, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.3) 100%)",
  cardHover: "linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.5) 100%)",
  pillBg: "rgba(15, 23, 42, 0.3)",
  pillHover: "linear-gradient(90deg, rgba(249, 115, 22, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)"
};

const Trending2 = () => {
  const [activeTab, setActiveTab] = useState("month");
  const [isLoading, setIsLoading] = useState(true);
  const [toons, setToons] = useState<Record<string, Toon[]>>({
    today: [],
    week: [],
    month: [],
  });
  const [usingMockData, setUsingMockData] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        console.log("=== TRENDING2 COMPONENT: STARTING DATA FETCH ===");
        
        // Try different approaches to get data
        let mangaData: Toon[] = [];
        
        // Try manga_ratings collection
        try {
          console.log("LOADING FROM MANGA_RATINGS");
          const ratingsQuery = query(
            collection(db, "manga_ratings"),
            orderBy("averageRating", "desc"),
            limit(20)
          );
          
          const ratingsSnapshot = await getDocs(ratingsQuery);
          console.log(`Manga ratings: found ${ratingsSnapshot.size} documents`);
          
          // Log all document fields to understand the structure
          console.log("==================== FIREBASE DOCUMENT ACCESS ATTEMPTS ====================");
          ratingsSnapshot.docs.forEach(docRef => {
            const data = docRef.data();
            const docId = docRef.id;
            
            // Try different ways to access the rating
            console.log(`Document ID: ${docId}`);
            console.log(`Direct access: data.averageRating =`, data.averageRating);
            console.log(`Bracket access: data["averageRating"] =`, data["averageRating"]);
            
            // Get all keys from the document
            console.log(`All keys in document:`, Object.keys(data).join(", "));
            
            // Try finding the correct key with case insensitive search
            const ratingKey = Object.keys(data).find(
              key => key.toLowerCase() === "averagerating" || 
                    key.toLowerCase() === "average_rating" ||
                    key.toLowerCase() === "avgrating" ||
                    key.toLowerCase() === "rating"
            );
            
            if (ratingKey) {
              console.log(`Found rating under key "${ratingKey}":`, data[ratingKey]);
            } else {
              console.log(`No rating key found in document`);
            }
            
            // Log full document for debugging
            console.log(`Full document:`, JSON.stringify(data));
            console.log("---------------------------------------------------------------");
          });
          console.log("==================================================================");
          
          if (ratingsSnapshot.size > 0) {
            const mangaPromises = ratingsSnapshot.docs.map(async (docRef) => {
              const data = docRef.data();
              console.log(`Manga rating document:`, data);
              
              // Get all keys from the document
              const ratingKey = Object.keys(data).find(
                key => key.toLowerCase() === "averagerating" || 
                      key.toLowerCase() === "average_rating" ||
                      key.toLowerCase() === "avgrating" ||
                      key.toLowerCase() === "rating"
              );
              
              // Try multiple ways to get the rating value
              let rating = 4.5; // Default fallback
              
              try {
                if (data.averageRating !== undefined) {
                  rating = Number(data.averageRating);
                  console.log(`Got rating from data.averageRating: ${rating}`);
                } else if (ratingKey) {
                  rating = Number(data[ratingKey]);
                  console.log(`Got rating from data[${ratingKey}]: ${rating}`); 
                } else if (data.sumOfRatings && data.totalRatings) {
                  // Calculate rating manually if we have sumOfRatings and totalRatings
                  rating = Number(data.sumOfRatings) / Number(data.totalRatings);
                  console.log(`Calculated rating from sumOfRatings/totalRatings: ${rating}`);
                } else if (data.ratingCount) {
                  // Calculate from rating count map if available
                  let sum = 0;
                  let count = 0;
                  
                  // The ratingCount might be a map with keys 1-5
                  for (let i = 1; i <= 5; i++) {
                    if (data.ratingCount[i]) {
                      sum += i * Number(data.ratingCount[i]);
                      count += Number(data.ratingCount[i]);
                    }
                  }
                  
                  if (count > 0) {
                    rating = sum / count;
                    console.log(`Calculated rating from ratingCount map: ${rating}`);
                  }
                }
              } catch (e) {
                console.error(`Error accessing rating:`, e);
              }
              
              console.log(`Final rating for ${docRef.id}:`, rating);
              
              const mangaSlug = data.mangaId || docRef.id;
              let mangaDetails: any = { 
                genres: ["Romance", "Fantasy"],
                chaptersCount: "?",
                chapters: []
              };
              
              // Extract base path from cover field
              // Example cover: "/Medusa/manga/blue-star/cover.jpg"
              const coverPath = data.cover || `/Medusa/manga/${mangaSlug}/cover.jpg`;
              
              // Extract base path to find manga.json
              const pathSegments = coverPath.split('/');
              let basePath = '';
              
              // Find the index of "manga" in the path
              const mangaIndex = pathSegments.findIndex((segment: string) => segment === "manga");
              if (mangaIndex !== -1) {
                // Construct the base path up to the manga folder
                basePath = pathSegments.slice(0, mangaIndex + 1).join('/');
                console.log(`Base path for manga.json: ${basePath}`);
              }
              
              // Attempt to load manga.json data using the constructed path
              try {
                // First try directly with the base path
                const mangaJsonPath = `${basePath}/manga.json`;
                console.log(`Fetching manga.json from: ${mangaJsonPath}`);
                
                const response = await fetch(mangaJsonPath);
                if (response.ok) {
                  const jsonData = await response.json();
                  console.log(`Successfully loaded manga.json from ${mangaJsonPath}`);
                  
                  // Find the specific manga details from the json array
                  const specificManga = jsonData.find((item: any) => 
                    item.id === mangaSlug || item.slug === mangaSlug
                  );
                  
                  if (specificManga) {
                    mangaDetails = specificManga;
                    console.log(`Found specific manga details for ${mangaSlug} in manga.json`);
                  } else {
                    // If no specific match found, try the individual manga.json
                    const individualPath = `${basePath}/${mangaSlug}/manga.json`;
                    console.log(`Trying individual manga.json at: ${individualPath}`);
                    
                    const individualResponse = await fetch(individualPath);
                    if (individualResponse.ok) {
                      mangaDetails = await individualResponse.json();
                      console.log(`Loaded individual manga.json for ${mangaSlug}`);
                    }
                  }
                } else {
                  // If main manga.json fails, try the individual manga.json
                  console.warn(`Could not load main manga.json, status: ${response.status}`);
                  
                  const individualPath = `${basePath}/${mangaSlug}/manga.json`;
                  console.log(`Trying individual manga.json at: ${individualPath}`);
                  
                  const individualResponse = await fetch(individualPath);
                  if (individualResponse.ok) {
                    mangaDetails = await individualResponse.json();
                    console.log(`Loaded individual manga.json for ${mangaSlug}`);
                  } else {
                    console.warn(`Could not find manga.json for ${mangaSlug}, status: ${individualResponse.status}`);
                  }
                }
              } catch (error) {
                console.error(`Error loading manga.json for ${mangaSlug}:`, error);
              }
              
              // Prefer Firestore-stored values (reliable on Vercel); fall back to manga.json.
              const description = data.description || mangaDetails.description || "No description available";
              const genres = (Array.isArray(data.genres) && data.genres.length)
                ? data.genres
                : (mangaDetails.genres || ["Action", "Fantasy"]);
              const chaptersCount = data.chaptersCount?.toString()
                || mangaDetails.chapters?.length?.toString()
                || "?";

              return {
                id: docRef.id,
                slug: mangaSlug,
                title: data.title || mangaDetails.title || mangaSlug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                cover: coverPath,
                description: description,
                views: data.viewCount || 0,
                rating: rating,
                totalRatings: data.totalRatings || 0,
                genres: genres,
                chaptersCount: chaptersCount,
                chapters: mangaDetails.chapters || [],
                isMock: false,
                lastUpdated: data.lastUpdated
              };
            });
            
            mangaData = await Promise.all(mangaPromises);
          }
        } catch (error) {
          console.error("Error fetching from manga_ratings:", error);
        }
        
        // If no ratings data, fall back to manga_views collection
        if (mangaData.length === 0) {
          try {
            console.log("LOADING FROM MANGA_VIEWS");
            const viewsQuery = query(
              collection(db, "manga_views"),
              orderBy("viewCount", "desc"),
              limit(20)
            );
            
            const viewsSnapshot = await getDocs(viewsQuery);
            console.log(`Manga views: found ${viewsSnapshot.size} documents`);
            
            if (viewsSnapshot.size > 0) {
              const mangaPromises = viewsSnapshot.docs.map(async (docRef) => {
                const data = docRef.data();
                console.log(`Manga view document:`, data);
                console.log(`Rating for ${docRef.id}:`, data.averageRating, data.rating);
                
                // Ensure we have a valid rating
                let rating = 4.5; // Default fallback
                if (data.averageRating !== undefined && data.averageRating !== null) {
                  rating = Number(data.averageRating);
                  console.log(`Found rating in averageRating: ${rating}`);
                } else if (data.rating !== undefined && data.rating !== null) {
                  rating = Number(data.rating);
                  console.log(`Found rating in rating field: ${rating}`);
                } else if (data.average_rating !== undefined && data.average_rating !== null) {
                  // Try snake case field name
                  rating = Number(data.average_rating);
                  console.log(`Found rating in average_rating: ${rating}`);
                } else if (data.avg_rating !== undefined && data.avg_rating !== null) {
                  // Try shortened field name
                  rating = Number(data.avg_rating);
                  console.log(`Found rating in avg_rating: ${rating}`);
                } else if (data.rate !== undefined && data.rate !== null) {
                  // Try another alternative
                  rating = Number(data.rate);
                  console.log(`Found rating in rate field: ${rating}`);
                } else {
                  console.log(`No rating field found in document, using default 4.5`);
                }
                console.log(`Final rating for ${docRef.id}:`, rating);
                
                const mangaSlug = data.mangaId || docRef.id;
                
                // Extract base path from manga id to find manga.json
                const basePath = `/Medusa/manga`;
                let mangaDetails: any = {
                  genres: ["Romance", "Fantasy"],
                  chaptersCount: "?",
                  chapters: []
                };
                
                // Try to fetch manga.json
                try {
                  console.log(`Fetching manga.json from ${basePath}/manga.json`);
                  
                  const response = await fetch(`${basePath}/manga.json`);
                  if (response.ok) {
                    const jsonData = await response.json();
                    
                    // Find specific manga in the json array
                    const specificManga = jsonData.find((item: any) => 
                      item.id === mangaSlug || item.slug === mangaSlug
                    );
                    
                    if (specificManga) {
                      mangaDetails = specificManga;
                      console.log(`Found specific manga details for ${mangaSlug} in manga.json`);
                    } else {
                      // If not found in global, try individual manga.json
                      const individualPath = `${basePath}/${mangaSlug}/manga.json`;
                      const individualResponse = await fetch(individualPath);
                      if (individualResponse.ok) {
                        mangaDetails = await individualResponse.json();
                        console.log(`Loaded individual manga.json for ${mangaSlug}`);
                      }
                    }
                  } else {
                    // Try individual manga.json as fallback
                    const individualPath = `${basePath}/${mangaSlug}/manga.json`;
                    const individualResponse = await fetch(individualPath);
                    if (individualResponse.ok) {
                      mangaDetails = await individualResponse.json();
                      console.log(`Loaded individual manga.json for ${mangaSlug}`);
                    } else {
                      console.warn(`Could not find manga.json for ${mangaSlug}`);
                    }
                  }
                } catch (error) {
                  console.error(`Error loading manga.json for ${mangaSlug}:`, error);
                }
                
                // Determine the best cover path
                const coverPath = data.cover || mangaDetails.cover || `${basePath}/${mangaSlug}/cover.jpg`;
                
                // Ensure we have description with fallbacks
                const description = mangaDetails.description || data.description || "No description available";
                
                return {
                  id: docRef.id,
                  slug: mangaSlug,
                  title: data.title || mangaDetails.title || mangaSlug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                  cover: coverPath,
                  description: description,
                  views: data.viewCount || 0,
                  rating: rating,
                  genres: mangaDetails.genres || data.genres || ["Romance", "Fantasy"],
                  chaptersCount: mangaDetails.chapters?.length?.toString() || "?",
                  chapters: mangaDetails.chapters || [],
                  isMock: false,
                  lastUpdated: data.lastViewed
                };
              });
              
              mangaData = await Promise.all(mangaPromises);
            }
          } catch (error) {
            console.error("Error fetching from manga_views:", error);
          }
        }
        
        // Use real data
        setToons({
          today: [...mangaData],
          week: [...mangaData].sort((a, b) => b.rating - a.rating),
          month: [...mangaData].sort((a, b) => {
            // Sort by date if available, otherwise fallback to title
            if (a.lastUpdated && b.lastUpdated) {
              return b.lastUpdated.toMillis() - a.lastUpdated.toMillis();
            }
            return a.title.localeCompare(b.title);
          }),
        });

        // Add debug info for ratings
        console.log("==================== RATINGS DEBUG ====================");
        mangaData.forEach(item => {
          console.log(`Manga: ${item.title}, Rating: ${item.rating}`);
          if (item.rating === 4.5) {
            console.log("⚠️ DEFAULT RATING USED");
          }
        });
        console.log("======================================================");

        setUsingMockData(false);
        
      } catch (error) {
        console.error("Error fetching trending data:", error);
        setErrorMessage(`Firebase error: ${error instanceof Error ? error.message : String(error)}`);
        
        // Use fallback data if Firebase fetch fails
        const getFallbackData = (period: string) => {
          return [];
        };
        
        setToons({
          today: getFallbackData("today"),
          week: getFallbackData("week"),
          month: getFallbackData("month"),
        });
        setUsingMockData(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Extract featured and grid toons
  const currentToons = toons[activeTab] || [];
  const featuredToon = currentToons[0];
  const gridToons = currentToons.slice(1, 7);
  
  return (
    <div className="w-full mt-6 bg-[#0a0a0c] rounded-2xl overflow-hidden shadow-[0_0_15px_rgba(255,95,20,0.3)] border border-orange-500/30">
      <div className="flex flex-col gap-2 px-3 py-4" data-sentry-component="Trending">
        {/* Header with neon style */}
        <div className="flex flex-row gap-3 items-center mb-4 relative">
          {/* Glowing orb accent */}
          <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(255,95,20,0.8)]"></div>
          
          {/* Title with neon glow */}
          <div className="flex flex-row gap-3 items-center min-w-max bg-gradient-to-r from-[#161618] to-[#1c1c1e] p-3 rounded-xl border-l-2 border-orange-500 shadow-[0_0_10px_rgba(255,95,20,0.3)]">
            <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-[0_0_10px_rgba(255,95,20,0.5)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white drop-shadow-lg">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-[22px] lg:text-[32px] text-left font-black tracking-tight text-white drop-shadow-[0_0_5px_rgba(255,95,20,0.7)]">
              Top <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Rated</span>
            </h1>
          </div>
          
          {/* Tabs with neon effect */}
          <div className="ml-auto flex items-center">
            <div role="tablist" aria-orientation="horizontal" className="flex flex-row gap-0.5 xs:gap-1 bg-[#161618] p-0.5 xs:p-1 rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.3)] border-0 shadow-[0_0_6px_rgba(255,95,20,0.3)]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative rounded-lg sm:py-1.5 py-0.5 px-2 xs:px-3 sm:px-4 lg:w-24 w-auto min-w-[38px] xs:min-w-[50px] text-[8px] xs:text-[10px] lg:text-[12px] font-bold uppercase tracking-wider transition-colors
                    ${activeTab === tab.id 
                      ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-[0_0_10px_rgba(255,95,20,0.5)]" 
                      : "bg-transparent hover:bg-slate-800/50 text-gray-400"
                    }`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                >
                  {tab.id === 'today' ? 'Today' : 
                   tab.id === 'week' ? 'Week' : 
                   tab.id === 'month' ? 'Month' : tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="w-full h-80 flex justify-center items-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 shadow-[0_0_15px_rgba(255,95,20,0.3)]"></div>
              <p className="mt-4 text-base font-medium text-orange-500 drop-shadow-[0_0_5px_rgba(255,95,20,0.5)]">Loading top manga...</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col lg:flex-row gap-4">
            {/* Featured manga with neon design - Reduced height */}
            {featuredToon && (
              <div className="w-full lg:w-[50%] mb-2 lg:mb-0">
                <div className="w-full h-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#161618] to-[#0e0e10] shadow-[0_0_15px_rgba(0,0,0,0.5)] border-0 shadow-[0_0_10px_rgba(255,95,20,0.4)]">
                  {/* Rank badge */}
                  <div className="absolute -top-3 -right-3 z-50">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1 shadow-[0_0_10px_rgba(255,95,20,0.7)]">
                      <div className="bg-gradient-to-r from-[#161618] to-[#0e0e10] rounded-full p-1">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full h-8 w-8 flex items-center justify-center relative">
                          <div className="absolute -top-1 -right-1">
                            {crownBadge}
                          </div>
                          <span className="font-black text-white text-lg drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]">#1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row">
                    {/* Cover image - BIGGER SIZE */}
                    <div className="md:w-[250px] md:min-w-[250px] h-[250px] sm:h-[280px] md:h-[360px] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
                      <Image
                        src={featuredToon?.cover || "/placeholder-cover.jpg"}
                        alt={featuredToon?.title || "Featured Manga"}
                        width={250}
                        height={360}
                        quality={100}
                        className="w-full h-full object-cover object-top shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                        style={{ imageRendering: 'auto' }}
                        priority
                      />
                      
                      {/* New Chapter indicator */}
                      {featuredToon?.chapters && featuredToon?.chapters.length > 0 && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1 z-20 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M12 1.5a.75.75 0 01.75.75V4.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5z" clipRule="evenodd" />
                          </svg>
                          NEW
                        </div>
                      )}
                      
                      {/* Total Chapters - Clear prominent display */}
                      <div className="absolute bottom-3 left-0 right-0 mx-auto w-max bg-black/80 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 border-0 shadow-[0_0_8px_rgba(255,95,20,0.4)]">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-orange-500">
                          <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                        </svg>
                        <span className="text-white text-xs font-bold">
                          {featuredToon?.chapters?.length || featuredToon?.chaptersCount || 0} Ch
                        </span>
                      </div>
                    </div>
                    
                    {/* Content with neon highlights - More compact */}
                    <div className="w-full p-2 md:p-2.5 text-white flex flex-col justify-between relative">
                      <div>
                        {/* Title with strong effect */}
                        <h2 className="text-lg md:text-2xl font-black text-left mb-1 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                          {featuredToon?.title}
                        </h2>
                        <div className="h-1 w-24 bg-gradient-to-r from-orange-500 to-transparent rounded-full shadow-[0_0_10px_rgba(255,95,20,0.5)] mb-2"></div>
                        
                        {/* Rating bar - More compact with glowy border */}
                        <div className="flex items-center gap-2 mb-2 bg-[#161618] p-2 rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.3)] border-0 shadow-[0_0_6px_rgba(255,95,20,0.4)] border-l-4 border-yellow-400">
                          <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-[0_0_15px_rgba(255,95,20,0.5)] p-0.5">
                            <div className="w-full h-full rounded-full bg-[#161618] flex items-center justify-center">
                              <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">{featuredToon?.rating?.toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              {Array(5).fill(0).map((_, idx) => (
                                <svg key={idx} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={idx < Math.floor(featuredToon?.rating || 0) ? "currentColor" : "none"} stroke="currentColor" className={`w-3 h-3 ${idx < Math.floor(featuredToon?.rating || 0) ? 'text-yellow-400' : 'text-gray-600'}`}>
                                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-gray-400 text-[9px]">
                              {featuredToon?.totalRatings || 0} ratings
                            </span>
                          </div>
                          
                          {/* Trending status */}
                          <div className="ml-auto flex items-center gap-1 bg-gradient-to-r from-orange-500/10 to-rose-500/5 rounded-lg px-2 py-1 border-0 shadow-[0_0_6px_rgba(255,95,20,0.3)]">
                            {fireIcon}
                            <span className="text-orange-500 text-[9px] font-medium uppercase tracking-wide">Trending</span>
                          </div>
                        </div>
                        
                        {/* BIGGER Description - with glowy border */}
                        <div className="bg-[#161618] p-2.5 rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.3)] border-0 shadow-[0_0_6px_rgba(255,95,20,0.4)] mb-2">
                          <h3 className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-orange-500">
                              <path fillRule="evenodd" d="M4.125 3C3.089 3 2.25 3.84 2.25 4.875V18a3 3 0 003 3h15a3 3 0 01-3-3V4.875C17.25 3.839 16.41 3 15.375 3H4.125z" clipRule="evenodd" />
                            </svg>
                            SYNOPSIS
                          </h3>
                          <p className="text-xs text-gray-300 line-clamp-4">
                            {featuredToon?.description || "No description available"}
                          </p>
                        </div>
                        
                        {/* Genres - with glowy effects instead of borders */}
                        <div className="mb-8">
                          <h3 className="text-[9px] uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-orange-500">
                              <path fillRule="evenodd" d="M5.25 2.25a3 3 0 00-3 3v4.318a3 3 0 00.879 2.121l9.58 9.581c.92.92 2.39.92 3.31 0l3.318-3.319a2.25 2.25 0 000-3.183L9.732 6.332a2.25 2.25 0 00-1.591-.659H5.25zM6.375 7.5a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z" clipRule="evenodd" />
                            </svg>
                            GENRES
                          </h3>
                          <div className="flex flex-wrap gap-1">
                            {featuredToon?.genres?.slice(0, 4)?.map((genre: string, idx: number) => (
                              <span 
                                key={idx} 
                                className="text-[8px] font-medium py-0.5 px-1.5 rounded-full text-white bg-gradient-to-r from-orange-500/20 to-rose-500/10 border-0 shadow-[0_0_6px_rgba(255,95,20,0.3)]"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons - with glowy effects instead of borders */}
                      <div className="flex flex-row gap-2 mt-auto">
                        <Link 
                          href={`/manga/${featuredToon?.slug || ""}`}
                          className="flex-1 px-3 rounded-lg font-bold text-white py-1.5 flex items-center justify-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_15px_rgba(255,95,20,0.5)] uppercase tracking-wider text-[10px]"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                          </svg>
                          Read Now
                        </Link>
                        <Link 
                          href={`/manga/${featuredToon?.slug || ""}`}
                          className="flex-1 px-3 rounded-lg font-bold text-white py-1.5 flex items-center justify-center gap-1 bg-[#161618] border-0 shadow-[0_0_15px_rgba(255,95,20,0.4)] uppercase tracking-wider text-[10px]"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-orange-500">
                            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                          </svg>
                          Add to Library
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Grid of manga cards - Exactly 6 cards, no scrolling */}
            <div className="w-full lg:w-[50%]">
              {/* Section header */}
              <div className="mb-2 flex items-center gap-2">
                <div className="h-0.5 flex-1 bg-gradient-to-r from-orange-500 to-transparent rounded-full shadow-[0_0_10px_rgba(255,95,20,0.3)]"></div>
                <h3 className="text-white font-bold text-xs uppercase tracking-wider">Top Series</h3>
                <div className="h-0.5 flex-1 bg-gradient-to-l from-orange-500 to-transparent rounded-full shadow-[0_0_10px_rgba(255,95,20,0.3)]"></div>
              </div>
              
              {/* Grid layout - 3x2 grid (exactly 6 cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {currentToons.slice(1, 7).map((toon, index) => (
                  <Link 
                    key={toon.id}
                    href={`/manga/${toon.slug}`}
                    className="relative group bg-[#161618] rounded-lg overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.3)] border-0 shadow-[0_0_8px_rgba(255,95,20,0.2)] hover:shadow-[0_0_15px_rgba(255,95,20,0.4)]"
                  >
                    {/* Rank badge */}
                    <div className="absolute top-1 left-1 z-20 bg-black/80 backdrop-blur-sm rounded-lg text-[10px] font-bold flex items-center justify-center h-4 min-w-4 px-1 shadow-[0_0_10px_rgba(0,0,0,0.5)] border-0 shadow-[0_0_6px_rgba(255,95,20,0.3)]">
                      <span className="text-orange-500">#{index + 2}</span>
                    </div>
                    
                    {/* Special Tag (R-19/Pornhwa) */}
                    {toon.genres && getSpecialTag(toon.genres) && (
                      <div className="absolute top-1 right-1 z-20">
                        <span className={`${getSpecialTag(toon.genres)?.color} text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold shadow-lg backdrop-blur-sm`}>
                          {getSpecialTag(toon.genres)?.text}
                        </span>
                      </div>
                    )}
                    
                    {/* Image container */}
                    <div className="w-full h-[120px] relative">
                      <Image
                        src={toon.cover}
                        alt={toon.title}
                        width={120}
                        height={180}
                        quality={80}
                        className="object-cover object-top w-full h-full"
                        style={{ imageRendering: 'auto' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#161618] via-transparent to-transparent z-10"></div>
                      
                      {/* New Chapter indicator */}
                      {toon.chapters && toon.chapters.length > 3 && (
                        <div className="absolute bottom-1 left-1 bg-red-500 rounded-md px-1 py-0.5 text-[7px] font-bold text-white z-20 shadow-[0_0_5px_rgba(239,68,68,0.5)]">NEW</div>
                      )}
                    </div>
                    
                    {/* Content area */}
                    <div className="p-1.5">
                      <h5 className="text-left text-[9px] font-bold line-clamp-1 text-white mb-1">
                        {toon.title}
                      </h5>
                      
                      {/* Rating display */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5 bg-yellow-500/10 px-1 py-0.5 rounded-md">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2 h-2 text-yellow-500">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                          </svg>
                          <span className="text-[8px] font-bold text-yellow-500">{toon.rating?.toFixed(1)}</span>
                        </div>
                        
                        {/* One genre to save space */}
                        {toon.genres && toon.genres[0] && (
                          <span className="text-[7px] bg-[#0a0a0c] px-1 py-0.5 rounded-md text-gray-400">
                            {toon.genres[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {DEBUG_MODE && usingMockData && (
        <div className="mt-2 p-2 text-amber-500 text-[10px] rounded">
          Using mock data: {errorMessage || "No manga data available in database"}
        </div>
      )}
    </div>
  );
};

export default Trending2; 