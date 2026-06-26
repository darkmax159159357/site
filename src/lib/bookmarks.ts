export interface Bookmark {
  id: string;
  userId: string;
  mangaId: string;
  title: string;
  cover?: string;
  lastReadChapter?: string;
  added_at: string;
  updated_at: string;
}

// Get all bookmarks for a user
export async function getBookmarks(userId: string): Promise<Bookmark[]> {
  try {
    const response = await fetch(`/api/bookmarks?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch bookmarks');
    return await response.json();
  } catch (err) {
    console.error('Error reading bookmarks:', err);
    return [];
  }
}

// Check if manga is bookmarked
export async function isBookmarked(userId: string, mangaId: string): Promise<boolean> {
  const bookmarks = await getBookmarks(userId);
  return bookmarks.some(bookmark => bookmark.mangaId === mangaId);
}

// Toggle bookmark
export async function toggleBookmark(userId: string, mangaId: string, title: string, cover?: string): Promise<boolean> {
  try {
    const response = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        mangaId,
        title,
        cover,
        action: 'toggle'
      }),
    });

    if (!response.ok) throw new Error('Failed to toggle bookmark');
    const data = await response.json();
    return data.isBookmarked;
  } catch (err) {
    console.error('Error toggling bookmark:', err);
    return false;
  }
}

// Update last read chapter
export async function updateLastReadChapter(userId: string, mangaId: string, chapterNumber: string): Promise<void> {
  try {
    const response = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        mangaId,
        action: 'updateChapter',
        chapterNumber
      }),
    });

    if (!response.ok) throw new Error('Failed to update last read chapter');
  } catch (err) {
    console.error('Error updating last read chapter:', err);
  }
}

// Get last read chapter
export async function getLastReadChapter(userId: string, mangaId: string): Promise<string | null> {
  const bookmarks = await getBookmarks(userId);
  const bookmark = bookmarks.find(b => b.mangaId === mangaId);
  return bookmark?.lastReadChapter || null;
}

// Get bookmark by manga ID
export async function getBookmark(userId: string, mangaId: string): Promise<Bookmark | null> {
  const bookmarks = await getBookmarks(userId);
  return bookmarks.find(bookmark => bookmark.mangaId === mangaId) || null;
} 