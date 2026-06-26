import { fetchDetail } from "@/action/fetchKomik";
import NewDetails from "./NewDetails";
import siteMetadata from "@/lib/seo/siteMetadata";
import { detailsDataProps } from "./dataType";
import { Suspense } from "react";
import LoadingIndicator from "@/components/LoadingIndicator";
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Function to check if manga exists directly in the file system
async function checkMangaExistsInFileSystem(id: string) {
  try {
    // Try multiple possible paths
    const mangaPath = path.join(process.cwd(), 'Medusa', 'manga', id);
    const exists = fs.existsSync(mangaPath);
    
    console.log(`Manga directory check - ${mangaPath}: ${exists ? 'Exists' : 'Not found'}`);
    return exists;
  } catch (error) {
    console.error('Error checking manga directory:', error);
    return false;
  }
}

// Function to directly load manga data from filesystem as a fallback
async function loadMangaDataDirectly(id: string) {
  try {
    const jsonPath = path.join(process.cwd(), 'Medusa', 'manga', 'manga.json');
    console.log(`Trying to load manga data directly from: ${jsonPath}`);
    
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      console.log(`Found ${data.length} manga entries`);
      
      const manga = data.find((m: any) => m.id === id);
      if (manga) {
        console.log(`Found manga "${id}" directly from JSON file`);
        return manga;
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading manga data directly:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = params;
  console.log('Generating metadata for manga ID:', id);
  
  // Try API method first
  let getData: detailsDataProps["data"] | null = await fetchDetail(id);
  
  // If API method fails, try direct filesystem method
  if (!getData) {
    console.log('API method failed, trying direct filesystem loading');
    getData = await loadMangaDataDirectly(id);
  }

  if (!getData) return { title: "Manga Not Found | MedusaScans" };

  return {
    title: `${getData.title} | MedusaScans`,
    description: getData.description || "No description available",
    keywords: [getData.title, "manga", "read online", "scanlation", "free manga"],
    openGraph: {
      title: getData.title,
      description: getData.description?.slice(0, 300) || "No description available",
      url: `${siteMetadata.siteUrl}/manga/${id}`,
      images: [
        {
          url: getData.cover || siteMetadata.socialBanner,
          width: 1200,
          height: 630,
          alt: getData.title,
        }
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: getData.title,
      description: getData.description?.slice(0, 300) || "No description available",
      images: [getData.cover || siteMetadata.socialBanner],
    },
  };
}

const Page = async ({ params }: { params: { id: string } }) => {
  try {
    const { id } = params;
    console.log('Debug - Manga ID requested:', id);
    
    // Check if this manga exists in the file system
    const existsInFileSystem = await checkMangaExistsInFileSystem(id);
    console.log('Debug - Manga exists in file system:', existsInFileSystem);
    
    // Try API method first
    let getData: detailsDataProps["data"] | null = await fetchDetail(id);
    
    // If API method fails, try direct filesystem method
    if (!getData) {
      console.log('API method failed, trying direct filesystem loading');
      getData = await loadMangaDataDirectly(id);
    }
    
    console.log('Debug - Manga data found:', !!getData);

    if (!getData) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#1A1B1E] text-white p-4">
          <div className="bg-[#25262b] rounded-xl p-8 max-w-md w-full text-center">
            <h1 className="text-2xl font-bold mb-4">Manga Not Found</h1>
            <p className="text-gray-400 mb-6">
              The manga ID "{id}" could not be found in the database.
            </p>
            <a 
              href="/" 
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
            >
              Return Home
            </a>
          </div>
        </div>
      );
    }

    // DEBUG: Add global function to fix ratings
    if (typeof window !== 'undefined') {
      // @ts-ignore - Add a global function to fix ratings
      window.fixMangaRating = async (mangaId) => {
        try {
          // Import Firebase on demand
          const { doc, getDoc, updateDoc, getFirestore } = await import('firebase/firestore');
          
          const firestore = getFirestore();
          const mangaRatingsRef = doc(firestore, 'manga_ratings', mangaId || params.id);
          const snapshot = await getDoc(mangaRatingsRef);
          
          if (snapshot.exists()) {
            const data = snapshot.data();
            console.log("Current rating data:", data);
            
            if (data.ratingCount) {
              let totalCount = 0;
              let weightedSum = 0;
              
              for (let i = 1; i <= 5; i++) {
                const count = data.ratingCount[i.toString()] || 0;
                weightedSum += i * 2 * count;
                totalCount += count;
                console.log(`Star ${i}: ${count} ratings → ${i * 2 * count} points`);
              }
              
              const properRating = totalCount > 0 ? weightedSum / totalCount : 0;
              console.log(`Total count: ${totalCount}, Weighted sum: ${weightedSum}`);
              console.log(`Calculated rating: ${properRating}`);
              
              // Round to 10 if very close
              const finalRating = properRating > 9.95 ? 10 : properRating;
              
              // Update Firebase
              const updates = {
                averageRating: finalRating,
                sumOfRatings: Math.round(finalRating * data.totalRatings)
              };
              
              console.log("Updating with:", updates);
              await updateDoc(mangaRatingsRef, updates);
              console.log("✅ SUCCESS: Rating updated!");
              
              return { success: true, before: data.averageRating, after: finalRating };
            } else {
              console.error("No rating count data found!");
              return { success: false, error: "No rating count data" };
            }
          } else {
            console.error("Manga ratings document not found!");
            return { success: false, error: "Document not found" };
          }
        } catch (error: any) {
          console.error("Error fixing rating:", error);
          return { success: false, error: error.message || "Unknown error" };
        }
      };
      
      console.log("DEBUG: Added global fixMangaRating function. Call fixMangaRating('manga-id') to fix ratings.");
    }

    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A1B1E]">
          <div className="text-center">
            <LoadingIndicator size="large" color="border-orange-500" />
            <p className="text-white mt-4">Loading manga details...</p>
          </div>
        </div>
      }>
        <NewDetails dataDetails={getData} />
      </Suspense>
    );
  } catch (error) {
    console.error("Error loading manga details:", error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1A1B1E] text-white p-4">
        <div className="bg-[#25262b] rounded-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Something Went Wrong</h1>
          <p className="text-gray-400 mb-6">
            We encountered an error while loading this manga. Please try again later.
          </p>
          <a 
            href="/" 
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }
};

export default Page;
