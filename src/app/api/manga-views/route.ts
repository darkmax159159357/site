import { NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import fs from 'fs';
import path from 'path';

// Define the base path to the Medusa folder
const MEDUSA_PATH = path.join(process.cwd(), 'Medusa');
const VIEWS_PATH = path.join(MEDUSA_PATH, 'manga_views');

// Ensure the manga_views directory exists
const ensureViewsDirectory = () => {
  if (!fs.existsSync(VIEWS_PATH)) {
    fs.mkdirSync(VIEWS_PATH, { recursive: true });
  }
};

export async function GET(request: Request) {
  try {
    ensureViewsDirectory();
    
    const url = new URL(request.url);
    const mangaId = url.searchParams.get('mangaId');
    
    if (mangaId) {
      // Get view data for a specific manga
      const filePath = path.join(VIEWS_PATH, `${mangaId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { error: 'No view data found for this manga' },
          { status: 404 }
        );
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const viewData = JSON.parse(content);
      return NextResponse.json(viewData);
    } else {
      // Get all manga view data
      const files = fs.readdirSync(VIEWS_PATH);
      const viewData = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(VIEWS_PATH, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            viewData.push(data);
          } catch (err) {
            console.error(`Error parsing view file ${file}:`, err);
          }
        }
      }
      
      return NextResponse.json(viewData);
    }
  } catch (error) {
    console.error('Error fetching manga views:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    ensureViewsDirectory();
    
    const data = await request.json();
    const { viewType, mangaId, mangaTitle, coverImage, chapterId, chapterTitle } = data;
    
    if (!viewType || !mangaId || !mangaTitle || !coverImage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const filePath = path.join(VIEWS_PATH, `${mangaId}.json`);
    let mangaView;
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      mangaView = JSON.parse(content);
    } else {
      mangaView = {
        mangaId,
        mangaTitle,
        coverImage,
        totalViews: 0,
        detailsPageViews: 0,
        lastViewed: new Date().toISOString(),
        chapters: []
      };
    }
    
    // Update view data based on type
    mangaView.lastViewed = new Date().toISOString();
    mangaView.totalViews = (mangaView.totalViews || 0) + 1;
    
    if (viewType === 'details') {
      mangaView.detailsPageViews = (mangaView.detailsPageViews || 0) + 1;
    } else if (viewType === 'chapter') {
      if (!chapterId || !chapterTitle) {
        return NextResponse.json(
          { error: 'Missing chapter fields' },
          { status: 400 }
        );
      }
      
      // Find existing chapter or add new one
      let chapterFound = false;
      if (!mangaView.chapters) {
        mangaView.chapters = [];
      }
      
      for (const chapter of mangaView.chapters) {
        if (chapter.chapterId === chapterId) {
          chapter.views = (chapter.views || 0) + 1;
          chapter.lastViewed = new Date().toISOString();
          chapterFound = true;
          break;
        }
      }
      
      if (!chapterFound) {
        mangaView.chapters.push({
          chapterId,
          chapterTitle,
          views: 1,
          lastViewed: new Date().toISOString()
        });
      }
    }
    
    // Save to file
    fs.writeFileSync(filePath, JSON.stringify(mangaView, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
