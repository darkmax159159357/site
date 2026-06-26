import { MetadataRoute } from "next";
import { fetchMangaData } from "@/action/fetchKomik";
import { fetchAllMangaWithGenres, fetchPornhwa, fetchR19Manga } from "@/action/genreFilters";
import { getBaseUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get base URL from environment helper to ensure HTTPS
  const baseUrl = getBaseUrl();
  
  // Create static sitemap entries
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/dmca`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/latestupdated`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/r19`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pornhwa`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
  ];

  // Get all manga data
  const allManga = await fetchMangaData();
  const r19Manga = await fetchR19Manga();
  const pornhwaManga = await fetchPornhwa();
  const allMangaWithGenres = await fetchAllMangaWithGenres();
  
  // Extract unique genres from all manga
  const allGenres = new Set<string>();
  allMangaWithGenres.forEach(manga => {
    if (Array.isArray(manga.genres)) {
      manga.genres.forEach((genre: string) => {
        if (genre && genre.trim() !== '') {
          allGenres.add(genre.trim());
        }
      });
    }
  });

  // Create manga detail pages
  const mangaDetailPages = allManga.map(manga => ({
    url: `${baseUrl}/manga/${manga.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Create r19 detail pages
  const r19DetailPages = r19Manga.map(manga => ({
    url: `${baseUrl}/r19/${manga.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Create pornhwa detail pages
  const pornhwaDetailPages = pornhwaManga.map(manga => ({
    url: `${baseUrl}/pornhwa/${manga.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Create genre pages
  const genrePages = Array.from(allGenres).map(genre => ({
    url: `${baseUrl}/tag/${encodeURIComponent(genre.toLowerCase())}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Create chapter pages for all manga
  const chapterPages = allManga.flatMap(manga => 
    manga.chapters?.map((chapter: any) => ({
      url: `${baseUrl}/read/${manga.id}-ch${chapter.number}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })) || []
  );

  // Combine all sitemap entries
  return [
    ...staticPages,
    ...mangaDetailPages,
    ...r19DetailPages,
    ...pornhwaDetailPages,
    ...genrePages,
    ...chapterPages,
  ];
}
