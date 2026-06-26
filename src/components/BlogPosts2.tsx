"use client";

import { useState, useEffect, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Post {
  id: string;
  displayName: string;
  description: string;
  state: 'public' | 'private';
  isAnnouncement?: boolean;
  createdAt?: string;
}

export default function BlogPosts2() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching posts...");
        
        const postsRef = collection(db, "posts");
        // Only show posts that are public
        const q = query(
          postsRef, 
          where("state", "==", "public")
        );
        
        console.log("Query created, executing...");
        const querySnapshot = await getDocs(q);
        console.log(`Got ${querySnapshot.size} posts from Firebase`);
        
        const fetchedPosts: Post[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`Processing post: ${doc.id}`, data);
          console.log(`Is announcement: ${data.isAnnouncement}`);
          
          fetchedPosts.push({
            id: doc.id,
            ...data,
          } as Post);
        });
        
        console.log("Fetched posts:", fetchedPosts);
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setError(`Error fetching posts: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Toggle expanded state for a post
  const toggleExpand = (postId: string) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center py-6">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin h-8 w-8 border-3 border-[#FF5757] rounded-full border-t-transparent"></div>
          <p className="text-sm text-gray-400">Loading announcements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex justify-center py-6">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  // Show posts from database only
  const displayPosts = posts;

  // Format the date from ISO string
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format the time from ISO string
  const formatTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.toTimeString().slice(0, 8)} UTC`;
  };

  return (
    <div className="w-full flex justify-center px-2 sm:px-0">
      <div className="relative z-10 w-full max-w-7xl">
        <div className="space-y-6">
          {displayPosts.map((post, index) => (
            <div key={post.id}>
              <div className="bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl px-4 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center shadow-lg hover:translate-y-[-2px] hover:shadow-xl transition-transform gap-4 sm:gap-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 flex-1">
                  <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 ${post.isAnnouncement ? 'bg-[#ff7e33]/20' : 'bg-[#2a2a2a]/70'} backdrop-blur-sm rounded-lg flex items-center justify-center shadow-inner`}>
                    {post.isAnnouncement ? (
                      <span className="text-xl sm:text-2xl">📢</span>
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-[#ff7e33]" aria-hidden="true">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-8h3v3h-3zm3 6h-3v-3h3zm-4-4h3v3H8z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-white font-bold text-base sm:text-[1.15rem]">{post.displayName}</span>
                    </div>
                    <div className={`text-[#c0c0c0] text-sm leading-relaxed mb-2 ${expandedPosts[post.id] ? '' : 'line-clamp-3'}`} title={post.description}>
                      {post.description}
                    </div>
                    {post.description && post.description.length > 150 && (
                      <button 
                        onClick={() => toggleExpand(post.id)} 
                        className="text-[#ff7e33] text-xs font-medium hover:text-[#ff9f66] transition-colors flex items-center gap-1 mb-2"
                      >
                        {expandedPosts[post.id] ? 'Show Less' : 'Read More'}
                        <svg viewBox="0 0 24 24" className={`w-3 h-3 fill-current transition-transform ${expandedPosts[post.id] ? 'rotate-180' : ''}`}>
                          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                        </svg>
                      </button>
                    )}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[#888] text-xs">
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67zM12 4v16l-4-2.4V6.4L12 8.8V4z" />
                        </svg>
                        {formatDate(post.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-10.5h-2v-2h2zm0 4h-2v2h2z" />
                        </svg>
                        {formatTime(post.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 