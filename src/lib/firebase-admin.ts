import * as admin from 'firebase-admin';

// Service account credentials are read from environment variables (never hardcoded).
// Set these in your host (Vercel/VPS) env:
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// FIREBASE_PRIVATE_KEY may contain literal "\n" sequences (as stored in env UIs),
// which we convert back to real newlines.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'site-719fc',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

// Initialize Firebase Admin SDK only when credentials are available.
if (!admin.apps.length) {
  try {
    if (serviceAccount.clientEmail && serviceAccount.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
      console.log('Firebase Admin initialized successfully');
    } else {
      console.warn('Firebase Admin not initialized: missing FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY env vars');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export default admin;

// Lazy getters so importing this module never calls admin.auth()/firestore()
// at module-load time. That call throws during the Vercel build when no
// credentials are present. Call these inside request handlers instead.
export const getAdminAuth = () => admin.auth();
export const getAdminFirestore = () => admin.firestore();
// Back-compat proxies: accessing a property triggers init only at call time.
export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get: (_t, prop) => (admin.auth() as any)[prop],
});
export const adminFirestore = new Proxy({} as admin.firestore.Firestore, {
  get: (_t, prop) => (admin.firestore() as any)[prop],
});

// Function to create a reading history entry server-side
export const createReadingHistoryServerSide = async (
  userId: string,
  mangaId: string,
  title: string,
  cover: string,
  chapterNumber: number,
  percentage: number = 100
): Promise<any> => {
  try {
    // Validate required data
    if (!userId || !mangaId || !title) {
      throw new Error('Missing required fields');
    }
    
    // Create history entry data
    const historyId = `${userId}_${mangaId}`;
    const historyData = {
      id: historyId,
      userId: userId,
      mangaId: mangaId,
      title: title,
      cover: cover || '/placeholder.jpg',
      lastChapter: chapterNumber,
      percentage: percentage,
      lastRead: new Date().toISOString()
    };
    
    // Check if user document exists
    const userRef = adminFirestore.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // Create user document
      await userRef.set({
        uid: userId,
        createdAt: new Date().toISOString(),
        role: 'user'
      }, { merge: true });
    }
    
    // Create or update reading history document
    const historyRef = adminFirestore.collection('users').doc(userId).collection('reading_history').doc(historyId);
    await historyRef.set(historyData, { merge: true });
    
    // Update bookmark if it exists
    const bookmarkRef = adminFirestore.collection('users').doc(userId).collection('bookmarks').doc(historyId);
    const bookmarkDoc = await bookmarkRef.get();
    
    if (bookmarkDoc.exists) {
      await bookmarkRef.set({
        lastChapter: chapterNumber,
        lastRead: new Date().toISOString()
      }, { merge: true });
    }
    
    return historyData;
  } catch (error) {
    console.error('Error creating reading history server-side:', error);
    throw error;
  }
}; 