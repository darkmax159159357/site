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
      <section className="mt-8 sm:mt-12">
        {/* "Share our site" banner — mirrors mythtoons: a blurred poster row behind
            a translucent violet banner with Share + Join Discord. */}
        <div className="w-full flex justify-center px-2 sm:px-0">
          <div className="w-full max-w-7xl">
            <div className="relative">
              {/* blurred poster row backdrop */}
              <div className="absolute inset-0 flex gap-4 overflow-hidden pointer-events-none" aria-hidden="true">
                {[
                  "linear-gradient(135deg, rgb(109,40,217) 0%, rgb(76,29,149) 100%)",
                  "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(91,33,182) 100%)",
                  "linear-gradient(135deg, rgb(139,92,246) 0%, rgb(109,40,217) 100%)",
                  "linear-gradient(135deg, rgb(167,139,250) 0%, rgb(124,58,237) 100%)",
                  "linear-gradient(135deg, rgb(109,40,217) 0%, rgb(76,29,149) 100%)",
                  "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(91,33,182) 100%)",
                  "linear-gradient(135deg, rgb(139,92,246) 0%, rgb(109,40,217) 100%)",
                  "linear-gradient(135deg, rgb(167,139,250) 0%, rgb(124,58,237) 100%)",
                ].map((bg, i) => (
                  <div key={i} className="shrink-0 w-[160px]" style={{ filter: "blur(8px)", opacity: 0.3 }}>
                    <div className="aspect-[2/3] rounded-xl" style={{ background: bg }} />
                    <div className="mt-2 h-4 rounded bg-purple-400/30 w-3/4" />
                    <div className="mt-1 h-3 rounded bg-purple-400/20 w-1/2" />
                  </div>
                ))}
              </div>
              {/* banner */}
              <div className="relative z-10 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/5 via-violet-500/10 to-violet-500/5 backdrop-blur-sm p-3 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
                      <FaShareAlt className="h-4 w-4 sm:h-5 sm:w-5 text-violet-400" />
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white">Share our site with your friends!</h3>
                      <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Join our amazing community and discover great content</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 sm:shrink-0">
                    <div className="relative">
                      <button
                        onClick={handleShare}
                        className="group relative overflow-hidden bg-white text-purple-600 hover:bg-white/90 font-bold shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 px-4 sm:px-6 h-9 sm:h-10 text-sm sm:text-base rounded-md flex items-center justify-center"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <FaShareAlt className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:rotate-12" />
                          Share
                        </span>
                      </button>
                      {showShareTooltip && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md animate-fadeIn whitespace-nowrap">
                          Link copied to clipboard!
                        </div>
                      )}
                    </div>
                    <div className="hidden sm:block h-10 w-px bg-white/30" />
                    <a href={siteConfig.social.discord || "https://discord.gg/2Ssehz7GNa"} target="_blank" rel="noopener noreferrer">
                      <button
                        type="button"
                        className="group relative overflow-hidden inline-flex items-center gap-2 sm:gap-2.5 rounded-lg bg-[#5865F2] px-4 sm:px-5 py-2 sm:py-3 text-sm sm:text-base font-bold text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-[#4752C4]"
                      >
                        <FaDiscord className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
                        <span className="relative z-10">Join Discord</span>
                      </button>
                    </a>
                  </div>
                </div>
              </div>
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
