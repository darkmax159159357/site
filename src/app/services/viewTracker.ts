import fs from 'fs';
import path from 'path';

// Define types for the view tracking
interface ChapterView {
  chapterId: string;
  chapterTitle: string;
  views: number;
  lastViewed: string;
}

interface MangaView {
  mangaId: string;
  mangaTitle: string;
  coverImage: string;
  totalViews: number;
  detailsPageViews: number;
  lastViewed: string;
  chapters: ChapterView[];
}

// Local path to the Medusa folder
const MEDUSA_PATH = path.join(process.cwd(), 'Medusa');
const VIEWS_PATH = path.join(MEDUSA_PATH, 'manga_views');

// Ensure the manga_views directory exists
const ensureViewsDirectory = () => {
  if (!fs.existsSync(VIEWS_PATH)) {
    fs.mkdirSync(VIEWS_PATH, { recursive: true });
  }
};

// Function to get all manga view stats
export const getAllMangaViews = async (): Promise<MangaView[]> => {
  try {
    ensureViewsDirectory();
    
    const files = fs.readdirSync(VIEWS_PATH);
    const views: MangaView[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(VIEWS_PATH, file);
        const content = fs.readFileSync(filePath, 'utf8');
        try {
          const view = JSON.parse(content);
          views.push(view);
        } catch (err) {
          console.error(`Error parsing view file ${file}:`, err);
        }
      }
    }
    
    return views;
  } catch (error) {
    console.error('Error fetching manga views:', error);
    return [];
  }
};

// Function to get specific manga view stats
export const getMangaViewById = async (mangaId: string): Promise<MangaView | null> => {
  try {
    ensureViewsDirectory();
    
    const filePath = path.join(VIEWS_PATH, `${mangaId}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error fetching manga view ${mangaId}:`, error);
    return null;
  }
};

// Function to track manga detail page view
export const trackMangaDetailsView = async (mangaId: string, mangaTitle: string, coverImage: string): Promise<void> => {
  try {
    ensureViewsDirectory();
    
    const filePath = path.join(VIEWS_PATH, `${mangaId}.json`);
    let mangaView: MangaView;
    
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
    
    // Update view data
    mangaView.lastViewed = new Date().toISOString();
    mangaView.detailsPageViews = (mangaView.detailsPageViews || 0) + 1;
    mangaView.totalViews = (mangaView.totalViews || 0) + 1;
    
    // Save to file
    fs.writeFileSync(filePath, JSON.stringify(mangaView, null, 2));
  } catch (error) {
    console.error(`Error tracking manga details view:`, error);
  }
};

// Function to track manga chapter view
export const trackChapterView = async (
  mangaId: string, 
  mangaTitle: string, 
  coverImage: string,
  chapterId: string, 
  chapterTitle: string
): Promise<void> => {
  try {
    ensureViewsDirectory();
    
    const filePath = path.join(VIEWS_PATH, `${mangaId}.json`);
    let mangaView: MangaView;
    
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
    
    // Update manga view data
    mangaView.lastViewed = new Date().toISOString();
    mangaView.totalViews = (mangaView.totalViews || 0) + 1;
    
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
    
    // Save to file
    fs.writeFileSync(filePath, JSON.stringify(mangaView, null, 2));
  } catch (error) {
    console.error(`Error tracking chapter view:`, error);
  }
};

// Export types for usage elsewhere
export type { MangaView, ChapterView }; 