"use client"

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function NotFound() {
  const pathname = usePathname();
  const [pathSegments, setPathSegments] = useState<string[]>([]);
  
  useEffect(() => {
    if (pathname) {
      setPathSegments(pathname.split('/').filter(Boolean));
    }
  }, [pathname]);
  
  // If this is a manga detail page, get the manga ID
  const isMangaDetail = pathSegments.length === 2 && pathSegments[0] === 'manga';
  const mangaId = isMangaDetail ? pathSegments[1] : '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1A1B1E] text-white p-4">
      <div className="bg-[#25262b] rounded-xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
        
        <p className="text-gray-400 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        
        {isMangaDetail && (
          <div className="mt-2 mb-6 p-4 bg-gray-800 rounded-lg text-left">
            <p className="font-semibold text-orange-400">Manga Not Found: {mangaId}</p>
            <p className="text-sm mt-2 text-gray-300">
              The manga ID &ldquo;{mangaId}&rdquo; could not be found in the database.
            </p>
          </div>
        )}
        
        <div className="flex flex-col space-y-3">
          <Link 
            href="/" 
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
          >
            Return Home
          </Link>
          
          <Link 
            href="/latestupdated" 
            className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
          >
            Browse Latest
          </Link>
        </div>
      </div>
    </div>
  );
}
