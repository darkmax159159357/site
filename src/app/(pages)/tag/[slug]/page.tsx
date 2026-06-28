import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchAllMangaWithGenres } from "@/action/genreFilters";
import TagClient from "./TagClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = params;
  const decodedTag = decodeURIComponent(slug);
  const formattedTag = decodedTag.charAt(0).toUpperCase() + decodedTag.slice(1);

  return {
    title: `${formattedTag} Manga & Manhwa | Glint Scans`,
    description: `Browse all ${formattedTag} manga and manhwa titles at Glint Scans. Find your next favorite ${formattedTag} read!`,
  };
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = params;
  const decodedTag = decodeURIComponent(slug);
  
  try {
    // Fetch all manga with genres
    const allManga = await fetchAllMangaWithGenres();
    
    // Get all available genres for the genre filter component
    const allGenres = new Set<string>();
    allManga.forEach(item => {
      if (Array.isArray(item.genres)) {
        item.genres.forEach((genre: string) => {
          if (genre && genre !== "Unknown") {
            allGenres.add(genre);
          }
        });
      }
    });

    // Filter manga by the current tag/genre
    const filteredManga = allManga.filter(manga => {
      if (!manga.genres || !Array.isArray(manga.genres)) return false;
      return manga.genres.some(genre => 
        genre.toLowerCase() === decodedTag.toLowerCase()
      );
    });

    // If no manga found with this tag, return 404
    if (filteredManga.length === 0) {
      return notFound();
    }

    // Format the tag for display (capitalize first letter)
    const formattedTag = decodedTag.charAt(0).toUpperCase() + decodedTag.slice(1);

    return (
      <TagClient 
        manga={filteredManga} 
        tag={formattedTag} 
        allGenres={Array.from(allGenres).sort()}
      />
    );
  } catch (error) {
    console.error("Error in tag page:", error);
    return notFound();
  }
} 