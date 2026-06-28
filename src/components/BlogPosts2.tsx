"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Megaphone, ChevronRight } from "lucide-react";

// "Announcements" — mirrors mythtoons.org's #blog-posts-2: a megaphone-headed
// section ("Announcements" + count + "View all" → /announcements) above a stack
// of post cards (📢 icon, title, 2-line description, date + UTC time). Posts come
// from Firestore `posts` (state == "public"). On the home page it shows the
// "View all" link; the /announcements page reuses it with variant="page".

interface Post {
  id: string;
  displayName: string;
  description: string;
  state: "public" | "private";
  isAnnouncement?: boolean;
  createdAt?: string;
}

type Props = {
  // "home" (default) shows the "View all" link; "page" drops it (you're already
  // on the full list) and never collapses to null.
  variant?: "home" | "page";
};

export default function BlogPosts2({ variant = "home" }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("state", "==", "public"));
        const querySnapshot = await getDocs(q);

        const fetchedPosts: Post[] = [];
        querySnapshot.forEach((docSnap) => {
          fetchedPosts.push({ id: docSnap.id, ...docSnap.data() } as Post);
        });

        // Newest first (createdAt is an ISO string when present).
        fetchedPosts.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });

        setPosts(fetchedPosts);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError(`Error fetching posts: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const toggleExpand = (postId: string) => {
    setExpandedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Format the date from ISO string (e.g. "Jan 10, 2025").
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Format the time from ISO string (e.g. "17:32:51 UTC").
  const formatTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.toUTCString().slice(17, 25)} UTC`;
  };

  // On the home page, hide the whole section when there are no public posts so
  // we never render an empty "Announcements (0)" header.
  if (variant === "home" && !loading && posts.length === 0) return null;

  return (
    <section id="blog-posts-2" className="mt-4">
      <div className="relative w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 pt-6 pb-2">
        {/* Header: megaphone + "Announcements" + count + "View all" */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/15 ring-1 ring-amber-500/20">
              <Megaphone className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-white tracking-tight">Announcements</h2>
            {!loading && (
              <span className="text-xs text-zinc-500 font-medium tabular-nums">({posts.length})</span>
            )}
          </div>
          {variant === "home" && (
            <Link
              href="/announcements"
              className="group flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-amber-400 transition-colors"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-[#1a1a1a]/80 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-zinc-500">No announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="group relative">
                <div className="bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl px-3 py-3 sm:px-6 sm:py-5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center shadow-lg hover:translate-y-[-2px] hover:shadow-xl transition-transform gap-2.5 sm:gap-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-6 flex-1">
                    <div className="flex-shrink-0 w-9 h-9 sm:w-12 sm:h-12 bg-[#4a4a4a]/60 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner">
                      <span className="text-lg sm:text-2xl">📢</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-white font-bold text-sm sm:text-[1.15rem]">{post.displayName}</span>
                      </div>
                      <div
                        className={`text-[#c0c0c0] text-xs sm:text-sm leading-relaxed mb-1.5 sm:mb-2 ${expandedPosts[post.id] ? "" : "line-clamp-2"}`}
                        title={post.description}
                      >
                        {post.description}
                      </div>
                      {post.description && post.description.length > 150 && (
                        <button
                          onClick={() => toggleExpand(post.id)}
                          className="text-amber-400 text-xs font-medium hover:text-amber-300 transition-colors flex items-center gap-1 mb-1.5"
                        >
                          {expandedPosts[post.id] ? "Show Less" : "Read More"}
                          <svg viewBox="0 0 24 24" className={`w-3 h-3 fill-current transition-transform ${expandedPosts[post.id] ? "rotate-180" : ""}`}>
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
        )}
      </div>
    </section>
  );
}
