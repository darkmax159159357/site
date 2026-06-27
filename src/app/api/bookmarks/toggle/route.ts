import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/db";
import { toggleBookmark } from "@/lib/bookmarks";

// Uses the Authorization header, so it can't be statically rendered.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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
    
    // Get the request body
    const { mangaId, title, cover } = await req.json();
    
    if (!mangaId) {
      return NextResponse.json(
        { success: false, message: 'Manga ID is required' },
        { status: 400 }
      );
    }
    
    // Toggle the bookmark
    const isBookmarked = await toggleBookmark(userId, mangaId, title || 'Unknown', cover);
    
    return NextResponse.json({
      success: true,
      isBookmarked,
      message: isBookmarked ? 'Added to bookmarks' : 'Removed from bookmarks'
    });
  } catch (err: any) {
    console.error('Toggle bookmark error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 