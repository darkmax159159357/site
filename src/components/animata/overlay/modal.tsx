"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
 
import { cn } from "@/lib/utils";
 
interface ContactModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  modalSize?: "sm" | "lg";
}

export default function ContactModal({ isOpen, setIsOpen, modalSize = "lg" }: ContactModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center overflow-y-scroll bg-slate-900/50 p-8 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0, rotate: "180deg" }}
            animate={{
              scale: 1,
              rotate: "0deg",
              transition: {
                type: "spring",
                bounce: 0.25,
              },
            }}
            exit={{ scale: 0, rotate: "180deg" }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-full max-w-lg cursor-default overflow-hidden rounded-xl bg-gradient-to-br from-black to-gray-900 p-6 text-white shadow-2xl border border-[#FF7A51]/40",
              {
                "max-w-sm": modalSize === "sm",
              },
            )}
          >
            <div className="flex flex-col gap-3">
              <MessageSquare className="mx-auto text-[#FF7A51]" size={48} />
              <h3
                className={cn("text-center text-3xl font-bold text-[#FF7A51]", {
                  "text-2xl": modalSize === "sm",
                })}
              >
                Contact Me
              </h3>
              <p className="mb-1 text-center">
               You can contact me to purchase this custom-built site with your own customizations.
              </p>
              <p className="mb-3 text-center text-sm italic text-white/80">
                Privacy matters, so I don&apos;t do rent arrangements.
              </p>
              <div className="bg-black p-4 rounded-lg text-center mb-2 border border-[#FF7A51]/30">
                <p className="font-mono font-semibold text-lg mb-2">Contact me on this username on Discord:</p>
                <div className="flex items-center justify-center space-x-2">
                  <FaDiscord className="text-[#5865F2] text-xl" />
                  <p className="font-mono font-semibold text-lg">dante_069</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded bg-[#FF7A51] py-2 font-semibold text-white transition-opacity hover:opacity-80"
                >
                  Got it!
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 