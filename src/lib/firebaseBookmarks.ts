import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';

// Add this at the top level, outside of any functions
console.log("Firebase initialization check:");
console.log("- Firebase auth initialized:", !!auth);
console.log("- Firebase Firestore initialized:", !!db);

// Test firestore connection
async function testFirestoreConnection() {
  try {
    const user = auth.currentUser;
    console.log("Testing Firestore connection with user:", user?.uid);
    
    if (!user) {
      console.warn("Can't test Firestore connection - no authenticated user");
      return false;
    }
    
    // Try to read the user's own document (should be permitted by rules)
    const userRef = doc(db, 'users', user.uid);
    await getDoc(userRef);
    console.log("Firestore connection successful");
    return true;
  } catch (error) {
    console.error("Firestore connection test failed:", error);
    return false;
  }
}

// Execute the test and log the result
testFirestoreConnection()
  .then(isConnected => console.log("Firestore connection status:", isConnected ? "CONNECTED" : "FAILED"))
  .catch(err => console.error("Error testing connection:", err));

export interface Bookmark {
  id: string;
  mangaId: string;
  userId: string;
  title: string;
  cover: string;
  lastChapter?: number;
  lastRead?: string;
  createdAt: string;
}

export interface ReadingHistory {
  id: string;
  mangaId: string;
  userId: string;
  title: string;
  cover: string;
  lastChapter: number;
  percentage?: number;  // How far into the chapter (0-100)
  lastRead: string;
}

// Define a consistent placeholder using our vector SVG design
export const PLACEHOLDER_COVER = '/svg/placeholder-cover.svg';

// Add a bookmark
export const addBookmark = async (
  mangaId: string,
  title: string,
  cover: string,
  lastChapter?: number
): Promise<Bookmark | null> => {
  const user = auth.currentUser;
  
  if (!user) throw new Error('User not authenticated');
  
  try {
    console.log("Adding bookmark for user:", user.uid, "manga:", mangaId);
    
    // First, ensure the user document exists
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log("Creating user document because it doesn't exist");
      // Create user document if it doesn't exist
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        createdAt: new Date().toISOString(),
        role: 'user' // Default role
      }, { merge: true });
    }
    
    const bookmarkId = `${user.uid}_${mangaId}`;
    
    // Create bookmark data without the optional lastChapter field
    const bookmarkData: Omit<Bookmark, 'lastChapter'> = {
      id: bookmarkId,
      userId: user.uid,
      mangaId,
      title,
      cover,
      createdAt: new Date().toISOString(),
      lastRead: new Date().toISOString()
    };
    
    // Only add lastChapter if it's not undefined
    const finalBookmarkData = lastChapter !== undefined 
      ? { ...bookmarkData, lastChapter } 
      : bookmarkData;
    
    console.log("Saving bookmark:", finalBookmarkData);
    
    // Add to bookmarks subcollection under the user document
    await setDoc(doc(db, `users/${user.uid}/bookmarks`, bookmarkId), finalBookmarkData);
    console.log("Bookmark saved successfully");
    
    return finalBookmarkData as Bookmark;
  } catch (error: any) {
    console.error('Error adding bookmark:', error);
    throw new Error(error.message || 'Error adding bookmark');
  }
};

// Remove a bookmark
export const removeBookmark = async (mangaId: string): Promise<boolean> => {
  const user = auth.currentUser;
  
  if (!user) throw new Error('User not authenticated');
  
  try {
    const bookmarkId = `${user.uid}_${mangaId}`;
    await deleteDoc(doc(db, `users/${user.uid}/bookmarks`, bookmarkId));
    return true;
  } catch (error: any) {
    console.error('Error removing bookmark:', error);
    throw new Error(error.message || 'Error removing bookmark');
  }
};

// Check if manga is bookmarked
export const checkBookmark = async (mangaId: string): Promise<boolean> => {
  const user = auth.currentUser;
  
  if (!user) return false;
  
  try {
    const bookmarkId = `${user.uid}_${mangaId}`;
    const bookmarkRef = doc(db, `users/${user.uid}/bookmarks`, bookmarkId);
    const bookmarkDoc = await getDoc(bookmarkRef);
    const exists = bookmarkDoc.exists();
    console.log(`Checking bookmark ${mangaId} for user ${user.uid}: ${exists ? "Found" : "Not found"}`);
    return exists;
  } catch (error) {
    console.error('Error checking bookmark:', error);
    return false;
  }
};

// Get all user bookmarks
export const getUserBookmarks = async (): Promise<Bookmark[]> => {
  const user = auth.currentUser;
  
  if (!user) return [];
  
  try {
    const bookmarksRef = collection(db, `users/${user.uid}/bookmarks`);
    const querySnapshot = await getDocs(bookmarksRef);
    
    const bookmarks: Bookmark[] = [];
    querySnapshot.forEach(doc => {
      bookmarks.push(doc.data() as Bookmark);
    });
    
    // Sort by last read date, newest first
    return bookmarks.sort((a, b) => {
      return new Date(b.lastRead || b.createdAt).getTime() - 
             new Date(a.lastRead || a.createdAt).getTime();
    });
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    return [];
  }
};

// Update bookmark (e.g., after reading a chapter)
export const updateBookmark = async (
  mangaId: string, 
  lastChapter?: number
): Promise<Bookmark | null> => {
  const user = auth.currentUser;
  
  if (!user) throw new Error('User not authenticated');
  
  try {
    const bookmarkId = `${user.uid}_${mangaId}`;
    const bookmarkRef = doc(db, `users/${user.uid}/bookmarks`, bookmarkId);
    
    // Get current bookmark data
    const bookmarkDoc = await getDoc(bookmarkRef);
    
    if (!bookmarkDoc.exists()) {
      throw new Error('Bookmark does not exist');
    }
    
    const currentData = bookmarkDoc.data() as Bookmark;
    
    // Update only the necessary fields
    const updateData = {
      lastRead: new Date().toISOString(),
      ...(lastChapter !== undefined && { lastChapter })
    };
    
    await setDoc(bookmarkRef, updateData, { merge: true });
    
    // Return updated bookmark
    return {
      ...currentData,
      ...updateData
    };
  } catch (error: any) {
    console.error('Error updating bookmark:', error);
    throw new Error(error.message || 'Error updating bookmark');
  }
};

// Reading History Functions

// Add or update reading history
export const updateReadingHistory = async (
  mangaId: string,
  title: string,
  cover: string,
  chapterNumber: number,
  percentage: number = 100
): Promise<ReadingHistory | null> => {
  const user = auth.currentUser;
  
  console.log("updateReadingHistory called with:", { 
    mangaId, 
    title, 
    cover: cover ? (cover.length > 30 ? cover.substring(0, 30) + '...' : cover) : 'undefined', 
    chapterNumber, 
    percentage 
  });
  console.log("Current user:", user?.uid);
  
  if (!user) {
    console.error("ERROR: User not authenticated when trying to update reading history");
    throw new Error('User not authenticated');
  }
  
  try {
    console.log(`Updating reading history for ${title} (Chapter ${chapterNumber})`);
    console.log(`Cover used: ${cover || 'undefined'}`);
    
    // Ensure we have a valid cover - prefer manga path covers
    const finalCover = cover || PLACEHOLDER_COVER;
    
    // Debug the cover path
    console.log("[updateReadingHistory] Cover details:");
    console.log("- Original cover:", cover);
    console.log("- Final cover used:", finalCover);
    console.log("- Is manga path:", finalCover.startsWith('/manga/'));
    console.log("- Is Medusa path:", finalCover.startsWith('/Medusa/'));
    console.log("- Is placeholder:", finalCover.includes('placeholder'));
    
    // First, ensure the user document exists
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    console.log("User document exists:", userDoc.exists());
    
    if (!userDoc.exists()) {
      console.log("Creating user document because it doesn't exist");
      // Create user document if it doesn't exist
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        createdAt: new Date().toISOString(),
        role: 'user' // Default role
      }, { merge: true });
      console.log("User document created successfully");
    }
    
    // Create history entry
    const historyId = `${user.uid}_${mangaId}`;
    
    const historyData: ReadingHistory = {
      id: historyId,
      userId: user.uid,
      mangaId,
      title,
      cover: finalCover,
      lastChapter: chapterNumber,
      percentage,
      lastRead: new Date().toISOString()
    };
    
    console.log("Attempting to save reading history:", historyData);
    
    // Add to history subcollection under the user document
    await setDoc(doc(db, `users/${user.uid}/reading_history`, historyId), historyData);
    console.log("Reading history saved successfully");
    
    // Also update the bookmark's last chapter if it exists
    const bookmarkId = `${user.uid}_${mangaId}`;
    const bookmarkRef = doc(db, `users/${user.uid}/bookmarks`, bookmarkId);
    const bookmarkDoc = await getDoc(bookmarkRef);
    
    console.log("Bookmark exists:", bookmarkDoc.exists());
    
    if (bookmarkDoc.exists()) {
      await setDoc(bookmarkRef, {
        lastChapter: chapterNumber,
        lastRead: new Date().toISOString(),
        cover: finalCover
      }, { merge: true });
      console.log("Bookmark updated with new chapter and cover");
    }
    
    return historyData;
  } catch (error: any) {
    console.error('Error updating reading history:', error);
    console.error('Error details:', error.code, error.message);
    throw new Error(error.message || 'Error updating reading history');
  }
};

// Get all user reading history
export const getUserReadingHistory = async (limit_count: number = 50): Promise<ReadingHistory[]> => {
  const user = auth.currentUser;
  
  if (!user) {
    console.log("No authenticated user found when trying to get reading history");
    return [];
  }
  
  try {
    console.log(`Attempting to fetch reading history for user ${user.uid}, path: users/${user.uid}/reading_history`);
    
    // Check if user is properly authenticated
    if (!user.uid) {
      console.error("User missing UID - authentication may not be fully complete");
      return [];
    }
    
    const historyRef = collection(db, `users/${user.uid}/reading_history`);
    const q = query(historyRef, orderBy('lastRead', 'desc'), limit(limit_count));
    
    // Add a timeout to the Firestore query
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Firestore query timed out'));
      }, 3000); // 3-second timeout
    });
    
    console.log("Executing Firestore query for reading history...");
    
    // Race the query against the timeout
    const querySnapshotPromise = getDocs(q);
    const result = await Promise.race([
      querySnapshotPromise,
      timeoutPromise
    ]);
    
    const querySnapshot = result as Awaited<typeof querySnapshotPromise>;
    
    const historyItems: ReadingHistory[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data) {
        // Validate and fix cover path if needed
        let item = data as ReadingHistory;
        if (!item.cover || item.cover === 'undefined' || item.cover === 'null') {
          item.cover = PLACEHOLDER_COVER;
        }
        historyItems.push(item);
      }
    });
    
    console.log(`Retrieved ${historyItems.length} history items for user ${user.uid}`);
    return historyItems;
  } catch (error: any) {
    // More detailed error logging
    console.error(`Error getting reading history for user ${user.uid}:`, error);
    console.error(`Error code: ${error.code}, message: ${error.message}`);
    
    if (error.code === 'permission-denied') {
      console.error("Permission denied - check Firestore security rules and authentication state");
    }
    
    if (error.message === 'Firestore query timed out') {
      console.error("Firestore query timed out after 3 seconds");
    }
    
    // Return empty array instead of throwing error to prevent infinite loading
    return [];
  }
};

// Delete reading history item
export const deleteReadingHistory = async (mangaId: string): Promise<boolean> => {
  const user = auth.currentUser;
  
  if (!user) throw new Error('User not authenticated');
  
  try {
    const historyId = `${user.uid}_${mangaId}`;
    await deleteDoc(doc(db, `users/${user.uid}/reading_history`, historyId));
    return true;
  } catch (error: any) {
    console.error('Error deleting reading history:', error);
    throw new Error(error.message || 'Error deleting reading history');
  }
};

// Clear all reading history
export const clearReadingHistory = async (): Promise<boolean> => {
  const user = auth.currentUser;
  
  if (!user) throw new Error('User not authenticated');
  
  try {
    const historyRef = collection(db, `users/${user.uid}/reading_history`);
    const querySnapshot = await getDocs(historyRef);
    
    const deletePromises = querySnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
    return true;
  } catch (error: any) {
    console.error('Error clearing reading history:', error);
    throw new Error(error.message || 'Error clearing reading history');
  }
};

// Check if manga is in reading history
export const checkReadingHistory = async (mangaId: string): Promise<ReadingHistory | null> => {
  const user = auth.currentUser;
  
  if (!user) return null;
  
  try {
    const historyId = `${user.uid}_${mangaId}`;
    const historyRef = doc(db, `users/${user.uid}/reading_history`, historyId);
    const historyDoc = await getDoc(historyRef);
    
    if (historyDoc.exists()) {
      return historyDoc.data() as ReadingHistory;
    }
    return null;
  } catch (error) {
    console.error('Error checking reading history:', error);
    return null;
  }
}; 