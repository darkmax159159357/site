import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/db";
import { isBookmarked, getLastReadChapter } from "@/lib/bookmarks";

// Uses the Authorization header + request URL, so it can't be statically rendered.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify the token and get the user ID
    const userId = verifyToken(token);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Get the manga ID from the query parameters
    const url = new URL(req.url);
    const mangaId = url.searchParams.get('mangaId');
    
    if (!mangaId) {
      return NextResponse.json(
        { success: false, message: 'Manga ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the manga is bookmarked
    const bookmarked = await isBookmarked(userId, mangaId);

    // Get the last read chapter
    const lastReadChapter = await getLastReadChapter(userId, mangaId);
    
    return NextResponse.json({
      success: true,
      isBookmarked: bookmarked,
      lastReadChapter
    });
  } catch (err: any) {
    console.error('Check bookmark error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 