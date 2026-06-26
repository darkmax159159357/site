import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'site-719fc',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  privateKey: process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : ''
};

initializeApp({
  credential: cert(serviceAccount as any)
});

const db = getFirestore();

// Function to convert title to slug format
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Generate a random timestamp within the last 6 months
function generateRandomTimestamp(isOlder: boolean = false): Date {
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  
  // For firstViewed, generate a timestamp between 6 months ago and 3 months ago
  // For lastViewed, generate a timestamp between 3 months ago and now
  const start = isOlder ? sixMonthsAgo : new Date(now.getTime() - (3 * 30 * 24 * 60 * 60 * 1000));
  const end = isOlder ? new Date(now.getTime() - (3 * 30 * 24 * 60 * 60 * 1000)) : now;
  
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime);
}

// Clear existing collections
async function clearCollections() {
  console.log("Clearing existing collections...");
  
  // Clear manga_views collection
  const mangaViewsRef = db.collection("manga_views");
  const mangaViewsSnapshot = await mangaViewsRef.get();
  const mangaDeletePromises = mangaViewsSnapshot.docs.map(doc => doc.ref.delete());
  
  // Clear chapter_views collection
  const chapterViewsRef = db.collection("chapter_views");
  const chapterViewsSnapshot = await chapterViewsRef.get();
  const chapterDeletePromises = chapterViewsSnapshot.docs.map(doc => doc.ref.delete());
  
  // Wait for all deletes to complete
  await Promise.all([...mangaDeletePromises, ...chapterDeletePromises]);
  
  console.log(`Cleared ${mangaViewsSnapshot.size} manga views and ${chapterViewsSnapshot.size} chapter views`);
}

// Process and upload data
async function processAndUploadData() {
  console.log("Starting migration process...");
  
  try {
    // Clear existing collections first
    await clearCollections();
    
    // Get list of JSON files
    const jsonDir = path.join(process.cwd(), 'public', 'json needs to push to firebase db');
    const files = fs.readdirSync(jsonDir);
    
    // Process each file
    for (const file of files) {
      if (file.endsWith('.json')) {
        console.log(`Processing ${file}...`);
        
        // Read and parse JSON file
        const filePath = path.join(jsonDir, file);
        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        const title = jsonData.title;
        const mangaId = slugify(title);
        const coverPath = `/Medusa/manga/${mangaId}/cover.jpg`;
        
        // Generate timestamps
        const firstViewedTimestamp = generateRandomTimestamp(true);
        const lastViewedTimestamp = generateRandomTimestamp(false);
        
        // Calculate total views for manga
        let totalMangaViews = 0;
        Object.values(jsonData.views).forEach((views: any) => {
          totalMangaViews += Number(views);
        });
        
        // Create manga_views entry
        await db.collection("manga_views").doc(mangaId).set({
          mangaId,
          title,
          cover: coverPath,
          viewCount: totalMangaViews,
          firstViewed: firstViewedTimestamp,
          lastViewed: lastViewedTimestamp
        });
        
        console.log(`Added manga_views entry for "${title}" with ${totalMangaViews} views`);
        
        // Process each chapter
        for (const [chapterKey, viewCount] of Object.entries(jsonData.views)) {
          const chapterNumber = chapterKey.replace("chapter ", "").trim();
          const chapterTitle = `Chapter ${chapterNumber}`;
          const chapterId = `${mangaId}-ch${chapterNumber}`;
          
          // Create chapter_views entry
          await db.collection("chapter_views").doc(chapterId).set({
            chapterId,
            chapterTitle,
            mangaId,
            mangaTitle: title,
            viewCount: Number(viewCount),
            firstViewed: generateRandomTimestamp(true),
            lastViewed: generateRandomTimestamp(false)
          });
          
          console.log(`Added chapter_views entry for "${title} - ${chapterTitle}" with ${viewCount} views`);
        }
      }
    }
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

// Run the migration
processAndUploadData().then(() => {
  console.log("Script execution complete.");
  process.exit(0);
}).catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
}); 