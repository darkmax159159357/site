"use client";

import Link from "next/link";

interface MangaNotFoundProps {
  id?: string;
}

export default function MangaNotFound({ id }: MangaNotFoundProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1A1B1E] text-white p-4">
      <div className="bg-[#25262b] rounded-xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Manga Not Found</h1>
        <p className="text-gray-400 mb-6">
          {id 
            ? `The manga ID "${id}" could not be found in the database.`
            : "The requested manga could not be found in the database."
          }
        </p>
        <Link 
          href="/" 
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
} 