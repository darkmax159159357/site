"use client";

import NavLink from "@/components/navlink/NavLink";
import Image from "next/image";
import Carousel from "@/components/swiper/Carousel";
import Navbar from "@/components/Navbar";
import LatestComics from "@/components/LatestComics";
import HeroSlider from "@/components/HeroSlider";
import TrendingSection from "@/components/TrendingSection";
import ResponsiveLayout from "@/components/ResponsiveLayout";
import Trending2 from "@/components/Trending2";
import CompletedCollection from "@/components/CompletedCollection";
import PinnedCollection from "@/components/PinnedCollection";
import SeriesShowcase from "@/components/SeriesShowcase";
import BlogPosts from "@/components/BlogPosts";
import BlogPosts2 from "@/components/BlogPosts2";
import { FaDiscord, FaShareAlt } from "react-icons/fa";
import { SiKofi } from "react-icons/si"; 
import React, { useState, useEffect, Suspense, lazy, memo } from "react";
import { BeforeContent1, BeforeContent2 } from "@/components/ads/AdPositions";
import { getSiteConfig, DEFAULT_SITE_CONFIG, SiteConfig } from "@/lib/site-config";
import { getSiteSettings, DEFAULT_SITE_SETTINGS, SiteSettings } from "@/lib/site-settings";

// Memoize LatestComics component to prevent unnecessary re-renders
const MemoizedLatestComics = memo(function MemoizedLatestComics(props) {
  return <LatestComics {...props} />;
});

// Simple loading fallback
const LatestComicsLoader = () => (
  <div className="w-full animate-pulse">
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="h-8 w-40 bg-[#222224] rounded-xl"></div>
        <div className="h-8 w-20 bg-[#222224] rounded-full"></div>
      </div>
      <div className="relative mb-6">
        <div className="w-full h-px bg-[#222224]/30"></div>
      </div>
    </div>
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-3 sm:gap-4">
      {[...Array(9)].map((_, index) => (
        <div key={index} className="bg-[#222224] rounded-xl h-[120px] xs:h-[130px]">
          <div className="w-full h-full"></div>
        </div>
      ))}
    </div>
  </div>
);

const Homepage = () => {
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadData() {
      try {
        const config = await getSiteConfig();
        setSiteConfig(config);
        
        const settings = await getSiteSettings();
        setSiteSettings(settings);
      } catch (error) {
        console.error("Failed to load site configuration or settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Glint Scans',
          text: 'Check out Glint Scans for the best manga reading experience!',
          url: window.location.href,
        });
      } else {
        // Fallback for browsers that don't support the Web Share API
        navigator.clipboard.writeText(window.location.href);
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Each homepage panel keyed by its SectionId, so we can render them in the
  // dashboard-configured order (siteConfig.sectionOrder).
  const sectionMap: Record<string, React.ReactNode> = {
    // mythtoons uses the series carousel AS the hero (#hero-slider), so "series"
    // is the top spotlight. "hero" keeps the classic banner slider available for
    // anyone who reorders it back in from the dashboard.
    series: (
      // Full-bleed: break out of the max-w-7xl container so the carousel spans
      // the whole viewport width like mythtoons (cards run edge to edge).
      <section
        id="series-showcase"
        className="mt-6 sm:mt-8 relative left-1/2 right-1/2 -mx-[50vw] w-screen max-w-[100vw] px-3 sm:px-4"
      >
        <SeriesShowcase />
      </section>
    ),
    hero: (
      <section id="hero-slider" className="mt-6 sm:mt-10">
        <HeroSlider />
        <BeforeContent1 />
      </section>
    ),
    premium: (
      <section id="blog-posts" className="mt-8 sm:mt-12">
        <BlogPosts />
        <div className="mt-4"><BlogPosts2 /></div>
      </section>
    ),
    socials: siteSettings.homesocialbuttons ? (
      <section className="mt-8 sm:mt-12 px-2 sm:px-0">
        {/* Single unified "Share our site" banner — mirrors mythtoons. */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-[#241640] via-[#3a2272] to-[#241640] p-5 sm:p-6 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-fuchsia-600/10 to-purple-600/10 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="hidden sm:flex w-11 h-11 rounded-xl bg-white/10 items-center justify-center shrink-0">
                <FaShareAlt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg sm:text-xl">Share our site with your friends!</h3>
                <p className="text-purple-200/80 text-sm">Join our amazing community and discover great content</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative">
                <button
                  onClick={handleShare}
                  className="hover:scale-105 active:scale-95 px-5 py-2.5 bg-white text-[#241640] font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow"
                >
                  <FaShareAlt className="w-4 h-4" />
                  <span>Share</span>
                </button>
                {showShareTooltip && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md animate-fadeIn whitespace-nowrap">
                    Link copied to clipboard!
                  </div>
                )}
              </div>
              {siteConfig.social.discord && (
                <a
                  href={siteConfig.social.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:scale-105 active:scale-95 px-5 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow"
                >
                  <FaDiscord className="w-4 h-4" />
                  <span>Join Discord</span>
                </a>
              )}
              {siteConfig.social.kofi && (
                <a
                  href={siteConfig.social.kofi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex hover:scale-105 active:scale-95 px-5 py-2.5 bg-[#FF5E5B] hover:bg-[#FF7C79] text-white font-medium rounded-xl items-center justify-center gap-2 transition-all duration-300 shadow"
                >
                  <SiKofi className="w-4 h-4" />
                  <span>Ko-fi</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    ) : null,
    pinned: (
      <section id="pinned-collection" className="mt-8 sm:mt-12">
        <PinnedCollection />
      </section>
    ),
    popular: (
      <section id="trending" className="mt-8 sm:mt-12">
        <TrendingSection />
      </section>
    ),
    latest: (
      <section id="latest-comics" className="mt-8 sm:mt-12">
        <Suspense fallback={<LatestComicsLoader />}>
          <MemoizedLatestComics showPagination={true} />
        </Suspense>
      </section>
    ),
    completed: (
      <section id="completed" className="mt-8 sm:mt-12">
        <CompletedCollection />
      </section>
    ),
    toprated: (
      <section id="top-charts" className="sm:mt-16 mt-10 mb-36">
        <Trending2 />
        <BeforeContent2 />
      </section>
    ),
  };

  return (
    <>
      {/* Background gradient elements */}
      <div className="homepage-bg"></div>
      <div className="homepage-glow"></div>
      <div className="homepage-accent"></div>

      <ResponsiveLayout>
        {/* Render homepage panels in the dashboard-configured order, skipping
            any section toggled off from the dashboard. */}
        {siteConfig.sectionOrder
          .filter((sid) => !(siteConfig.hiddenSections || []).includes(sid))
          .map((sid) => (
            <React.Fragment key={sid}>{sectionMap[sid] ?? null}</React.Fragment>
          ))}
      </ResponsiveLayout>
    </>
  );
};

export default Homepage;
