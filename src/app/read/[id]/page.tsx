import { fetchRead } from "@/action/fetchKomik";
import Chapter from "./Chapter";
import siteMetadata from "@/lib/seo/siteMetadata";
import { Suspense } from "react";
import LoadingIndicator from "@/components/LoadingIndicator";
import Link from "next/link";
import dynamic from "next/dynamic";
import Script from "next/script";
import { generateChapterSchema } from "@/lib/seo/schemaGenerator";

// Dynamically import MangaServiceWorker with no SSR
const MangaServiceWorker = dynamic(() => import('@/components/MangaServiceWorker'), {
  ssr: false
});

export async function generateMetadata({ params }: { params: { id: string } }) {
  const id = params?.id;
  
  try {
    // Fetch manga data for better metadata
    const chapterData = await fetchRead(id);
    
    // Format title properly
    const mangaTitle = chapterData?.title || id.split('-ch')[0].replace(/-/g, ' ');
    const chapterTitle = chapterData?.chapterTitle || `Chapter ${id.split('-ch')[1]}`;
    const fullTitle = `${mangaTitle} - ${chapterTitle} | GlintScans`;
    
    return {
      title: fullTitle,
      description: chapterData?.description || `Read ${mangaTitle} ${chapterTitle} online for free on GlintScans.`,
      keywords: [mangaTitle, chapterTitle, "manga", "read online", "scanlation", "free manga"],
      openGraph: {
        title: fullTitle,
        description: chapterData?.description || `Read ${mangaTitle} ${chapterTitle} online for free on GlintScans.`,
        url: `${siteMetadata.siteUrl}/read/${id}`,
        siteName: siteMetadata.title,
        images: [
          {
            url: chapterData?.cover || `${siteMetadata.siteUrl}/favicon.png`,
            width: 1200,
            height: 630,
            alt: mangaTitle,
          }
        ],
        locale: "en_US",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: fullTitle,
        description: chapterData?.description || `Read ${mangaTitle} ${chapterTitle} online for free on GlintScans.`,
        images: [chapterData?.cover || `${siteMetadata.siteUrl}/favicon.png`],
      },
      icons: [
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          url: "/favicon.png",
        },
      ],
    };
  } catch (error) {
    // Fallback metadata if fetch fails
    const title = id
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char: string) => char.toUpperCase());
      
    return {
      title: `${title} | GlintScans`,
      description: siteMetadata.description,
      icons: [
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          url: "/favicon.png",
        },
      ],
    };
  }
}

const Page = async ({ params }: { params: { id: string } }) => {
  // Authentication check removed - allowing anyone to read chapters without login

  try {
    const getReadChapter = await fetchRead(params?.id);

    // Extract manga ID and chapter number from the URL
    const idParts = params?.id.split('-ch');
    const mangaId = idParts[0];
    const chapterNumber = idParts[1];

    // Add debugging to check if lock information is present
    console.log(`[Page] Chapter data for ${params?.id}:`, {
      isLocked: getReadChapter?.isLocked,
      unlockTime: getReadChapter?.unlockTime,
      hasData: !!getReadChapter
    });

    if (!getReadChapter) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
          <div className="bg-black rounded-xl p-8 max-w-md w-full text-center">
            <h1 className="text-2xl font-bold mb-4">Chapter Not Found</h1>
            <p className="text-gray-400 mb-6">
              The chapter you&apos;re looking for doesn&apos;t exist or may have been removed.
            </p>
            <Link 
              href="/" 
              className="inline-block bg-[#FF7F57] hover:bg-[#E06A47] text-white font-bold py-2 px-6 rounded-full transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      );
    }

    // Generate structured data schema for this chapter
    const chapterSchema = generateChapterSchema({
      mangaTitle: getReadChapter.title,
      mangaId: mangaId,
      chapterTitle: getReadChapter.chapterTitle || `Chapter ${chapterNumber}`,
      chapterId: params.id,
      cover: getReadChapter.cover,
      description: getReadChapter.description
    });

    return (
      <div className="bg-black min-h-screen">
        <Script
          id="chapter-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(chapterSchema) }}
        />
        <MangaServiceWorker />
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#1A1B1E]">
            <div className="text-center">
              <LoadingIndicator size="large" color="border-blue-500" />
              <p className="text-white mt-4">Loading chapter...</p>
            </div>
          </div>
        }>
          <Chapter dataRead={getReadChapter} id={params?.id} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("Error loading chapter:", error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1A1B1E] text-white p-4">
        <div className="bg-[#25262b] rounded-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Something Went Wrong</h1>
          <p className="text-gray-400 mb-6">
            We encountered an error while loading this chapter. Please try again later.
          </p>
          <Link 
            href="/" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }
};

export default Page;
