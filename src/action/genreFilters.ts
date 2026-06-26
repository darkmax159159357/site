import { fetchMangaData } from "./fetchKomik";

// All genre filtering reads from the local catalog (fetchMangaData) — no external API.

// Function to filter manga by r19 genre
export const fetchR19Manga = async (): Promise<any[]> => {
  try {
    const data = await fetchMangaData();
    
    if (!data || !Array.isArray(data)) {
      console.error("Invalid data format:", data);
      return [];
    }

    // Filter manga with r19 genre
    const r19Manga = data.filter((manga) => {
      // Check in genre string
      if (manga.genre && typeof manga.genre === 'string') {
        const genreLower = manga.genre.toLowerCase();
        // Check for exact R19 genre match
        const genres = genreLower.split(',').map((g: string) => g.trim());
        return genres.some((g: string) => g === 'r19' || g === 'r-19' || g === '18+');
      }
      
      // Check in genres array
      if (Array.isArray(manga.genres) && manga.genres.length > 0) {
        const hasR19 = manga.genres.some((g: string) => {
          if (!g) return false;
          const genreLower = g.toLowerCase().trim();
          // Check for exact R19 genre match
          return genreLower === 'r19' || genreLower === 'r-19' || genreLower === '18+';
        });
        return hasR19;
      }
      
      return false;
    });

    return r19Manga.map((manga) => ({
      id: manga.id || Math.random().toString(36).substr(2, 9),
      title: manga.title || "Unknown Title",
      cover: manga.cover || "/fallback-image.png",
      banner: manga.banner || undefined,
      description: manga.description || "No description available",
      genre: manga.genre || "",
      genres: Array.isArray(manga.genres) ? manga.genres : [],
      chapters: manga.chapters?.map((chapter: { 
        id?: string; 
        number: number; 
        title?: string; 
        pages?: string[];
        added_date?: string;
        added_chap_date?: string;
        release_date?: string;
      }) => ({
        id: `${manga.id}-ch${chapter.number}`,
        number: chapter.number,
        title: chapter.title || `Chapter ${chapter.number}`,
        pages: chapter.pages || [],
        added_chap_date: chapter.added_chap_date,
        added_date: chapter.added_date,
        release_date: chapter.release_date,
        date: chapter.added_chap_date || chapter.added_date || chapter.release_date || new Date().toISOString()
      })) || [],          
    }));
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
};

// Function to filter manga by pornhwa genre
export const fetchPornhwa = async (): Promise<any[]> => {
  try {
    const data = await fetchMangaData();
    
    if (!data || !Array.isArray(data)) {
      console.error("Invalid data format:", data);
      return [];
    }

    // Filter manga with pornhwa genre
    const pornhwaManga = data.filter((manga) => {
      // Check in genre string
      if (manga.genre && typeof manga.genre === 'string') {
        const genreLower = manga.genre.toLowerCase();
        // Check for exact Pornhwa genre match
        const genres = genreLower.split(',').map((g: string) => g.trim());
        return genres.some((g: string) => g === 'pornhwa');
      }
      
      // Check in genres array
      if (Array.isArray(manga.genres) && manga.genres.length > 0) {
        const hasPornhwa = manga.genres.some((g: string) => {
          if (!g) return false;
          const genreLower = g.toLowerCase().trim();
          // Check for exact Pornhwa genre match
          return genreLower === 'pornhwa';
        });
        return hasPornhwa;
      }
      
      return false;
    });

    return pornhwaManga.map((manga) => ({
      id: manga.id || Math.random().toString(36).substr(2, 9),
      title: manga.title || "Unknown Title",
      cover: manga.cover || "/fallback-image.png",
      banner: manga.banner || undefined,
      description: manga.description || "No description available",
      genre: manga.genre || "",
      genres: Array.isArray(manga.genres) ? manga.genres : [],
      chapters: manga.chapters?.map((chapter: { 
        id?: string; 
        number: number; 
        title?: string; 
        pages?: string[];
        added_date?: string;
        added_chap_date?: string;
        release_date?: string;
      }) => ({
        id: `${manga.id}-ch${chapter.number}`,
        number: chapter.number,
        title: chapter.title || `Chapter ${chapter.number}`,
        pages: chapter.pages || [],
        added_chap_date: chapter.added_chap_date,
        added_date: chapter.added_date,
        release_date: chapter.release_date,
        date: chapter.added_chap_date || chapter.added_date || chapter.release_date || new Date().toISOString()
      })) || [],          
    }));
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
};

// Function to get all manga with genre information for the genre page
export const fetchAllMangaWithGenres = async (): Promise<any[]> => {
  try {
    // Use the internal fetchMangaData function instead of API call
    const data = await fetchMangaData();
    
    if (!data || !Array.isArray(data)) {
      console.error("Invalid data format:", data);
      return [];
    }
    
    // Extract all manga with genres
    const mangaWithGenres = data.filter(
      (item: any) => (item.genres && Array.isArray(item.genres) && item.genres.length > 0) || 
                    (item.genre && typeof item.genre === 'string')
    );
    
    // Format the data properly
    const formattedManga = mangaWithGenres.map(manga => {
      // Process genres to ensure they're in array format
      let genreArray: string[] = [];
      
      if (Array.isArray(manga.genres) && manga.genres.length > 0) {
        genreArray = manga.genres;
      } else if (manga.genre && typeof manga.genre === 'string') {
        genreArray = manga.genre.split(',').map((g: string) => g.trim());
      }
      
      return {
        id: manga.id || Math.random().toString(36).substr(2, 9),
        title: manga.title || "Unknown Title",
        cover: manga.cover || "/fallback-image.png",
        banner: manga.banner || undefined,
        description: manga.description || "No description available",
        genre: manga.genre || "",
        genres: genreArray.length > 0 ? genreArray : ["Unknown"],
        chapters: manga.chapters?.map((chapter: { 
          id?: string; 
          number: number; 
          title?: string; 
          pages?: string[];
          added_date?: string;
          added_chap_date?: string;
          release_date?: string;
        }) => ({
          id: `${manga.id}-ch${chapter.number}`,
          number: chapter.number,
          title: chapter.title || `Chapter ${chapter.number}`,
          pages: chapter.pages || [],
          added_chap_date: chapter.added_chap_date,
          added_date: chapter.added_date,
          release_date: chapter.release_date,
        })) || [],
      };
    });
    
    // If there are chapters, log a sample to debug date issues
    if (formattedManga.length > 0 && formattedManga[0].chapters && formattedManga[0].chapters.length > 0) {
      console.log("Sample chapter data with dates:", {
        title: formattedManga[0].title,
        sampleChapter: formattedManga[0].chapters[0],
        dateFields: {
          added_chap_date: formattedManga[0].chapters[0].added_chap_date,
          added_date: formattedManga[0].chapters[0].added_date,
          release_date: formattedManga[0].chapters[0].release_date
        }
      });
    }
    
    return formattedManga;
  } catch (error) {
    console.error("Error fetching manga with genres:", error);
    return [];
  }
}; 