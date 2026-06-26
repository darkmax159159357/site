"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ReaderInterfaceProps {
  children?: React.ReactNode;
  title?: string;
  chapterTitle: string;
  currentProgress: number;
  onPrevious?: () => void;
  onNext?: () => void;
  prevChapter?: string | null;
  nextChapter?: string | null;
  discordLink?: string;
  kofiLink?: string;
  chapterId: string;
  mangaId: string;
  chapters?: Array<{id: string, number: number, title?: string}>;
  onChapterChange?: (chapterId: string) => void;
  isExpanded?: boolean;
  onExpandClick?: () => void;
  onSaveClick?: () => void;
}

const ReaderInterface: React.FC<ReaderInterfaceProps> = ({
  children,
  title,
  chapterTitle,
  currentProgress,
  onPrevious,
  onNext,
  prevChapter,
  nextChapter,
  discordLink = "https://discord.gg/3vx2C5jFd6",
  kofiLink = "https://ko-fi.com/medusascans",
  chapterId = "",
  mangaId = "",
  chapters = [],
  onChapterChange,
  isExpanded = false,
  onExpandClick,
  onSaveClick
}) => {
  const router = useRouter();
  const readerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const hasLoggedInfo = useRef<boolean>(false);
  
  // Compute if we have next/previous chapters
  const hasNext = Boolean(nextChapter);
  const hasPrevious = Boolean(prevChapter);
  
  // Sort chapters by number (descending) and force re-render when chapterId changes
  const [sortedChapters, setSortedChapters] = useState<Array<{id: string, number: number, title?: string}>>([]);
  
  useEffect(() => {
    if (chapters && chapters.length > 0) {
      const sorted = [...chapters].sort((a, b) => b.number - a.number);
      setSortedChapters(sorted);
    }
  }, [chapters, chapterId]);
  
  // Debug information
  useEffect(() => {
    // Only log once on initial render
    if (!hasLoggedInfo.current) {
      console.log("ReaderInterface - chapters available:", chapters.length);
      console.log("ReaderInterface - current chapter ID:", chapterId);
      hasLoggedInfo.current = true;
    }
  }, [chapters, chapterId]);
  
  // Handle chapter change with loading state
  const handleChapterChange = useCallback((newChapterId: string) => {
    if (newChapterId !== chapterId && onChapterChange) {
      console.log("Changing chapter to:", newChapterId);
      setIsLoading(true);
      onChapterChange(newChapterId);
      
      // Force re-render of sorted chapters when chapter ID changes
      if (chapters && chapters.length > 0) {
        const sorted = [...chapters].sort((a, b) => b.number - a.number);
        setSortedChapters(sorted);
      }
    }
  }, [chapterId, onChapterChange, chapters]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowRight" && onNext && hasNext) {
      setIsLoading(true);
      onNext();
    } else if ((e.key === "ArrowLeft" || e.key === "Backspace") && onPrevious && hasPrevious) {
      setIsLoading(true);
      onPrevious();
    } else if (e.key === "e" && onExpandClick) {
      // Toggle expanded view with 'e' key
      onExpandClick();
    } else if (e.key === "s" && onSaveClick) {
      // Save with 's' key
      onSaveClick();
    }
  }, [onNext, onPrevious, hasNext, hasPrevious, onExpandClick, onSaveClick]);
  
  // Apply zoom effect to images
  useEffect(() => {
    if (contentRef.current) {
      const images = contentRef.current.querySelectorAll('img');
      images.forEach(img => {
        img.style.width = `${zoom}%`;
        img.style.margin = '0 auto';
        img.style.display = 'block';
        img.style.transition = 'width 0.3s ease';
      });
    }
    // Reset loading state when children change (new chapter content loaded)
    setIsLoading(false);
  }, [zoom, children]);
  
  // Set up event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // Helper function to format chapter option text
  const formatChapterOption = (chapter: {number: number, title?: string}) => {
    // If title already contains the chapter number (like "Chapter 14"), don't duplicate it
    if (chapter.title && chapter.title.toLowerCase().includes(`chapter ${chapter.number}`)) {
      return chapter.title;
    }
    
    // Otherwise use the standard format
    return `Chapter ${chapter.number}${chapter.title ? ` - ${chapter.title}` : ''}`;
  };
  
  // Get the actual title from mangaId if not provided
  const displayTitle = title || mangaId?.replace(/-/g, ' ') || '';
  
  // Next/Previous handlers
  const handleNext = useCallback(() => {
    if (onNext) {
      setIsLoading(true);
      onNext();
    }
  }, [onNext]);
  
  const handlePrev = useCallback(() => {
    if (onPrevious) {
      setIsLoading(true);
      onPrevious();
    }
  }, [onPrevious]);
  
  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Top navigation bar with breadcrumb */}
      <div className="w-full bg-[#222222] py-2">
        <div className="max-w-screen-xl mx-auto flex items-center justify-center">
          <div className="flex items-center space-x-2 text-sm">
            <button 
              onClick={() => router.push('/')} 
              className="text-gray-400 hover:text-white transition-colors duration-300"
            >
              Home
            </button>
            <span className="text-gray-500">/</span>
            <button 
              onClick={() => router.push(`/manga/${mangaId}`)} 
              className="text-gray-400 hover:text-white transition-colors duration-300"
            >
              {displayTitle}
            </button>
            <span className="text-gray-500">/</span>
            <span className="text-white">{chapterTitle}</span>
          </div>
        </div>
      </div>
      
      {/* Top chapter navigation */}
      <div className="w-full bg-black py-2">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <select 
              className="bg-[#222222] border border-gray-700 rounded px-3 py-2 text-sm"
              value={chapterId}
              onChange={(e) => handleChapterChange(e.target.value)}
              disabled={isLoading}
            >
              {sortedChapters.length > 0 ? (
                sortedChapters.map(chapter => (
                  <option key={chapter.id} value={chapter.id}>
                    {formatChapterOption(chapter)}
                  </option>
                ))
              ) : (
                <option value={chapterId}>{chapterTitle}</option>
              )}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Save progress button */}
            {onSaveClick && (
              <button 
                onClick={onSaveClick}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-full text-sm"
                title="Save reading progress (s)"
              >
                Save
              </button>
            )}
            
            {/* Toggle expanded view button */}
            {onExpandClick && (
              <button 
                onClick={onExpandClick}
                className={`${isExpanded ? 'bg-purple-600' : 'bg-gray-700'} hover:bg-purple-700 text-white px-4 py-1 rounded-full text-sm`}
                title="Toggle expanded view (e)"
              >
                {isExpanded ? 'Narrow' : 'Expand'}
              </button>
            )}
            
            <button 
              onClick={handlePrev}
              disabled={!hasPrevious || isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ‹ Prev
            </button>
            
            <button 
              onClick={handleNext}
              disabled={!hasNext || isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next ›
            </button>
          </div>
        </div>
      </div>
      
      {/* Reader area - only render if children are provided */}
      {children && (
        <div 
          ref={readerRef}
          className="relative w-full reader-area bg-black"
        >
          {/* Content */}
          <div ref={contentRef} className="zoom-transition max-w-full mx-auto bg-black">
            {children}
          </div>
        </div>
      )}
      
      {/* Progress indicator */}
      <div className="fixed top-0 left-0 w-full z-40">
        <div
          className="h-1 bg-purple-500"
          style={{ width: `${currentProgress}%`, transition: 'width 0.3s ease' }}
        />
      </div>
      
      {/* Bottom navigation bar with chapter selector and next/prev buttons */}
      <div className="w-full bg-black py-2">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <select 
              className="bg-[#222222] border border-gray-700 rounded px-3 py-2 text-sm"
              value={chapterId}
              onChange={(e) => handleChapterChange(e.target.value)}
              disabled={isLoading}
            >
              {sortedChapters.length > 0 ? (
                sortedChapters.map(chapter => (
                  <option key={chapter.id} value={chapter.id}>
                    {formatChapterOption(chapter)}
                  </option>
                ))
              ) : (
                <option value={chapterId}>{chapterTitle}</option>
              )}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrev}
              disabled={!hasPrevious || isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ‹ Prev
            </button>
            
            <button 
              onClick={handleNext}
              disabled={!hasNext || isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next ›
            </button>
          </div>
        </div>
      </div>
      
      {/* Back to top button - right side */}
      <div className="fixed right-6 bottom-20 z-40">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
          aria-label="Go to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ReaderInterface; 