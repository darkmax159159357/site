import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import fs from 'fs';
import path from 'path';

// Define the base path to the Medusa folder
const MEDUSA_PATH = path.join(process.cwd(), 'Medusa');
const MANGA_PATH = path.join(MEDUSA_PATH, 'manga');
const MANGA_JSON_PATH = path.join(MANGA_PATH, 'manga.json');

export async function GET(request: NextRequest) {
  try {
    // Get the search query from the URL
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    
    if (!query) {
      return NextResponse.json(
        { status: "error", message: "Search query is required" },
        { status: 400 }
      );
    }
    
    // Check if manga.json exists
    if (!fs.existsSync(MANGA_JSON_PATH)) {
      return NextResponse.json(
        { status: "error", message: "Manga data file not found" },
        { status: 404 }
      );
    }
    
    // Read manga.json
    const content = fs.readFileSync(MANGA_JSON_PATH, 'utf8');
    const allManga = JSON.parse(content);
    
    // Search for manga
    const results = allManga.filter((manga: any) => 
      manga.title.toLowerCase().includes(query.toLowerCase())
    );
    
    // Format the results
    const formattedResults = results.map((manga: any) => ({
      id: manga.id,
      title: manga.title,
      cover: manga.cover,
      description: manga.description,
      genres: manga.genres,
      type: manga.type,
      status: manga.status
    }));
    
    return NextResponse.json(
      { status: "success", data: formattedResults },
      { status: 200 }
    );
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to search manga" },
      { status: 500 }
    );
  }
} 