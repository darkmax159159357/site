"use client";

import { useEffect, useState } from "react";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { Bookmark } from "@/lib/bookmarks";
import Link from "next/link";
import Image from "next/image";
import { FiBook, FiCalendar } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { BsBookmarkFill } from "react-icons/bs";

const BookmarksPage = () => {
  const { bookmarks, loading } = useBookmarks();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8b5cf6]"></div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Bookmarks</h1>
        
        {bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <BsBookmarkFill className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Bookmarks Yet</h2>
            <p className="text-gray-400 mb-4">Start bookmarking your favorite manga to keep track of them here.</p>
            <Link 
              href="/"
              className="inline-block bg-[#8b5cf6] text-white px-6 py-2 rounded-lg hover:bg-[#7c3aed] transition-colors"
            >
              Browse Manga
            </Link>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            <AnimatePresence>
              {bookmarks.map((bookmark) => (
                <motion.div 
                  key={bookmark.mangaId} 
                  variants={itemVariants}
                  className="bg-white/5 backdrop-blur-md rounded-lg overflow-hidden ring-1 ring-white/10 transition-all duration-300 hover:ring-[#8b5cf6]/50 hover:translate-y-[-3px] shadow-md"
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 8px 20px -5px rgba(139, 92, 246, 0.2)"
                  }}
                >
                  <Link href={`/manga/${bookmark.mangaId}`}>
                    <div className="relative aspect-[3/4] w-full">
                      <Image
                        src={bookmark.cover || '/fallback-image.png'}
                        alt={bookmark.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      />
                      {bookmark.lastReadChapter && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <div className="flex items-center gap-1">
                            <FiBook className="w-3 h-3 text-[#22c55e]" />
                            <span className="text-xs">Ch {bookmark.lastReadChapter}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <Link href={`/manga/${bookmark.mangaId}`}>
                    <h3 className="font-bold text-sm sm:text-base line-clamp-1 mb-1 hover:text-[#8b5cf6] transition-colors">{bookmark.title}</h3>
                  </Link>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] sm:text-xs text-gray-400 flex items-center">
                      <FiCalendar className="mr-1 h-2 w-2 sm:h-3 sm:w-3" />
                      {new Date(bookmark.added_at).toLocaleDateString()}
                    </span>
                    {bookmark.lastReadChapter && (
                      <Link
                        href={`/read/${bookmark.mangaId}-ch${bookmark.lastReadChapter}`}
                        className="text-xs sm:text-sm text-[#22c55e] hover:underline hover:text-[#16a34a] transition-colors"
                      >
                        Continue
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default BookmarksPage; 