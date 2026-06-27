"use client";
import DialogAlert from "./ui/DialogAlert";
import useModal from "@/hooks/useModal";
import { usePathname } from "next/navigation";
import { navlink, navlinkMobile, userMenuLinks } from "./utils/NavLink";
import NavLink from "./navlink/NavLink";
import { IoMenu } from "react-icons/io5";
import { FaDiscord } from "react-icons/fa";
import { Home as HomeIcon, Library, Gift, Coins, LayoutGrid, CheckCircle2, Bell } from "lucide-react";
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

  // Content-mode segmented toggle (Home / New / Complete) — mirrors mythtoons.
  // Visual for now; wiring it to actually filter the homepage is a follow-up.
  const contentModes = [
    { id: "home", label: "Home", Icon: HomeIcon },
    { id: "new", label: "New", Icon: LayoutGrid },
    { id: "complete", label: "Complete", Icon: CheckCircle2 },
  ] as const;
  const [contentMode, setContentMode] = useState<"home" | "new" | "complete">("home");
  const activeModeIndex = contentModes.findIndex((m) => m.id === contentMode);

  // Lucide icon for each main nav link, keyed by its path.
  const linkIcon = (path: string) => {
    switch (path) {
      case "/genre": return Library;        // Series
      case "/redeem": return Gift;          // Redeem
      case "/coins": return Coins;          // Store / Coin Shop
      default: return HomeIcon;             // Home + fallback
    }
  };

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

      {/* Sticky top bar — matches the updated mythtoons.org header */}
      <header
        className="sticky top-0 z-50 w-full border-b bg-[#0f0f0f]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[#0f0f0f]/90 shadow-sm"
        style={{ borderBottomColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="flex h-16 items-center justify-start max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile menu button (left) */}
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
          <a className="mr-3 lg:mr-6 xl:mr-8 flex items-center justify-center shrink-0" href="/">
            <Image
              src="/medusa_scans_logo.png"
              alt="MedusaScans Logo"
              width={64}
              height={64}
              className="rounded h-12 w-12 md:h-[56px] md:w-[56px] object-contain"
              priority
            />
          </a>

          {/* Desktop nav links (icon + label pills) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navlink.map((item, i) => {
              const Icon = linkIcon(item.path);
              const isCoin = item.path === "/coins";
              const active = path === item.path;
              const cls = isCoin
                ? "group flex items-center gap-1.5 px-3 xl:px-4 py-2 font-medium transition-all duration-200 rounded-lg text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 text-sm font-semibold"
                : `group flex items-center gap-1.5 px-3 xl:px-4 py-2 font-medium transition-all duration-200 rounded-lg text-sm ${
                    active ? "text-white bg-white/[0.08]" : "text-[#9f9fa5] hover:text-white hover:bg-white/[0.05]"
                  }`;
              const iconCls = isCoin
                ? "h-4 w-4 text-amber-500/80"
                : `h-4 w-4 transition-colors duration-200 ${active ? "text-amber-400" : "text-zinc-500 group-hover:text-zinc-300"}`;
              const inner = (
                <>
                  <Icon className={iconCls} aria-hidden="true" />
                  {item.name}
                </>
              );
              return isExternalLink(item.path) ? (
                <a key={i} href={item.path} target="_blank" rel="noopener noreferrer" className={cls}>
                  {inner}
                </a>
              ) : (
                <NavLink href={item.path} key={i}>
                  <span className={cls}>{inner}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
            {/* Content-mode segmented toggle (Home / New / Complete) */}
            <div className="hidden md:block">
              <div className="relative flex items-center rounded-full bg-zinc-900/95 shadow-[0_2px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl overflow-hidden h-9 p-1 min-w-[220px]">
                {/* Sliding amber indicator */}
                <div
                  className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500"
                  style={{
                    width: "calc(33.333% - 6px)",
                    left: `calc(${activeModeIndex * 33.333}% + 3px)`,
                    boxShadow:
                      "rgba(245,158,11,0.31) 0px 0px 20px, rgba(255,255,255,0.25) 0px 1px 0px inset, rgba(0,0,0,0.2) 0px -1px 0px inset",
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 via-transparent to-black/15" />
                </div>
                {contentModes.map((m) => {
                  const isActive = contentMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setContentMode(m.id)}
                      title={`Show ${m.label.toLowerCase()}`}
                      className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 rounded-full transition-all duration-300 py-1.5 px-3 text-xs min-w-[64px] ${
                        isActive ? "text-white font-semibold" : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <m.Icon className={`shrink-0 h-3.5 w-3.5 ${isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""}`} aria-hidden="true" />
                      <span className="font-medium">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discord */}
            <a
              href="https://discord.gg/2Ssehz7GNa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-9 w-9 rounded-md text-[#5865F2] hover:text-[#7289da] hover:bg-white/10 transition-colors"
              title="Join our Discord"
            >
              <FaDiscord className="w-5 h-5" />
            </a>

            {/* Search */}
            {path === "/search" ? null : (
              <button
                name="button"
                aria-label="search"
                className="inline-flex items-center justify-center h-9 w-9 rounded-md text-white hover:bg-white/10 transition-colors"
                onClick={handleOpen}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>
            )}

            {/* Notifications bell */}
            <button
              aria-label="Notifications"
              className="inline-flex items-center justify-center h-9 w-9 rounded-md text-white hover:bg-white/10 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {/* User */}
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
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