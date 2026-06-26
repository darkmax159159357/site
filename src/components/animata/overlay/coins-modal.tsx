import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coins } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  coinsAdded: number;
  newBalance: number;
  modalSize?: "sm" | "lg";
}

export default function CoinsModal({ 
  isOpen, 
  onClose, 
  coinsAdded, 
  newBalance, 
  modalSize = "lg" 
}: CoinsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center overflow-y-scroll bg-black/60 p-8 backdrop-blur-md"
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
              "relative w-full max-w-lg cursor-default overflow-hidden rounded-xl bg-slate-900/80 p-6 text-white shadow-2xl border border-indigo-500/30 backdrop-blur-xl backdrop-filter",
              {
                "max-w-sm": modalSize === "sm",
              },
            )}
            style={{
              boxShadow: "0 0 30px rgba(79, 70, 229, 0.2)",
            }}
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full filter blur-3xl"></div>
            </div>
            <div className="flex flex-col gap-4 items-center relative z-10">
              {/* Coin animation */}
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 15 
                }}
                className="relative w-32 h-32 mb-2"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, 0, -10, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    repeatType: "loop" 
                  }}
                  className="relative w-full h-full"
                >
                  <motion.div
                    className="absolute inset-0 z-10"
                    animate={{
                      background: [
                        'radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.8) 0%, rgba(255, 215, 0, 0) 70%)',
                        'radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.2) 0%, rgba(255, 215, 0, 0) 70%)',
                        'radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.8) 0%, rgba(255, 215, 0, 0) 70%)'
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "loop"
                    }}
                  />
                  <Image 
                    src="/Assets/coins_2.png" 
                    alt="Coins" 
                    fill 
                    className="object-contain z-20 relative"
                    style={{ 
                      filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.7))'
                    }}
                  />
                </motion.div>
              </motion.div>

              {/* Coin count animation */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex flex-col items-center"
              >
                <h3 className="text-center text-4xl font-bold text-amber-300"
                   style={{ 
                    textShadow: '0 2px 10px rgba(245, 158, 11, 0.5)'
                  }}
                >
                  +{coinsAdded} Coins!
                </h3>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center text-xl mt-1 text-white font-medium"
                >
                  Total Balance: {newBalance} coins
                </motion.p>
              </motion.div>

              <p className="text-center text-white">
                You can use your coins to unlock premium chapters and exclusive content!
              </p>

              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={onClose}
                  className="w-full rounded bg-slate-800/70 py-2 font-semibold text-white transition-colors border border-indigo-400/30 hover:bg-white/10"
                >
                  Close
                </button>
                <button
                  onClick={onClose}
                  className="w-full rounded bg-amber-700 py-2 font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Continue Reading
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 