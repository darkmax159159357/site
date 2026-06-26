import { getApps, initializeApp, cert, App } from 'firebase-admin/app';

// Singleton for Firebase Admin app
let firebaseAdminApp: App;

export function getFirebaseAdminApp(): App {
  if (!firebaseAdminApp) {
    // Check if apps are already initialized
    const apps = getApps();
    
    if (apps.length === 0) {
      try {
        // Initialize with environment variables
        // For local development, these would be in .env.local
        // For production, these would be set in your hosting provider (e.g. Vercel)
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        
        if (!projectId || !clientEmail || !privateKey) {
          throw new Error('Firebase Admin credentials are missing. Check your environment variables.');
        }
        
        firebaseAdminApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        
        console.log('Firebase Admin initialized successfully');
      } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
        throw new Error('Failed to initialize Firebase Admin');
      }
    } else {
      // Use the first app if it exists
      firebaseAdminApp = apps[0];
    }
  }
  
  return firebaseAdminApp;
} 