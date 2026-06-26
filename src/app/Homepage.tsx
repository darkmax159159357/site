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
          title: 'Medusa Scans',
          text: 'Check out Medusa Scans for the best manga reading experience!',
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
    hero: (
      <section id="hero-slider" className="mt-6 sm:mt-10">
        <HeroSlider />
        <BeforeContent1 />
      </section>
    ),
    premium: (
      <section id="blog-posts" className="mt-4">
        <BlogPosts />
        <div className="mt-4"><BlogPosts2 /></div>
      </section>
    ),
    socials: siteSettings.homesocialbuttons ? (
      <section className="mt-6 sm:mt-8 space-y-4 px-2 sm:px-0">
        <div className="animate-fadeIn bg-[#0f1014] rounded-xl shadow-lg border border-gray-800/30 overflow-hidden transition-all duration-300 hover:border-[#FF7F57] hover:shadow-[0_0_15px_rgba(255,127,87,0.3)] group">
          <div className="flex flex-row items-center justify-between p-4">
            <div className="flex items-center">
              <div className="w-1.5 h-16 bg-gradient-to-b from-[#FF7F57] to-[#FF5757] rounded-full mr-4 shadow-[0_0_15px_rgba(255,127,87,0.5)] transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(255,127,87,0.7)]"></div>
              <div>
                <h3 className="text-white font-semibold text-lg">Share Medusa Scans</h3>
                <p className="text-gray-400 text-sm">to your friends</p>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={handleShare}
                className="hover:scale-105 active:scale-95 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-lg"
              >
                <FaShareAlt className="w-4 h-4" />
                <span className="font-medium">Share</span>
              </button>
              {showShareTooltip && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md animate-fadeIn whitespace-nowrap">
                  Link copied to clipboard!
                </div>
              )}
            </div>
          </div>
        </div>
        {siteConfig.social.discord && (
          <div className="animate-fadeInDelayed bg-[#0f1014] rounded-xl shadow-lg border border-gray-800/30 overflow-hidden transition-all duration-300 hover:border-[#5865F2] hover:shadow-[0_0_15px_rgba(88,101,242,0.3)] group">
            <div className="flex flex-row items-center justify-between p-4">
              <div className="flex items-center">
                <div className="w-1.5 h-16 bg-gradient-to-b from-[#5865F2] to-[#4752C4] rounded-full mr-4 shadow-[0_0_15px_rgba(88,101,242,0.5)] transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(88,101,242,0.7)]"></div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Join Our Socials</h3>
                  <p className="text-gray-400 text-sm">be part of our community</p>
                </div>
              </div>
              <a href={siteConfig.social.discord} target="_blank" rel="noopener noreferrer" className="hover:scale-105 active:scale-95 px-6 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-lg">
                <FaDiscord className="w-4 h-4" />
                <span className="font-medium">Discord</span>
              </a>
            </div>
          </div>
        )}
        {siteConfig.social.kofi && (
          <div className="animate-fadeInDelayed bg-[#0f1014] rounded-xl shadow-lg border border-gray-800/30 overflow-hidden transition-all duration-300 hover:border-[#FF5E5B] hover:shadow-[0_0_15px_rgba(255,94,91,0.3)] group">
            <div className="flex flex-row items-center justify-between p-4">
              <div className="flex items-center">
                <div className="w-1.5 h-16 bg-gradient-to-b from-[#FF5E5B] to-[#FF7C79] rounded-full mr-4 shadow-[0_0_15px_rgba(255,94,91,0.5)] transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(255,94,91,0.7)]"></div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Support Us</h3>
                  <p className="text-gray-400 text-sm">help us keep the site running</p>
                </div>
              </div>
              <a href={siteConfig.social.kofi} target="_blank" rel="noopener noreferrer" className="hover:scale-105 active:scale-95 px-6 py-2.5 bg-[#FF5E5B] hover:bg-[#FF7C79] text-white rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-lg">
                <SiKofi className="w-4 h-4" />
                <span className="font-medium">Ko-fi</span>
              </a>
            </div>
          </div>
        )}
      </section>
    ) : null,
    popular: (
      <section id="trending" className="mt-8 sm:mt-12">
        <TrendingSection />
      </section>
    ),
    latest: (
      <section id="latest-comics" className="sm:mt-10 mt-6">
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
        {/* Render homepage panels in the dashboard-configured order */}
        {siteConfig.sectionOrder.map((sid) => (
          <React.Fragment key={sid}>{sectionMap[sid] ?? null}</React.Fragment>
        ))}
      </ResponsiveLayout>
    </>
  );
};

export default Homepage;
