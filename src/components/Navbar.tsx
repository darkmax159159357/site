"use client";
import DialogAlert from "./ui/DialogAlert";
import useModal from "@/hooks/useModal";
import { usePathname } from "next/navigation";
import { navlink, navlinkMobile, userMenuLinks } from "./utils/NavLink";
import NavLink from "./navlink/NavLink";
import { IoMenu } from "react-icons/io5";
import { FaDiscord } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileDropdown from "./UserProfileDropdown";
import Image from "next/image";
import { createPortal } from "react-dom";

// Add keyframe animations for the mobile menu
const menuAnimations = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
`;

const Navbar = () => {
  const { handleOpen, open, setOpen } = useModal();
  const [openMenu, setOpenMenu] = useState(false);
  const path = usePathname();
  const { user, userData, logout } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  
  // Handle menu toggling
  const handleOpenMenu = () => setOpenMenu(!openMenu);
  
  // Handle escape key to close menu
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && openMenu) {
        setOpenMenu(false);
      }
    };
    
    // Lock body scroll when menu is open
    if (openMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [openMenu]);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Close menu on route change
  useEffect(() => {
    setOpenMenu(false);
  }, [path]);
  
  // Function to check if URL is external
  const isExternalLink = (url: string) => {
    return url.startsWith('http://') || url.startsWith('https://');
  };
  
  return (
    <>
      {/* Add the animation styles */}
      <style jsx global>{menuAnimations}</style>
      
      <DialogAlert handler={handleOpen} open={open} setOpen={setOpen} />

      {/* Sticky top bar — mirrors mythtoons.org (solid #0f0f0f + purple wash) */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-[#0f0f0f] shadow-sm relative">
        {/* Purple gradient wash from the left */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, rgba(91, 33, 182, 0.08) 30%, rgba(0, 0, 0, 0) 70%)',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        <div className="flex h-16 items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Mobile menu button (left, mobile only) */}
          <button
            ref={menuButtonRef}
            className="inline-flex items-center justify-center h-9 w-9 mr-2 lg:hidden rounded-md hover:bg-white/10 transition-colors text-white"
            onClick={handleOpenMenu}
            aria-label="Toggle menu"
            aria-expanded={openMenu}
            aria-controls="mobile-menu"
            style={{ zIndex: 1000001 }}
          >
            <IoMenu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <a className="mr-2 lg:mr-4 xl:mr-6 flex items-center shrink-0" href="/">
            <Image
              src="/medusa_scans_logo.png"
              alt="MedusaScans Logo"
              width={48}
              height={48}
              className="rounded h-11 w-11 md:h-12 md:w-12 object-contain"
              priority
            />
          </a>

          {/* Desktop nav links (pill style) */}
          <nav className="hidden lg:flex items-center gap-2">
            {navlink.map((item, i) =>
              isExternalLink(item.path) ? (
                <a
                  href={item.path}
                  key={i}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 xl:px-4 py-2 text-sm font-medium transition-colors rounded-xl text-gray-300 hover:text-white hover:bg-gray-600/30"
                >
                  {item.name}
                </a>
              ) : (
                <NavLink href={item.path} key={i}>
                  <span
                    className={`px-3 xl:px-4 py-2 text-sm font-medium transition-colors rounded-xl ${
                      path === item.path
                        ? "text-orange-500"
                        : "text-gray-300 hover:text-white hover:bg-gray-600/30"
                    }`}
                  >
                    {item.name}
                  </span>
                </NavLink>
              )
            )}
          </nav>

          {/* Right cluster: Discord, Search, User */}
          <div className="ml-auto flex items-center gap-3">
            <a
              href="https://discord.gg/2Ssehz7GNa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-9 w-9 rounded-md text-[#5865F2] hover:text-[#7289da] hover:bg-white/10 transition-colors"
              title="Join our Discord"
            >
              <FaDiscord className="w-5 h-5" />
            </a>

            {path === "/search" ? null : (
              <button
                name="button"
                aria-label="search"
                className="inline-flex items-center justify-center h-9 w-9 rounded-md text-white hover:bg-white/10 transition-colors"
                onClick={handleOpen}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </button>
            )}

            {user ? (
              <div className="block">
                <UserProfileDropdown />
              </div>
            ) : (
              <a
                href="/auth"
                className="inline-flex items-center justify-center h-9 w-9 rounded-md text-white hover:bg-white/10 transition-colors"
                title="Sign In"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu with Portal */}
      {typeof window !== 'undefined' && openMenu && createPortal(
        <div 
          className="fixed inset-0 flex flex-col items-end" 
          style={{ zIndex: 1000000 }}
        >
          {/* Backdrop with gradient overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setOpenMenu(false)}
            style={{ 
              zIndex: 1000000,
              background: 'radial-gradient(circle at 70% 50%, rgba(139, 92, 246, 0.12), rgba(0, 0, 0, 0.7) 60%)'
            }}
          />
          
          {/* Menu Panel */}
          <div 
            className="relative h-full w-4/5 max-w-xs bg-gradient-to-b from-[#1a1a1a] to-[#121212] shadow-xl flex flex-col overflow-y-auto transform transition-transform duration-300 ease-out animate-slideInRight"
            style={{ 
              zIndex: 1000001,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), -5px 0 20px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-purple-900/20 to-orange-900/10 py-6 px-4 border-b border-zinc-800/50">
              <div className="h-1 w-16 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full mx-auto mb-4"></div>
            </div>
            
            {/* Menu Items */}
            <div className="flex flex-col py-4">
              {navlinkMobile.map((link, index) => (
                <div
                  key={index}
                  className={`px-6 py-3.5 hover:bg-white/5 transition-all duration-300 cursor-pointer ${
                    path === link.path 
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 border-l-2 border-orange-500" 
                      : "text-white border-l-2 border-transparent"
                  }`}
                  onClick={() => setOpenMenu(false)}
                  style={{
                    animation: `fadeIn 0.5s ease-out ${0.1 + index * 0.1}s both`
                  }}
                >
                  <NavLink href={link.path}>
                    <span className="font-medium">{link.name}</span>
                  </NavLink>
                </div>
              ))}
              
              {/* User Menu Items */}
              {user && (
                <>
                  <div className="border-t border-zinc-800 my-2" />
                  {userMenuLinks.map((link, index) => (
                    <div
                      key={`user-${index}`}
                      className={`px-6 py-3.5 hover:bg-white/5 transition-all duration-300 cursor-pointer ${
                        path === link.path 
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 border-l-2 border-orange-500" 
                          : "text-white border-l-2 border-transparent"
                      }`}
                      onClick={() => setOpenMenu(false)}
                      style={{
                        animation: `fadeIn 0.5s ease-out ${0.5 + index * 0.1}s both`
                      }}
                    >
                      <NavLink href={link.path}>
                        <span className="font-medium">{link.name}</span>
                      </NavLink>
                    </div>
                  ))}
                  <div 
                    className="px-6 py-3.5 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-pink-500/10 transition-all duration-300 cursor-pointer text-white border-t border-zinc-800/50 mt-3 group"
                    onClick={() => {
                      logout();
                      setOpenMenu(false);
                    }}
                    style={{
                      animation: `fadeIn 0.5s ease-out 0.8s both`
                    }}
                  >
                    <span className="font-medium group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-red-400 group-hover:to-pink-500">Logout</span>
                  </div>
                </>
              )}
              
              {/* Sign In Button for Non-Users */}
              {!user && (
                <div className="px-6 mt-6" style={{ animation: `fadeIn 0.5s ease-out 0.7s both` }}>
                  <div
                    className="py-3 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white text-center rounded-lg cursor-pointer transition-all duration-300 font-semibold shadow-lg transform hover:scale-[1.02]"
                    onClick={() => setOpenMenu(false)}
                  >
                    <NavLink href="/auth">
                      Sign In
                    </NavLink>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Navbar;