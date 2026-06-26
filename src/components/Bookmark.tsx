"use client";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { FiBookmark } from "react-icons/fi";
import { BsBookmarkFill } from "react-icons/bs";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

interface BookmarkProps {
  mangaId: string;
  title: string;
  cover?: string;
}

const Bookmark = ({ mangaId, title, cover }: BookmarkProps) => {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [isMarked, setIsMarked] = useState(false);
  
  useEffect(() => {
    // Check bookmark status when component mounts
    const checkBookmarkStatus = async () => {
      try {
        const status = await isBookmarked(mangaId);
        setIsMarked(status);
      } catch (error) {
        console.error("Error checking bookmark status:", error);
      }
    };
    
    checkBookmarkStatus();
  }, [mangaId, isBookmarked]);

  const handleToggleBookmark = async () => {
    try {
      const success = await toggleBookmark(mangaId, title, cover);
      if (success) {
        setIsMarked(!isMarked);
        toast.success(isMarked ? "Removed from bookmarks" : "Added to bookmarks");
      } else {
        toast.error("Failed to update bookmark");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  };

  return (
    <button
      onClick={handleToggleBookmark}
      className="p-2 rounded-full hover:bg-white/10 transition-colors"
      aria-label={isMarked ? "Remove from bookmarks" : "Add to bookmarks"}
    >
      {isMarked ? (
        <BsBookmarkFill className="w-5 h-5 text-[#8b5cf6]" />
      ) : (
        <FiBookmark className="w-5 h-5" />
      )}
    </button>
  );
};

export default Bookmark;
