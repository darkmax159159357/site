'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FaCoins, FaGift, FaArrowRight, FaBolt, FaCrown, FaStar } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

const packages = [
  { coins: 100, price: '$5', icon: FaStar, accent: 'from-amber-400 to-orange-500', tag: '' },
  { coins: 300, price: '$12', icon: FaBolt, accent: 'from-orange-400 to-pink-500', tag: 'Popular' },
  { coins: 800, price: '$25', icon: FaCrown, accent: 'from-pink-500 to-purple-500', tag: 'Best Value' },
];

export default function CoinsPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const balance = userData?.coins ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f14] via-[#14121f] to-[#0f0f14] px-4 py-16">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm text-orange-300">
              <FaCoins /> Coins Store
            </div>
            <h1 className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl">
              Unlock Premium Chapters
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-gray-400">
              Get coins to unlock exclusive chapters instantly. No more waiting for releases.
            </p>
            {user && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-2.5">
                <FaCoins className="text-amber-400" />
                <span className="text-gray-300">Your balance:</span>
                <span className="font-bold text-white">{balance}</span>
              </div>
            )}
          </motion.div>

          {/* Packages */}
          <div className="grid gap-6 sm:grid-cols-3">
            {packages.map((pkg, i) => {
              const Icon = pkg.icon;
              return (
                <motion.div
                  key={pkg.coins}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur transition hover:border-orange-500/40"
                >
                  {pkg.tag && (
                    <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-0.5 text-xs font-semibold text-white">
                      {pkg.tag}
                    </span>
                  )}
                  <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${pkg.accent} text-2xl text-white`}>
                    <Icon />
                  </div>
                  <div className="mb-1 text-3xl font-bold text-white">{pkg.coins} <span className="text-base font-normal text-gray-400">coins</span></div>
                  <div className="mb-5 text-2xl font-extrabold text-orange-400">{pkg.price}</div>
                  <button
                    onClick={() => router.push('/redeem')}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${pkg.accent} px-4 py-3 font-semibold text-white transition hover:opacity-90`}
                  >
                    Get Coins <FaArrowRight className="text-sm" />
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Have a code */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:flex-row"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/15 text-xl text-green-400">
                <FaGift />
              </div>
              <div>
                <div className="font-semibold text-white">Already have a redemption code?</div>
                <div className="text-sm text-gray-400">Redeem it instantly to top up your balance.</div>
              </div>
            </div>
            <button
              onClick={() => router.push('/redeem')}
              className="rounded-xl border border-green-500/40 bg-green-500/10 px-6 py-3 font-semibold text-green-300 transition hover:bg-green-500/20"
            >
              Redeem Code
            </button>
          </motion.div>
        </div>
    </div>
  );
}
