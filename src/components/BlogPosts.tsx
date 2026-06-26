"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MotionDiv } from "@/components/motion/MotionDiv";
import { motion } from "framer-motion";
import Image from "next/image";
import { getSiteConfig, DEFAULT_SITE_CONFIG } from "@/lib/site-config";

interface Post {
  id: string;
  displayName: string;
  description: string;
  state: string;
}

export default function BlogPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  // Hero (promo) image — dashboard-controlled via site_config, with SVG fallback.
  const [heroImage, setHeroImage] = useState(DEFAULT_SITE_CONFIG.images.heroImage);

  useEffect(() => {
    getSiteConfig()
      .then((cfg) => { if (cfg.images?.heroImage) setHeroImage(cfg.images.heroImage); })
      .catch(() => {});
  }, []);

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      
      // Auto collapse on mobile, expanded on desktop
      if (mobile) {
        setExpanded(false);
      } else {
        setExpanded(true);
      }
    };

    // Initial check
    checkIfMobile();

    // Listen for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        delay: i * 0.1 
    }
    })
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const pulseAnimation = {
    pulse: {
      scale: [1, 1.03, 1],
      opacity: [0.9, 1, 0.9],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const bannerAnimation = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: { 
      boxShadow: "0 8px 30px rgba(255, 87, 87, 0.2)",
      y: -2,
      transition: { duration: 0.2 }
    }
  };

  const expandedContent = {
    collapsed: { 
      height: 0,
      opacity: 0,
      transition: { duration: 0.4 }
    },
    expanded: { 
      height: "auto",
      opacity: 1,
      transition: { duration: 0.5, type: "spring", stiffness: 100 }
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center py-6">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin h-8 w-8 border-3 border-[#FF5757] rounded-full border-t-transparent"></div>
          <p className="text-sm text-gray-400">Loading content...</p>
        </div>
      </div>
    );
  }

  // Set heading to "Early Access Content"
  const title = "Early Access Content";
  
  const isDefaultContent = true;

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
      {/* Animated Banner */}
      <motion.div
        className="relative overflow-hidden rounded-2xl cursor-pointer"
        initial="initial"
        animate="animate"
        whileHover="hover"
        variants={bannerAnimation}
        onClick={toggleExpand}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1014] via-[#16171f] to-[#0f1014] opacity-95"></div>
        <div className="absolute inset-0 bg-[url('/Assets/anime-pattern.svg')] opacity-5"></div>
        
        <div className="relative z-10 px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="hidden sm:block w-1 h-10 rounded-full bg-gradient-to-b from-[#FF7F57] to-[#FF5757]"></div>
            <div className="flex flex-col">
              <motion.h3 
                className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF7F57] to-[#FF5757]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {title}
              </motion.h3>
            <motion.p 
                className="text-xs sm:text-sm text-gray-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {isMobile ? (expanded ? 'Click to hide details' : 'Click to see exclusive content') : (expanded ? 'Click to hide details' : 'Click to see exclusive content')}
            </motion.p>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full sm:w-auto flex justify-center"
          >
            <a
              href="/coins"
              onClick={(e) => e.stopPropagation()}
              className="block w-full sm:w-auto"
            >
              <Button className="w-full sm:w-auto bg-gradient-to-r from-[#FF7F57] to-[#FF5757] hover:from-[#FF5757] hover:to-[#FF7F57] text-white font-medium text-sm px-6 py-2.5 rounded-3xl shadow-[0_2px_15px_rgba(255,87,87,0.3)] transition-all duration-300">
                Visit Store
              </Button>
            </a>
          </motion.div>
        </div>
        
        {/* Animated indicator */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF7F57] to-[#FF5757]"
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />
      </motion.div>

      {/* Expanded Content */}
      <motion.div
        className="overflow-hidden"
        variants={expandedContent}
        initial="collapsed"
        animate={expanded ? "expanded" : "collapsed"}
      >
        <div className="mt-4 bg-gradient-to-b from-[#14151a] to-[#0a0b0f] rounded-3xl border border-gray-800/30 overflow-hidden shadow-2xl">
          <motion.div 
            className="relative p-6 sm:p-8"
            variants={staggerContainer}
            initial="hidden"
            animate={expanded ? "visible" : "hidden"}
          >
            {/* Glass card effect */}
            <div className="absolute top-0 right-0 w-full h-full overflow-hidden rounded-3xl">
              <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#FF5757] opacity-5 blur-[80px]"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#FF7F57] opacity-5 blur-[80px]"></div>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Text Content - Left side */}
              <motion.div 
                className="lg:col-span-7 space-y-6"
                custom={0}
                variants={fadeInUp}
              >
                <motion.h2 
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-white"
                  custom={1}
                  variants={fadeInUp}
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7F57] to-[#FF5757]">
                    Unlock Premium Chapters
                  </span>
                  {' '}Exclusively For You
                </motion.h2>
                
                <motion.div 
                  className="space-y-4 text-gray-300"
                  custom={2}
                  variants={fadeInUp}
                >
                  <p className="text-base sm:text-lg">
                    Dive deeper into the stories you love with our premium content. 
                    No more waiting for releases - access hidden chapters instantly.
                  </p>
                  
                  <div className="space-y-3 mt-6">
                    <motion.div 
                      className="flex items-start gap-3 p-4 rounded-2xl bg-gray-800/30 border border-gray-700/30"
                      custom={3}
                      variants={fadeInUp}
                    >
                      <div className="bg-gradient-to-br from-amber-400 to-amber-600 w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Image 
                          src="/Assets/coins_1.svg"
                          alt="Coins" 
                          width={28} 
                          height={28}
                          className="drop-shadow-lg"
                        />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Purchase Coins</h4>
                        <p className="text-sm text-gray-400">Get coins for just $20 and use them to unlock any premium content</p>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-start gap-3 p-4 rounded-2xl bg-gray-800/30 border border-gray-700/30"
                      custom={4}
                      variants={fadeInUp}
                    >
                      <div className="bg-gradient-to-br from-blue-400 to-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Get Your Code</h4>
                        <p className="text-sm text-gray-400">Receive a unique redemption code delivered straight to your inbox</p>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-start gap-3 p-4 rounded-2xl bg-gray-800/30 border border-gray-700/30"
                      custom={5}
                      variants={fadeInUp}
                    >
                      <div className="bg-gradient-to-br from-green-400 to-green-600 w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                      <div>
                        <h4 className="text-white font-medium">Unlock Access</h4>
                        <p className="text-sm text-gray-400">Redeem your code and instantly access exclusive chapters</p>
                    </div>
                    </motion.div>
                </div>
              </motion.div>
                
              <motion.div
                  className="pt-4"
                  custom={6}
                  variants={fadeInUp}
              >
                <a
                  href="/coins"
                    className="inline-block"
                  >
                    <motion.button 
                      className="relative overflow-hidden group bg-gradient-to-r from-[#FF7F57] to-[#FF5757] hover:from-[#FF5757] hover:to-[#FF7F57] text-white font-semibold px-10 py-4 rounded-3xl transition-all duration-300"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      variants={pulseAnimation}
                      animate="pulse"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                    Purchase Coins Now
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                  </motion.button>
                </a>
                </motion.div>
              </motion.div>
              
              {/* Image - Right side */}
              <motion.div 
                className="lg:col-span-5 flex justify-center"
                custom={7}
                variants={fadeInUp}
              >
                <div className="relative">
                  {/* Glow effect behind image */}
                  <div className="absolute inset-0 -z-10 blur-[60px] rounded-full bg-gradient-to-r from-[#FF7F5733] to-[#FF575733] transform scale-90"></div>
                  
            <motion.div
                    className="relative z-10"
                    animate={{ 
                      y: [0, -10, 0], 
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 5,
                      ease: "easeInOut"
                    }}
                  >
                <Image
                  src={heroImage}
                  alt="Medusa"
                      width={400}
                      height={400}
                      className="drop-shadow-[0_10px_25px_rgba(255,87,87,0.3)]"
                  priority
                />
                  </motion.div>
                  
                  {/* Decorative coins */}
                  <motion.div
                    className="absolute top-10 -right-4 sm:top-20 sm:right-0 z-20 w-12 h-12"
                    animate={{ 
                      y: [0, 8, 0], 
                      rotate: [0, 10, 0],
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 4,
                      delay: 0.5,
                      ease: "easeInOut"
                    }}
                  >
                    <Image
                      src="/Assets/coins_2.svg"
                      alt="Coins"
                      width={48}
                      height={48}
                      className="drop-shadow-xl"
                    />
                  </motion.div>
                  
                  <motion.div
                    className="absolute bottom-10 -left-4 sm:bottom-20 sm:left-0 z-20 w-14 h-14"
                    animate={{ 
                      y: [0, -10, 0], 
                      rotate: [0, -15, 0],
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 5,
                      delay: 1,
                      ease: "easeInOut"
                    }}
                  >
                    <Image
                      src="/Assets/coins_3.svg"
                      alt="Coins"
                      width={56}
                      height={56}
                      className="drop-shadow-xl"
                    />
                  </motion.div>
              </div>
            </motion.div>
          </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 