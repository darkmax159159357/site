import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BOOKMARKS_FILE = path.join(process.cwd(), 'data', 'bookmarks.json');

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    // Check if file exists
    if (!fs.existsSync(BOOKMARKS_FILE)) {
      return NextResponse.json([], { status: 200 });
    }
    
    // Read bookmarks file
    const data = fs.readFileSync(BOOKMARKS_FILE, 'utf8');
    const bookmarks = JSON.parse(data);
    
    if (userId) {
      // Filter bookmarks by userId
      const userBookmarks = bookmarks.filter((bookmark: any) => bookmark.userId === userId);
      return NextResponse.json(userBookmarks);
    } else {
      // Return all bookmarks
      return NextResponse.json(bookmarks);
    }
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 