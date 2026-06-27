import { NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKMARKS_FILE = path.join(DATA_DIR, 'bookmarks.json');

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper function to read bookmarks
function readBookmarks() {
  try {
    if (!fs.existsSync(BOOKMARKS_FILE)) {
      fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(BOOKMARKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading bookmarks file:', err);
    return [];
  }
}

// Helper function to save bookmarks
function saveBookmarks(bookmarks: any[]) {
  try {
    fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
  } catch (err) {
    console.error('Error saving bookmarks:', err);
    throw new Error('Failed to save bookmarks');
  }
}

// GET /api/bookmarks?userId=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const allBookmarks = readBookmarks();
    const userBookmarks = allBookmarks.filter((bookmark: any) => bookmark.userId === userId);
    return NextResponse.json(userBookmarks);
  } catch (error) {
    console.error('Error reading bookmarks:', error);
    return NextResponse.json({ error: 'Failed to read bookmarks' }, { status: 500 });
  }
}

// POST /api/bookmarks
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, mangaId, title, action } = body;

    if (!userId || !mangaId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const allBookmarks = readBookmarks();
    const existingIndex = allBookmarks.findIndex(
      (bookmark: any) => bookmark.userId === userId && bookmark.mangaId === mangaId
    );

    if (action === 'toggle') {
      if (existingIndex !== -1) {
        // Remove bookmark
        allBookmarks.splice(existingIndex, 1);
        saveBookmarks(allBookmarks);
        return NextResponse.json({ isBookmarked: false });
      } else {
        // Add bookmark
        const newBookmark = {
          id: uuidv4(),
          userId,
          mangaId,
          title,
          cover: body.cover,
          added_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        allBookmarks.push(newBookmark);
        saveBookmarks(allBookmarks);
        return NextResponse.json({ isBookmarked: true });
      }
    } else if (action === 'updateChapter') {
      const { chapterNumber } = body;
      if (!chapterNumber) {
        return NextResponse.json({ error: 'Chapter number is required' }, { status: 400 });
      }

      if (existingIndex !== -1) {
        allBookmarks[existingIndex].lastReadChapter = chapterNumber;
        allBookmarks[existingIndex].updated_at = new Date().toISOString();
        saveBookmarks(allBookmarks);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling bookmark request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
