import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase';
import { doc, collection, setDoc, getDoc } from 'firebase/firestore';
import { ReadingHistory } from '@/lib/firebaseBookmarks';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const user = auth.currentUser;
    
    // Check auth
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to update reading history'
      }, { status: 401 });
    }
    
    // Validate required fields
    const { mangaId, title, cover, chapterNumber, percentage = 100 } = data;
    
    if (!mangaId || !title || !chapterNumber) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'Missing required fields: mangaId, title, chapterNumber'
      }, { status: 400 });
    }
    
    // Create history entry
    const historyId = `${user.uid}_${mangaId}`;
    const coverImage = cover || '/placeholder.jpg';
    
    // Check if user document exists first
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create user document
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        createdAt: new Date().toISOString(),
        role: 'user'
      }, { merge: true });
    }
    
    // Create reading history
    const historyData: ReadingHistory = {
      id: historyId,
      userId: user.uid,
      mangaId,
      title,
      cover: coverImage,
      lastChapter: chapterNumber,
      percentage,
      lastRead: new Date().toISOString()
    };
    
    // Save to Firestore
    const historyRef = doc(db, `users/${user.uid}/reading_history`, historyId);
    await setDoc(historyRef, historyData);
    
    // Update bookmark if it exists
    const bookmarkId = `${user.uid}_${mangaId}`;
    const bookmarkRef = doc(db, `users/${user.uid}/bookmarks`, bookmarkId);
    const bookmarkDoc = await getDoc(bookmarkRef);
    
    if (bookmarkDoc.exists()) {
      await setDoc(bookmarkRef, {
        lastChapter: chapterNumber,
        lastRead: new Date().toISOString()
      }, { merge: true });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Reading history updated successfully',
      data: historyData
    });
  } catch (error: any) {
    console.error('Error updating reading history via API:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update reading history',
      details: error.stack
    }, { status: 500 });
  }
} 