import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getUserBookmarks, verifyToken } from "@/lib/db";

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
    
    // Get the user's bookmarks
    const bookmarks = getUserBookmarks(userId);
    
    return NextResponse.json({
      success: true,
      bookmarks
    });
  } catch (err: any) {
    console.error('Bookmarks list error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 
