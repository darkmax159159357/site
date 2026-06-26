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

      <header className="relative">
        {/* Purple gradient overlay */}
        <div 
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, rgba(91, 33, 182, 0.08) 30%, rgba(0, 0, 0, 0) 70%)',
            zIndex: 0,
          }}
        />
        
        <nav className="w-[95%] sm:w-[90%] m-auto py-2 sm:py-3 flex gap-3 sm:gap-4 items-center justify-between mt-2 sm:mt-4 relative z-10">
          <div className="flex items-center gap-3 sm:gap-10 justify-between">
            <div className="logo">
              <a href="/">
                <Image 
                  src="/medusa_scans_logo.png" 
                  alt="MedusaScans Logo" 
                  width={70} 
                  height={35}
                  className="object-contain h-auto"
                  priority
                />
              </a>
            </div>
            <ul className="md:flex md:gap-8 hidden items-center">
              {navlink.map((item, i) => (
                isExternalLink(item.path) ? (
                  <a 
                    href={item.path} 
                    key={i}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="opacity-90 font-karla dark:text-white transition-colors duration-300 hover:text-orange-400 text-white font-semibold text-sm"
                  >
                    {item.name}
                  </a>
                ) : (
                  <NavLink href={item.path} key={i}>
                    <li
                      className={`opacity-90 font-karla dark:text-white transition-colors duration-300 hover:text-orange-400 ${
                        path === item.path 
                          ? "text-orange-500 border-b-2 border-orange-500 pb-1" 
                          : "text-white"
                      } font-semibold text-sm`}
                    >
                      {item.name}
                    </li>
                  </NavLink>
                )
              ))}
            </ul>
          </div>

          <div className="flex gap-3 sm:gap-5 md:gap-6 items-center">
            {/* Discord Icon */}
            <a
              href="https://discord.gg/2Ssehz7GNa"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform duration-300 hover:scale-110 block text-[#5865F2] hover:text-[#7289da]"
              title="Join our Discord"
            >
              <FaDiscord className="w-5 h-5" />
            </a>
            
            {path === "/search" ? (
              ""
            ) : (
              <button
                name="button"
                aria-label="search"
                className="search transition-transform duration-300 hover:scale-110"
                onClick={handleOpen}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </button>
            )}
            
            {/* User profile dropdown - visible on all screen sizes */}
            {user ? (
              <div className="block">
                <UserProfileDropdown />
              </div>
            ) : (
              <a
                href="/auth"
                className="transition-transform duration-300 hover:scale-110 block"
                title="Sign In"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </a>
            )}
            
            {/* Mobile menu button - visible only on small screens */}
            <div className="block md:hidden relative">
              <button
                ref={menuButtonRef}
                className={`hamburger p-2 rounded-lg hover:cursor-pointer relative transition-all duration-300 ${openMenu ? 'bg-gradient-to-r from-purple-600/20 to-orange-500/20' : 'bg-[#272931]/80 hover:bg-gradient-to-r hover:from-[#272931] hover:to-[#2f2f3d]'}`}
                onClick={handleOpenMenu}
                aria-label="Toggle menu"
                aria-expanded={openMenu}
                aria-controls="mobile-menu"
                style={{ zIndex: 1000001 }}
              >
                <div className="w-6 flex flex-col items-center justify-center gap-1.5">
                  <span className={`block h-0.5 w-6 bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-300 ${openMenu ? 'rotate-45 translate-y-2 w-7' : ''}`}></span>
                  <span className={`block h-0.5 w-6 bg-gradient-to-r from-orange-400 to-pink-500 transition-opacity duration-300 ${openMenu ? 'opacity-0' : 'opacity-100'}`}></span>
                  <span className={`block h-0.5 w-6 bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-300 ${openMenu ? '-rotate-45 -translate-y-2 w-7' : ''}`}></span>
                </div>
              </button>
            </div>
          </div>
        </nav>
        <div className="border-b border-gray-800 w-[95%] sm:w-[90%] mx-auto opacity-30 mt-0.5 relative z-10"></div>
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