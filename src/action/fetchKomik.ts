"use server";

import fs from 'fs';
import path from 'path';

// Define multiple possible paths to check
const PUBLIC_MEDUSA_PATH = path.resolve(process.cwd(), 'public', 'Medusa');
const ROOT_MEDUSA_PATH = path.resolve(process.cwd(), 'Medusa');
// Use the first path that exists
const MEDUSA_PATH = fs.existsSync(PUBLIC_MEDUSA_PATH) ? PUBLIC_MEDUSA_PATH : ROOT_MEDUSA_PATH;
// Local paths based on the found Medusa path
const MANGA_PATH = path.join(MEDUSA_PATH, 'manga');
const MANGA_JSON_PATH = path.join(MANGA_PATH, 'manga.json');

// Log the actual path being used
console.log("Using MEDUSA_PATH:", MEDUSA_PATH);

// For serving the manga images
const BASE_URL = '';


// Helper to resolve file paths - checks if file exists in public first, then root
const resolveFilePath = (relativePath: string): string | null => {
  // Try public path first
  const publicPath = path.join(PUBLIC_MEDUSA_PATH, relativePath.replace(/^\/manga\//, ''));
  if (fs.existsSync(publicPath)) {
    return publicPath;
  }
  
  // Try root path next
  const rootPath = path.join(ROOT_MEDUSA_PATH, relativePath.replace(/^\/manga\//, ''));
  if (fs.existsSync(rootPath)) {
    return rootPath;
  }
  
  return null; // File not found in either location
};

// Function to check and get chapter thumbnail path
const getChapterThumbnail = (mangaId: string, chapterNumber: number): string | null => {
  try {
    // Try to find thumbnail.jpg or thumbnail.webp in the chapter directory
    const chapterPath = `/manga/${mangaId}/chapter-${chapterNumber}/thumbnail.jpg`;
    const chapterPathWebp = `/manga/${mangaId}/chapter-${chapterNumber}/thumbnail.webp`;
    
    // Check if thumbnail exists
    if (resolveFilePath(chapterPath)) {
      return ensureMediaPath(chapterPath);
    }
    
    // Check webp version
    if (resolveFilePath(chapterPathWebp)) {
      return ensureMediaPath(chapterPathWebp);
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting thumbnail for chapter ${chapterNumber} in ${mangaId}:`, error);
    return null;
  }
};

// Utility function to ensure media paths work correctly
const ensureMediaPath = (mediaPath: string): string => {
  if (!mediaPath) {
    return '/fallback-image.png';
  }
  
  // If the path already starts with http, keep it as is
  if (mediaPath.startsWith('http')) {
    return mediaPath;
  }
  
  // For paths from manga.json like "/manga/blue-star/cover.jpg"
  if (mediaPath.startsWith('/manga/')) {
    // Check if file exists in public/Medusa first
    const publicPath = `/Medusa${mediaPath}`;
    const absolutePublicPath = path.join(process.cwd(), 'public', publicPath);
    
    if (fs.existsSync(absolutePublicPath)) {
      return publicPath;
    }
    
    // If not in public, try direct root Medusa path
    const rootPath = mediaPath.replace('/manga/', '/Medusa/manga/');
    const absoluteRootPath = path.join(process.cwd(), rootPath.slice(1));
    
    if (fs.existsSync(absoluteRootPath)) {
      return rootPath;
    }
    
    // Default back to public path even if not found
    return publicPath;
  }
  
  // For other relative paths, ensure they start with /
  if (!mediaPath.startsWith('/')) {
    return `/${mediaPath}`;
  }
  
  return mediaPath;
};

// Export the function so it can be used in other files
export async function fetchMangaData(): Promise<any[]> {
  try {
    // Check if manga.json exists
    if (!fs.existsSync(MANGA_JSON_PATH)) {
      console.error("Manga data file not found:", MANGA_JSON_PATH);
      
      return [];
    }

    // Read the manga.json file directly from the file system
    const data = JSON.parse(fs.readFileSync(MANGA_JSON_PATH, 'utf8'));
    
    // Debug - log the first chapter of each manga to check for lock info
    if (Array.isArray(data) && data.length > 0) {
      data.forEach(manga => {
        if (manga.chapters && manga.chapters.length > 0) {
          const firstChapter = manga.chapters[0];
          console.log(`[fetchMangaData] First chapter of ${manga.id}:`, {
            number: firstChapter.number,
            isLocked: firstChapter.isLocked,
            unlockTime: firstChapter.unlockTime,
            coinAmount: firstChapter.coinAmount
          });
          
          // Also log any locked chapters specifically
          const lockedChapters = manga.chapters.filter((ch: any) => ch.isLocked);
          if (lockedChapters.length > 0) {
            console.log(`[fetchMangaData] Locked chapters in ${manga.id}:`, 
              lockedChapters.map((ch: any) => ({
                number: ch.number,
                isLocked: ch.isLocked,
                unlockTime: ch.unlockTime,
                coinAmount: ch.coinAmount
              }))
            );
          }
        }
      });
    }
    
    // Process the manga data to use the correct actual paths for the files
    const processedData = Array.isArray(data) ? data.map(manga => {
      // Use cover as fallback for banner if banner is empty
      const bannerPath = manga.banner && manga.banner.trim() !== '' 
                        ? manga.banner 
                        : manga.cover; // Use cover as banner if no banner specified
      
      return {
        ...manga,
        // Ensure cover and banner paths are correctly formatted
        cover: ensureMediaPath(manga.cover),
        banner: ensureMediaPath(bannerPath), // Use the fallback banner path
        
        // Fix chapter pages paths as well
        chapters: manga.chapters?.map((chapter: any) => {
          return {
            ...chapter,
            // Ensure page paths are correctly formatted
            pages: Array.isArray(chapter.pages) 
              ? chapter.pages.map((page: string) => ensureMediaPath(page))
              : [],
            // Always initialize as unlocked, we'll check Firebase later
            isLocked: false,
            unlockTime: chapter.unlockTime || null,
            // Process thumbnail if it exists in JSON
            thumbnail: chapter.thumbnail ? ensureMediaPath(chapter.thumbnail) : null
          };
        })
      };
    }) : [];
    
    return processedData;
  } catch (error) {
    console.error("Error fetching manga data from local file:", error);
    return [];
  }
}

export const fetchLastUpdated = async (): Promise<any[]> => {
  try {
    const data = await fetchMangaData();

    if (!data || !Array.isArray(data)) {
      console.error("Invalid data format:", data);
      return [];
    }

    return data.map((manga) => {
      const coverPath = manga.cover || "/fallback-image.png";
      // Use cover as banner fallback if banner is missing or empty
      const bannerPath = manga.banner && manga.banner.trim() !== '' 
                        ? manga.banner 
                        : coverPath;
                        
      return {
        id: manga.id || Math.random().toString(36).substr(2, 9),
        title: manga.title || "Unknown Title",
        cover: coverPath,
        banner: bannerPath,
        description: manga.description || "No description available",
        genre: manga.genre || "",
        genres: Array.isArray(manga.genres) ? manga.genres : [],
        chapters: manga.chapters?.map((chapter: any) => {
          return {
            id: `${manga.id}-ch${chapter.number}`,
            number: chapter.number,
            title: chapter.title || `Chapter ${chapter.number}`,
            pages: chapter.pages || [],
            // Preserve all date fields from the original chapter data
            added_chap_date: chapter.added_chap_date,
            added_date: chapter.added_date,
            release_date: chapter.release_date,
            date: chapter.date,
            // Also preserve lock information
            isLocked: false,
            unlockTime: chapter.unlockTime || null,
            coinAmount: chapter.coinAmount || 1,
            // Include thumbnail if it exists
            thumbnail: chapter.thumbnail ? ensureMediaPath(chapter.thumbnail) : null
          };
        }) || [],          
      };
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
};

export const fetchMangaByAdvSearch = async (type: string): Promise<any[] | null> => {
  const data = await fetchMangaData();
  if (!type) return data;
  const q = type.toLowerCase();
  return data.filter((manga) => manga.type?.toLowerCase().includes(q));
};

export const fetchMangaAdvSearch = async (title: string): Promise<any | null> => {
  const data = await fetchMangaData();
  if (!title) return null;
  const q = title.toLowerCase();
  return data.find((manga) => (manga.title || "").toLowerCase().includes(q)) || null;
};

export const fetchDetail = async (id: string): Promise<any | null> => {
  try {
    const data = await fetchMangaData();
    const manga = data.find((m) => m.id === id);
    
    if (!manga) return null;

    // Use cover as fallback for banner if banner is empty or missing
    const coverPath = manga.cover || "/fallback-image.png";
    const bannerPath = manga.banner && manga.banner.trim() !== '' 
                      ? manga.banner 
                      : coverPath; // Use cover as banner if no banner specified

    return {
      ...manga,
      cover: ensureMediaPath(coverPath),
      banner: ensureMediaPath(bannerPath),
      genre: manga.genre || "",
      chapters: manga.chapters?.map((chapter: any) => {
        return {
          id: `${manga.id}-ch${chapter.number}`,
          number: chapter.number,
          title: chapter.title || `Chapter ${chapter.number}`,
          pages: chapter.pages || [],
          // Preserve all date fields from the original chapter data
          added_chap_date: chapter.added_chap_date,
          added_date: chapter.added_date,
          release_date: chapter.release_date,
          date: chapter.date,
          // Always initialize as unlocked, we'll check Firebase later
          isLocked: false,
          unlockTime: chapter.unlockTime || null,
          coinAmount: chapter.coinAmount || 1,
          // Create a slug for consistent URL formatting
          chapter_slug: `${manga.id}-ch${chapter.number}`,
          chapter_title: chapter.title || `Chapter ${chapter.number}`,
          chapter_release: chapter.added_chap_date || chapter.added_date || chapter.release_date || chapter.date || "",
          // First check if thumbnail exists in JSON data, then fall back to file search
          thumbnail: chapter.thumbnail ? ensureMediaPath(chapter.thumbnail) : getChapterThumbnail(manga.id, chapter.number)
        };
      })
    };
  } catch (error) {
    console.error("Error in fetchDetail:", error);
    return null;
  }
};

export const debugPaths = async (): Promise<any> => {
  // Simple debug info - no specific manga
  const debugInfo = {
    cwd: process.cwd(),
    medusaPath: MEDUSA_PATH,
    mangaPath: MANGA_PATH,
    mangaJsonPath: MANGA_JSON_PATH,
    mangaJsonExists: fs.existsSync(MANGA_JSON_PATH),
    mangaDirContents: fs.existsSync(MANGA_PATH) ? fs.readdirSync(MANGA_PATH) : "Directory not found"
  };
  
  return debugInfo;
};

// Add the missing fetchSearch function
export const fetchSearch = async (query: string): Promise<any[] | null> => {
  try {
    const data = await fetchMangaData();
    const results = data.filter((manga) => manga.title.toLowerCase().includes(query.toLowerCase()));
    
    // Format the results to ensure cover URLs are properly formatted
    return results.map((manga) => ({
      id: manga.id || Math.random().toString(36).substr(2, 9),
      title: manga.title || "Unknown Title",
      cover: ensureMediaPath(manga.cover || "/fallback-image.svg"),
      description: manga.description || "No description available",
      genre: manga.genre || "",
      genres: Array.isArray(manga.genres) ? manga.genres : [],
      chapters: manga.chapters?.map((chapter: any) => {
        return {
          id: `${manga.id}-ch${chapter.number}`,
          number: chapter.number,
          title: chapter.title || `Chapter ${chapter.number}`,
          pages: chapter.pages || [],
          // Preserve all date fields from the original chapter data
          added_chap_date: chapter.added_chap_date,
          added_date: chapter.added_date,
          release_date: chapter.release_date,
          date: chapter.date,
          // Always initialize as unlocked, we'll check Firebase later
          isLocked: false,
          unlockTime: chapter.unlockTime || null,
          coinAmount: chapter.coinAmount || 1,
          // Include thumbnail if it exists
          thumbnail: chapter.thumbnail ? ensureMediaPath(chapter.thumbnail) : null
        };
      }) || [],
    }));
  } catch (error) {
    console.error("Search error:", error);
    return null;
  }
};

// Make sure the fetchRead function is complete
export const fetchRead = async (id: string): Promise<any | null> => {
  try {
    console.log(`[fetchRead] Starting fetch for chapter ID: ${id}`);
    
    // Parse the ID to extract manga ID and chapter number
    // Format is expected to be like "manga-id-ch1"
    const parts = id.split('-ch');
    if (parts.length !== 2) {
      console.error("[fetchRead] Invalid chapter ID format:", id);
      return null;
    }
    
    const mangaId = parts[0];
    const chapterNumber = parseInt(parts[1], 10);
    
    console.log(`[fetchRead] Parsed mangaId: ${mangaId}, chapterNumber: ${chapterNumber}`);
    
    // Get the manga details
    const manga = await fetchDetail(mangaId);
    if (!manga) {
      console.error("[fetchRead] Manga not found for ID:", mangaId);
      return null;
    }
    
    console.log(`[fetchRead] Successfully fetched manga: ${manga.title}`);
    console.log(`[fetchRead] Found ${manga.chapters?.length || 0} chapters in manga data`);
    
    // Find the specific chapter
    const chapter = manga.chapters?.find((ch: any) => ch.number === chapterNumber);
    if (!chapter) {
      console.error(`[fetchRead] Chapter ${chapterNumber} not found in manga:`, mangaId);
      return null;
    }
    
    // Sort all chapters by number (descending)
    // This is crucial for the chapter navigation dropdown
    const sortedChapters = [...(manga.chapters || [])].sort((a: any, b: any) => b.number - a.number);
    console.log(`[fetchRead] Sorted ${sortedChapters.length} chapters`);
    
    // Find the index of the current chapter in the sorted list
    const currentIndex = sortedChapters.findIndex((ch: any) => ch.number === chapterNumber);
    console.log(`[fetchRead] Current chapter index: ${currentIndex} of ${sortedChapters.length - 1}`);
    
    // Determine previous and next chapters
    const prevChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;
    const nextChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
    
    // Format the output
    const result = {
      id: id,
      title: manga.title,
      chapterTitle: chapter.title && chapter.title.toLowerCase().includes(`chapter ${chapterNumber}`) 
        ? chapter.title 
        : `Chapter ${chapter.number}${chapter.title ? ' - ' + chapter.title : ''}`,
      status: manga.status,
      cover: manga.cover,
      banner: manga.banner,
      description: manga.description,
      author: manga.author,
      artist: manga.artist,
      rating: manga.rating,
      published: manga.published,
      type: manga.type,
      genre: manga.genres?.join(", "),
      genres: manga.genres,
      mangaId: mangaId,
      mangaTitle: manga.title,
      mangaCover: manga.cover,
      pages: chapter.pages || [],
      has_next: {
        has_next_link: nextChapter ? `/read/${mangaId}-ch${nextChapter.number}` : null,
        is_next_link: !!nextChapter
      },
      has_prev: {
        has_prev_link: prevChapter ? `/read/${mangaId}-ch${prevChapter.number}` : null,
        is_prev_link: !!prevChapter
      },
      // Important: Include all chapters with formatted IDs for the dropdown
      chapters: sortedChapters.map((ch: any) => ({
        ...ch,
        id: `${mangaId}-ch${ch.number}`,
        manga_title: manga.title
      })),
      // Always initialize as unlocked, we'll check Firebase later
      isLocked: false,
      unlockTime: chapter.unlockTime || null,
      coinAmount: chapter.coinAmount || 1
    };
    
    console.log(`[fetchRead] Returning chapter data with ${result.chapters?.length || 0} chapters in list`);
    console.log(`[fetchRead] Next chapter: ${result.has_next?.has_next_link || 'None'}`);
    console.log(`[fetchRead] Previous chapter: ${result.has_prev?.has_prev_link || 'None'}`);
    
    return result;
  } catch (error) {
    console.error("[fetchRead] Error fetching chapter:", error);
    return null;
  }
};