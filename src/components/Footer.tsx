"use client";

import { useState } from "react";
import NavLink from "./navlink/NavLink";
import Image from "next/image";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import ContactModal from "./animata/overlay/modal";

const Footer: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <footer className="w-full mt-12 bg-[#0F1015] border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Logo and disclaimer - left side */}
          <div className="max-w-lg">
            <div className="flex items-center mb-4">
              <Image
                src="/glint_logo.svg"
                alt="Glint Scans Logo"
                width={50}
                height={50}
                className="object-contain"
              />
              <h2 className="font-outfit text-3xl text-[#FF7A51] ml-3">
                Glint Scans
              </h2>
            </div>
            <p className="font-karla text-gray-400 text-xs leading-relaxed">
              All the comics on this website are only previews of the original comics, there may be many language errors, character names, and story lines. For the original version, please buy the comic if it&apos;s available in your city.
            </p>
          </div>

          {/* Links and social - right side */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-16">
            {/* Quick links */}
            <div>
              <h3 className="text-white text-base font-semibold mb-3">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <NavLink 
                    href="/dmca" 
                    className="text-gray-300 hover:text-[#FF7A51] transition-colors duration-300 text-sm flex items-center"
                  >
                    <span className="mr-2">•</span>
                    <span>DMCA</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    href="/" 
                    className="text-gray-300 hover:text-[#FF7A51] transition-colors duration-300 text-sm flex items-center"
                  >
                    <span className="mr-2">•</span>
                    <span>Donate</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    href="https://discord.gg/y8GG4T4eUS" 
                    className="text-gray-300 hover:text-[#FF7A51] transition-colors duration-300 text-sm flex items-center"
                  >
                    <span className="mr-2">•</span>
                    <span>Discord</span>
                  </NavLink>
                </li>
              </ul>
            </div>
            
            {/* Social icons */}
            <div>
              <h3 className="text-white text-base font-semibold mb-3">Connect</h3>
              <div className="flex items-center">
                <NavLink
                  href="https://discord.gg/y8GG4T4eUS"
                  className="bg-[#5865F2] p-1.5 rounded-full hover:opacity-90 transition-opacity"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 -28.5 256 256"
                    className="w-5 h-5"
                  >
                    <path
                      fill="#fff"
                      d="M216.856 16.597A208.502 208.502 0 00164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 00-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0079.735 175.3a136.413 136.413 0 01-21.846-10.632 108.636 108.636 0 005.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 005.355 4.237 136.07 136.07 0 01-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36zM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18z"
                    ></path>
                  </svg>
                </NavLink>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom section with copyright */}
        <div className="border-t border-gray-800 mt-6 pt-4 flex flex-col items-center">
          <p className="text-gray-400 text-sm mb-6">
            @2025 all rights are reserved
          </p>
          <motion.div
            className="inline-block"
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2 } 
            }}
            whileTap={{ scale: 0.95 }}
            animate={{ 
              y: [0, -8, 0],
              transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            onClick={() => setIsModalOpen(true)}
          >
            <div className="px-6 py-2.5 rounded-full bg-black border border-[#FF7A51]/40 text-text-muted hover:text-white cursor-pointer transition-all shadow-[0_0_15px_rgba(255,122,81,0.5)] hover:shadow-[0_0_20px_rgba(255,122,81,0.7)]">
              <span className="text-white text-sm">Made by </span>
              <span className="font-bold text-[#FF7A51] tracking-wide drop-shadow-[0_0_8px_rgba(255,122,81,1)]">Dante</span>
              <span className="ml-1 text-[#FF7A51] animate-pulse">♦</span>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Contact Modal */}
      <ContactModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
    </footer>
  );
};

export default Footer;
