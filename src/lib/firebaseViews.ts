import { 
  doc, 
  setDoc, 
  getDoc, 
  increment, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface MangaView {
  mangaId: string;
  totalViews: number;
  updatedAt: Timestamp | null;
}

export interface ChapterView {
  mangaId: string;
  chapterId: string;
  totalViews: number;
  updatedAt: Timestamp | null;
}

// Track a manga view
export const trackMangaView = async (mangaId: string): Promise<void> => {
  try {
    const viewRef = doc(db, 'manga_views', mangaId);
    
    // Check if view document exists
    const viewDoc = await getDoc(viewRef);
    
    if (viewDoc.exists()) {
      // Increment existing view count
      await setDoc(viewRef, {
        totalViews: increment(1),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } else {
      // Create new view document
      await setDoc(viewRef, {
        mangaId,
        totalViews: 1,
        updatedAt: serverTimestamp()
      });
    }
    
    // Also track user-specific view if authenticated
    const user = auth.currentUser;
    if (user) {
      const userViewRef = doc(db, `users/${user.uid}/viewed_manga`, mangaId);
      await setDoc(userViewRef, {
        mangaId,
        viewedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error tracking manga view:', error);
  }
};

// Track a chapter view
export const trackChapterView = async (mangaId: string, chapterId: string): Promise<void> => {
  try {
    const viewRef = doc(db, 'chapter_views', chapterId);
    
    // Check if view document exists
    const viewDoc = await getDoc(viewRef);
    
    if (viewDoc.exists()) {
      // Increment existing view count
      await setDoc(viewRef, {
        totalViews: increment(1),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } else {
      // Create new view document
      await setDoc(viewRef, {
        mangaId,
        chapterId,
        totalViews: 1,
        updatedAt: serverTimestamp()
      });
    }
    
    // Track manga view as well
    await trackMangaView(mangaId);
    
    // Also track user-specific view if authenticated
    const user = auth.currentUser;
    if (user) {
      const userViewRef = doc(db, `users/${user.uid}/viewed_chapters`, chapterId);
      await setDoc(userViewRef, {
        mangaId,
        chapterId,
        viewedAt: serverTimestamp()
      }, { merge: true });
      
      // Update bookmark last chapter if it exists
      const bookmarkId = `${user.uid}_${mangaId}`;
      const bookmarkRef = doc(db, `users/${user.uid}/bookmarks`, bookmarkId);
      const bookmarkDoc = await getDoc(bookmarkRef);
      
      if (bookmarkDoc.exists()) {
        // Extract chapter number from chapterId (assuming format like "manga-id-ch1")
        const chapterNumMatch = chapterId.match(/-ch(\d+)$/);
        if (chapterNumMatch && chapterNumMatch[1]) {
          const chapterNum = parseInt(chapterNumMatch[1], 10);
          
          await setDoc(bookmarkRef, {
            lastChapter: chapterNum,
            lastRead: new Date().toISOString()
          }, { merge: true });
        }
      }
    }
  } catch (error) {
    console.error('Error tracking chapter view:', error);
  }
};

// Get manga view count
export const getMangaViews = async (mangaId: string): Promise<number> => {
  try {
    const viewRef = doc(db, 'manga_views', mangaId);
    const viewDoc = await getDoc(viewRef);
    
    if (viewDoc.exists()) {
      const data = viewDoc.data() as MangaView;
      return data.totalViews || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting manga views:', error);
    return 0;
  }
};

// Get chapter view count
export const getChapterViews = async (chapterId: string): Promise<number> => {
  try {
    const viewRef = doc(db, 'chapter_views', chapterId);
    const viewDoc = await getDoc(viewRef);
    
    if (viewDoc.exists()) {
      const data = viewDoc.data() as ChapterView;
      return data.totalViews || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting chapter views:', error);
    return 0;
  }
}; 