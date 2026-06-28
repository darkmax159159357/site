"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ContactModal from "./animata/overlay/modal";

// Footer — mirrors mythtoons.org's centered footer: logo + brand name, a short
// description, a row of policy links, a "Made by" badge (opens the contact modal),
// copyright and version. Links point at real pages (/privacy, /terms, /dmca,
// /refund-policy, /help). The site's Discord lives in the navbar + Share banner.

const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Content Takedown Policy", href: "/dmca" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Help & Support", href: "/help" },
];

const Footer: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <footer className="w-full mt-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-14 text-center">
        {/* Logo + brand */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <Image src="/glint_logo.svg" alt="Glint Scans" width={36} height={36} className="rounded" />
          <span className="text-xl font-bold bg-gradient-to-r from-[#FF7F57] to-[#FF9F57] bg-clip-text text-transparent">
            Glint Scans
          </span>
        </div>

        <p className="text-sm text-gray-400 mb-8">
          Explore high-quality series at Glint Scans. From thrill and romance to dark fantasy,
          discover amazing stories with rich art and thrilling plots.
        </p>

        {/* Policy links */}
        <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-gray-400 mb-8">
          {FOOTER_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* "Made by" badge — opens the contact modal */}
        <div className="mb-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-block bg-[#FF7F57] hover:bg-[#ff6a3d] text-white text-sm font-medium rounded-full px-5 py-1.5 transition-colors"
          >
            Made by Dante
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-1">©2026 Glint Scans. All Rights Reserved.</p>
        <p className="text-xs text-gray-500/60">v2.0.0</p>
      </div>

      <ContactModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
    </footer>
  );
};

export default Footer;
