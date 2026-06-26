"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  Timestamp,
  writeBatch
} from "firebase/firestore";

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

export default function MigrateViewsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  // Clear existing collections
  async function clearCollections() {
    addLog("Clearing existing collections...");
    
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
    
    addLog(`Cleared ${mangaViewsSnapshot.size} manga views and ${chapterViewsSnapshot.size} chapter views`);
  }

  // Process JSON data from a string
  async function processJsonData(jsonFiles: { name: string; content: string }[]) {
    try {
      // Clear existing collections first
      await clearCollections();
      
      // Process each file
      for (const { name, content } of jsonFiles) {
        addLog(`Processing ${name}...`);
        
        try {
          // Parse JSON content
          const jsonData = JSON.parse(content);
          
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
          await setDoc(doc(db, "manga_views", mangaId), {
            mangaId,
            title,
            cover: coverPath,
            viewCount: totalMangaViews,
            firstViewed: firstViewedTimestamp,
            lastViewed: lastViewedTimestamp
          });
          
          addLog(`Added manga_views entry for "${title}" with ${totalMangaViews} views`);
          
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
              viewCount: Number(viewCount),
              firstViewed: generateRandomTimestamp(true),
              lastViewed: generateRandomTimestamp(false)
            });
            
            addLog(`Added chapter_views entry for "${title} - ${chapterTitle}" with ${viewCount} views`);
          }
        } catch (err) {
          addLog(`Error processing ${name}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      
      addLog("Migration completed successfully!");
      setIsComplete(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      addLog(`Error during migration: ${errorMessage}`);
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsLoading(true);
    setLogs([]);
    setError(null);
    setIsComplete(false);
    
    const jsonFiles = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.endsWith('.json')) {
        try {
          const content = await file.text();
          jsonFiles.push({ name: file.name, content });
        } catch (err) {
          addLog(`Error reading file ${file.name}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
    
    if (jsonFiles.length > 0) {
      await processJsonData(jsonFiles);
    } else {
      addLog("No valid JSON files found.");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Views Migration Tool</h1>
      <p className="mb-4">This tool will migrate view data from JSON files to Firebase.</p>
      <p className="mb-4 text-red-500 font-bold">WARNING: This will delete all existing data in the manga_views and chapter_views collections!</p>
      
      <div className="mb-6">
        <label className="block mb-2">Select JSON files to import:</label>
        <input
          type="file"
          accept=".json"
          multiple
          onChange={handleFileUpload}
          disabled={isLoading}
          className="border p-2 w-full"
        />
      </div>
      
      {isLoading && (
        <div className="mb-4">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {isComplete && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          Migration completed successfully!
        </div>
      )}
      
      {logs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Migration Logs:</h2>
          <div className="bg-black text-white p-4 rounded h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 