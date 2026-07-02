"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BreadcumbPath from "@/components/ui/BreadcumbPath";
import LatestUpdateCard from "@/components/LatestUpdateCard";

// Shared list page for /latestupdated, /new and /completed — a centered pill
// breadcrumb + title + a 3-per-row grid of LatestUpdateCard, with pagination.
// Reads the raw catalog (/Medusa/manga/manga.json) directly so `status` (for the
// COMPLETED ribbon + the "completed" filter) and every field are available.

type Mode = "latest" | "new" | "completed";

// Parse a chapter date (ISO or "DD-MM-YYYY HH:MM am/pm") to ms; 0 if invalid.
const parseTs = (s?: string): number => {
  if (!s || typeof s !== "string") return 0;
  if (s.includes(" ") && !s.includes("T")) {
    const [d, t, ap] = s.split(" ");
    const [day, mon, yr] = d.split("-").map((n) => parseInt(n));
    if (day && mon && yr) {
      const [hh, mm] = (t || "").split(":").map((n) => parseInt(n));
      let hour = hh || 0;
      if (ap?.toLowerCase() === "pm" && hour < 12) hour += 12;
      if (ap?.toLowerCase() === "am" && hour === 12) hour = 0;
      const dt = new Date(yr, mon - 1, day, hour, mm || 0);
      if (!isNaN(dt.getTime())) return dt.getTime();
    }
  }
  const p = new Date(s);
  return isNaN(p.getTime()) ? 0 : p.getTime();
};

const chapterTs = (c: any): number =>
  parseTs(c?.added_chap_date || c?.added_date || c?.release_date || c?.date);

const ITEMS_PER_PAGE = 20;

export default function UpdatesGridPage({ title, mode }: { title: string; mode: Mode }) {
  const [all, setAll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Initialise the page from the URL (?page=N).
  useEffect(() => {
    const p = parseInt(new URLSearchParams(window.location.search).get("page") || "1", 10);
    if (!isNaN(p) && p > 0) setPage(p);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/Medusa/manga/manga.json");
        const data: any[] = res.ok ? await res.json() : [];

        const enriched = (data || []).map((m) => {
          const chs: any[] = Array.isArray(m.chapters) ? m.chapters : [];
          let latest = 0;
          let earliest = Number.MAX_SAFE_INTEGER;
          chs.forEach((c) => {
            const ts = chapterTs(c);
            if (ts > latest) latest = ts;
            if (ts && ts < earliest) earliest = ts;
          });
          if (earliest === Number.MAX_SAFE_INTEGER) earliest = 0;
          return { ...m, _latest: latest, _earliest: earliest };
        });

        let list = enriched;
        if (mode === "completed") {
          list = enriched.filter((m) => (m.status || "").toString().toUpperCase().includes("COMPLETE"));
        }

        // latest/completed: newest chapter first. new: newest series (earliest chapter) first.
        list.sort((a, b) => (mode === "new" ? b._earliest - a._earliest : b._latest - a._latest));

        setAll(list);
      } catch (e) {
        console.error("UpdatesGridPage load error:", e);
        setError("Failed to load series.");
      } finally {
        setLoading(false);
      }
    })();
  }, [mode]);

  const totalPages = Math.max(1, Math.ceil(all.length / ITEMS_PER_PAGE));
  const pageItems = useMemo(
    () => all.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [all, page]
  );

  const goToPage = (n: number) => {
    if (n < 1 || n > totalPages) return;
    setPage(n);
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(n));
    window.history.replaceState({}, "", url.toString());
    document.getElementById("updates-grid-top")?.scrollIntoView({ behavior: "smooth" });
  };

  // First, current-1, current, current+1, last (with ellipses).
  const pageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    if (page - 1 > 1) pages.push(page - 1);
    if (page !== 1 && page !== totalPages) pages.push(page);
    if (page + 1 < totalPages) pages.push(page + 1);
    if (page < totalPages - 2) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  return (
    <div className="w-[90%] m-auto mb-32" id="updates-grid-top">
      <BreadcumbPath />
      <div className="mt-5">
        <h1 className="text-white text-2xl sm:text-3xl text-center">{title}</h1>
        <div className="relative mt-4 mb-6">
          <div className="w-full h-px bg-[#FF7F57]/30" />
          <div className="absolute -top-[1px] left-0 w-1/3 h-[2px] bg-gradient-to-r from-[#FF7F57] to-[#FF9F57] rounded-full shadow-[0_0_10px_rgba(255,127,87,0.7)]" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-r-2 border-[#FF7F57] border-b-2 border-transparent" />
            <p className="text-gray-400 mt-4">Loading…</p>
          </motion.div>
        ) : error ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-red-500 py-20">
            {error}
          </motion.div>
        ) : all.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-[#12121a]/80 rounded-2xl border border-[#FF7F57]/10">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-white text-lg font-medium mb-2">Nothing here yet</h3>
            <p className="text-gray-400">Check back later.</p>
          </motion.div>
        ) : (
          <>
            <motion.div
              key={`page-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-3 sm:gap-4"
            >
              {pageItems.map((m) => (
                <LatestUpdateCard
                  key={m.id}
                  id={m.id}
                  title={m.title}
                  cover={m.cover}
                  chapters={m.chapters || []}
                  status={m.status}
                />
              ))}
            </motion.div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="bg-gradient-to-br from-[#12121a]/90 to-[#080810]/90 backdrop-blur-xl rounded-xl border border-[#FF7F57]/10 shadow-lg p-2 inline-flex items-center">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mr-2 ${page === 1 ? "text-gray-600 cursor-not-allowed" : "text-white/80 hover:text-white bg-[#16161f]/80 hover:bg-[#FF7F57]/20 border border-white/5 hover:border-[#FF7F57]/30 transition-all"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                  </button>
                  <div className="flex items-center space-x-2">
                    {pageNumbers().map((n, i) =>
                      n === "..." ? (
                        <span key={`e-${i}`} className="text-gray-500 px-1">…</span>
                      ) : (
                        <button
                          key={`p-${n}`}
                          onClick={() => goToPage(n)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${page === n ? "bg-gradient-to-br from-[#FF7F57] to-[#FF9F57] text-white font-medium shadow-lg shadow-[#FF7F57]/20" : "text-white/80 hover:text-white bg-[#16161f]/80 hover:bg-[#FF7F57]/20 border border-white/5 hover:border-[#FF7F57]/30"}`}
                        >
                          {n}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ml-2 ${page === totalPages ? "text-gray-600 cursor-not-allowed" : "text-white/80 hover:text-white bg-[#16161f]/80 hover:bg-[#FF7F57]/20 border border-white/5 hover:border-[#FF7F57]/30 transition-all"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
