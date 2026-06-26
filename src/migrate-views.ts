"use client";

import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs,
  Timestamp,
  writeBatch
} from "firebase/firestore";
import fs from 'fs';
import path from 'path';

// Function to convert title to slug format
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Generate a random timestamp within the last 6 months
function generateRandomTimestamp(isOlder: boolean = false): Timestamp {
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  
  // For firstViewed, generate a timestamp between 6 months ago and 3 months ago
  // For lastViewed, generate a timestamp between 3 months ago and now
  const start = isOlder ? sixMonthsAgo : new Date(now.getTime() - (3 * 30 * 24 * 60 * 60 * 1000));
  const end = isOlder ? new Date(now.getTime() - (3 * 30 * 24 * 60 * 60 * 1000)) : now;
  
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return Timestamp.fromDate(new Date(randomTime));
}

// Clear existing collections
async function clearCollections() {
  console.log("Clearing existing collections...");
  
  // Clear manga_views collection
  const mangaViewsRef = collection(db, "manga_views");
  const mangaViewsSnapshot = await getDocs(mangaViewsRef);
  const mangaBatch = writeBatch(db);
  
  mangaViewsSnapshot.forEach((document) => {
    mangaBatch.delete(doc(db, "manga_views", document.id));
  });
  
  // Clear chapter_views collection
  const chapterViewsRef = collection(db, "chapter_views");
  const chapterViewsSnapshot = await getDocs(chapterViewsRef);
  const chapterBatch = writeBatch(db);
  
  chapterViewsSnapshot.forEach((document) => {
    chapterBatch.delete(doc(db, "chapter_views", document.id));
  });
  
  // Commit the batches
  if (mangaViewsSnapshot.size > 0) await mangaBatch.commit();
  if (chapterViewsSnapshot.size > 0) await chapterBatch.commit();
  
  console.log("Collections cleared successfully!");
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
          totalMangaViews += views as number;
        });
        
        // Create manga_views entry
        await setDoc(doc(db, "manga_views", mangaId), {
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
          await setDoc(doc(db, "chapter_views", chapterId), {
            chapterId,
            chapterTitle,
            mangaId,
            mangaTitle: title,
            viewCount,
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

export default function MigrateViewsPage() {
  const handleMigration = async () => {
    await processAndUploadData();
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Views Migration Tool</h1>
      <p className="mb-4">This tool will migrate view data from JSON files to Firebase.</p>
      <p className="mb-4 text-red-500 font-bold">WARNING: This will delete all existing data in the manga_views and chapter_views collections!</p>
      <button 
        onClick={handleMigration}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Start Migration
      </button>
    </div>
  );
} 