"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

// Centered pill breadcrumb — mirrors mythtoons' sub-page breadcrumb: a rounded
// glass pill (border + subtle gradient + soft shadow) with a home link, a
// chevron, and the current page label.

const HomeGlyph = () => (
  <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
    <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2A1 1 0 0 0 1 11h3v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8h3a1 1 0 0 0 .707-1.707Z" />
  </svg>
);

const Chevron = () => (
  <svg className="block w-3 h-3 text-white/30 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
  </svg>
);

const labelFor = (path: string): string => {
  const seg = path.replace(/^\//, "").split("/")[0] || "";
  return seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : "";
};

const BreadcumbPath = () => {
  const params = useSearchParams();
  const path = usePathname();
  const current = labelFor(path);
  const q = params?.get("q");

  return (
    <div className="w-full bg-transparent py-3">
      <div className="max-w-screen-xl mx-auto flex items-center justify-center px-3">
        <nav aria-label="Breadcrumb" className="flex">
          <ol className="inline-flex items-center space-x-1 md:space-x-3 rounded-full border border-white/10 bg-gradient-to-r from-[#FF7F57]/10 via-amber-500/10 to-orange-500/10 px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_12px_40px_rgba(0,0,0,0.55)]">
            <li className="inline-flex items-center">
              <Link href="/" className="inline-flex items-center text-sm font-medium text-white/70 hover:text-white transition-colors duration-200">
                <HomeGlyph />
                Glint Scans
              </Link>
            </li>
            {current && (
              <li aria-current="page">
                <div className="flex items-center">
                  <Chevron />
                  <span className="ms-1 text-sm font-semibold text-white md:ms-2 max-w-[45vw] truncate">{current}</span>
                </div>
              </li>
            )}
            {q && (
              <li aria-current="page">
                <div className="flex items-center">
                  <Chevron />
                  <span className="ms-1 text-sm font-semibold text-white/80 md:ms-2 max-w-[45vw] truncate">{q}</span>
                </div>
              </li>
            )}
          </ol>
        </nav>
      </div>
    </div>
  );
};

export default BreadcumbPath;
