import { NextRequest, NextResponse } from "next/server";
import { updateLastReadChapter, verifyToken } from "@/lib/db";

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
    const { mangaId, chapterNumber } = await req.json();
    
    if (!mangaId || !chapterNumber) {
      return NextResponse.json(
        { success: false, message: 'Manga ID and chapter number are required' },
        { status: 400 }
      );
    }
    
    // Update the last read chapter
    updateLastReadChapter(userId, mangaId, chapterNumber);
    
    return NextResponse.json({
      success: true,
      message: 'Last read chapter updated'
    });
  } catch (err: any) {
    console.error('Update bookmark error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 