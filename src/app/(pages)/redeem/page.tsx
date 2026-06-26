'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FaGift, FaStore, FaInfoCircle, FaExclamationTriangle, FaArrowRight } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import CoinsModal from '@/components/animata/overlay/coins-modal';
import { getSiteConfig, DEFAULT_SITE_CONFIG } from '@/lib/site-config';

const RedeemPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, userData, refreshUserData } = useAuth();
  const router = useRouter();
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [coinsAdded, setCoinsAdded] = useState(0);
  const [newBalance, setNewBalance] = useState(0);

  // Redeem-page art — dashboard-controlled via site_config, with SVG fallback.
  const [redeemImage, setRedeemImage] = useState(DEFAULT_SITE_CONFIG.images.redeemImage);
  useEffect(() => {
    getSiteConfig()
      .then((cfg) => { if (cfg.images?.redeemImage) setRedeemImage(cfg.images.redeemImage); })
      .catch(() => {});
  }, []);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };
  
  const pulseVariants = {
    initial: { scale: 1 },
    pulse: {
      scale: [1, 1.03, 1],
      transition: { 
        duration: 2,
        repeat: Infinity,
        repeatType: "loop" as const
      }
    }
  };

  const floatVariants = {
    initial: { y: 0 },
    float: {
      y: [0, -8, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        repeatType: "loop" as const,
        ease: "easeInOut"
      }
    }
  };
  
  const shineVariants = {
    initial: { backgroundPosition: '0% 50%' },
    shine: {
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      transition: {
        duration: 5,
        repeat: Infinity,
        repeatType: "loop" as const,
        ease: "easeInOut"
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!code) {
      toast.error('Please enter a redemption code');
      return;
    }
    
    if (!user) {
      toast.error('Please sign in to redeem codes');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the redeem-code API with the user's UID
      const response = await fetch('/api/user/redeem-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code,
          uid: user.uid // Pass the Firebase user UID directly
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem code');
      }
      
      // Refresh user data to get updated coin balance
      if (refreshUserData) {
        await refreshUserData();
      }
      
      // Show modal instead of toast
      if (data.coinsAdded) {
        setCoinsAdded(data.coinsAdded);
        setNewBalance(data.newBalance || 0);
        setModalOpen(true);
      } else {
        toast.success(`Code redeemed successfully! Coins have been added to your account.`);
      }
      
      setCode('');
      
      // Don't redirect automatically - let user close modal first
      
    } catch (error: any) {
      toast.error(error.message || 'Invalid or expired redemption code');
      console.error('Error redeeming code:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen py-12 px-4 relative overflow-hidden bg-gradient-to-br from-pink-500/10 via-fuchsia-500/5 to-purple-500/10">
      {/* Background decorative elements - anime style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full filter blur-3xl"></div>
      </div>
      
      <motion.div 
        className="max-w-6xl mx-auto relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Redeem text positioned first but visually under the Medusa image */}
        <motion.div 
          variants={itemVariants}
          className="text-center relative pt-12 mt-8"
        >          
          <motion.h1 
            className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-fuchsia-500 to-purple-500 mb-3 font-anime tracking-wider"
            variants={shineVariants}
            initial="initial"
            animate="shine"
            style={{ 
              backgroundSize: '200% auto',
              textShadow: '0 0 15px rgba(236, 72, 153, 0.5)',
              letterSpacing: '2px'
            }}
          >
            REDEEM CODE
          </motion.h1>
          <motion.p 
            className="text-pink-200 text-xl max-w-xl mx-auto mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.3)' }}
          >
            Enter your special code to unlock premium manga content
          </motion.p>
          
          {/* Medusa image positioned between subtitle and form */}
          <motion.div
            className="relative w-full flex justify-center items-center mb-8 mt-2"
            variants={floatVariants}
            initial="initial"
            animate="float"
          >
            <div className="relative w-[450px] h-[300px]">
              <Image
                src={redeemImage}
                alt="Medusa"
                fill
                className="object-contain"
                style={{ 
                  filter: 'drop-shadow(0 0 30px rgba(236, 72, 153, 0.5))',
                  transform: 'scale(1.3)',
                  objectFit: 'contain',
                  objectPosition: 'center'
                }}
              />
            </div>
          </motion.div>
        </motion.div>
        
        {/* Show login prompt if not signed in */}
        {!user && (
          <motion.div 
            variants={itemVariants} 
            className="mb-12 p-8 bg-gradient-to-r from-pink-900/20 to-fuchsia-900/20 rounded-2xl border border-pink-500/20 text-center backdrop-blur-sm"
          >
            <h2 
              className="text-2xl font-bold text-pink-100 mb-4"
              style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.3)' }}
            >
              Sign in Required
            </h2>
            <p 
              className="text-pink-200/80 mb-6 max-w-lg mx-auto"
            >
              Please sign in to redeem your codes and receive coins to enjoy our premium manga content.
            </p>
            <a
              href="/auth"
              className="group inline-flex items-center gap-2 py-3 px-8 bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white font-medium rounded-full shadow-lg transition-all duration-300"
            >
              Sign In 
              <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </motion.div>
        )}
        
        {/* Redemption Form - Only show if user is signed in */}
        {user && (
          <motion.div 
            variants={itemVariants} 
            className="mb-16"
          >
            <div
              className="bg-gradient-to-r from-fuchsia-900/20 to-pink-900/20 p-10 rounded-3xl backdrop-blur-sm border border-pink-500/20 shadow-xl"
              style={{boxShadow: "0 0 30px rgba(236, 72, 153, 0.15)"}}
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label htmlFor="code" className="block text-pink-200 text-xl font-medium" style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.3)' }}>Enter redemption code</label>
                  <div className="relative">
                    <input
                      type="text"
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Enter your code here"
                      className="w-full p-5 bg-gray-900/30 border-2 border-pink-500/30 rounded-2xl text-white placeholder-pink-200/50 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 text-lg tracking-wider"
                      disabled={isSubmitting}
                      spellCheck={false}
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 px-8 bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white font-bold text-lg rounded-full shadow-lg transition-all duration-300 disabled:opacity-70 flex items-center justify-center overflow-hidden relative"
                  style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.5)' }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      <span>REDEEM CODE</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
        
        {/* Store CTA */}
        <motion.div
          variants={itemVariants}
          className="mb-16 p-8 bg-gradient-to-r from-fuchsia-900/20 to-purple-900/20 rounded-3xl border border-fuchsia-500/20 text-center backdrop-blur-sm relative overflow-hidden"
          whileHover={{ y: -5, boxShadow: "0 0 25px rgba(192, 132, 252, 0.2)" }}
          transition={{ duration: 0.3 }}
        >
          <motion.span 
            className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/5 via-purple-600/5 to-fuchsia-600/5"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            style={{ backgroundSize: '200% 100%' }}
          />
          
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-5">
              <motion.div 
                className="p-4 bg-fuchsia-500/20 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <FaStore className="text-3xl text-fuchsia-300" />
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold text-fuchsia-100 mb-4" style={{ textShadow: '0 0 10px rgba(192, 132, 252, 0.3)' }}>Need a redemption code?</h2>
            <p className="text-fuchsia-200/80 mb-6 max-w-xl mx-auto">Visit our official store to purchase codes and support our work! Enjoy premium content and features with your coins.</p>
            <motion.a
              href="/coins"
              className="group inline-flex items-center gap-2 py-3 px-8 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-medium rounded-full shadow-lg transition-colors duration-300"
              whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(192, 132, 252, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              style={{ textShadow: '0 0 10px rgba(192, 132, 252, 0.5)' }}
            >
              Visit Store
              <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </motion.a>
          </div>
        </motion.div>
        
        {/* Guidelines */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-8">
          {/* Redemption Guide */}
          <motion.div 
            className="bg-gradient-to-br from-pink-500/5 to-pink-900/10 p-8 rounded-3xl border border-pink-500/20 backdrop-blur-sm relative overflow-hidden"
            whileHover={{ y: -8, boxShadow: "0 0 25px rgba(236, 72, 153, 0.15)" }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-fuchsia-500"
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            <div className="flex items-center mb-6">
              <motion.div 
                className="mr-4 p-3 bg-pink-500/20 rounded-xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 1 }}
              >
                <FaInfoCircle className="text-2xl text-pink-300" />
              </motion.div>
              <h3 className="text-2xl font-semibold text-pink-100" style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.3)' }}>Redemption Guide</h3>
            </div>
            <ul className="space-y-4 text-pink-200/90 text-lg">
              <motion.li 
                className="flex items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <span className="mr-3 text-pink-400 text-xl">•</span> 
                <span>Please enter the code without spaces.</span>
              </motion.li>
              <motion.li 
                className="flex items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
              >
                <span className="mr-3 text-pink-400 text-xl">•</span> 
                <span>Each code can only be used once.</span>
              </motion.li>
              <motion.li 
                className="flex items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
              >
                <span className="mr-3 text-pink-400 text-xl">•</span> 
                <span>Redeemed coins will be added to your balance immediately.</span>
              </motion.li>
            </ul>
          </motion.div>
          
          {/* Important Notes */}
          <motion.div 
            className="bg-gradient-to-br from-fuchsia-500/5 to-fuchsia-900/10 p-8 rounded-3xl border border-fuchsia-500/20 backdrop-blur-sm relative overflow-hidden"
            whileHover={{ y: -8, boxShadow: "0 0 25px rgba(192, 132, 252, 0.15)" }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-purple-500"
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
            <div className="flex items-center mb-6">
              <motion.div 
                className="mr-4 p-3 bg-fuchsia-500/20 rounded-xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FaExclamationTriangle className="text-2xl text-fuchsia-300" />
              </motion.div>
              <h3 className="text-2xl font-semibold text-fuchsia-100" style={{ textShadow: '0 0 10px rgba(192, 132, 252, 0.3)' }}>Important Notes</h3>
            </div>
            <ul className="space-y-4 text-fuchsia-200/90 text-lg">
              <motion.li 
                className="flex items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
              >
                <span className="mr-3 text-fuchsia-400 text-xl">•</span> 
                <span>Redeemed coins are non-refundable.</span>
              </motion.li>
              <motion.li 
                className="flex items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
              >
                <span className="mr-3 text-fuchsia-400 text-xl">•</span> 
                <span>Redemption codes have an expiration date and cannot be used after that period.</span>
              </motion.li>
            </ul>
          </motion.div>
        </motion.div>
      </motion.div>
      
      {/* Add our coins modal */}
      <CoinsModal 
        isOpen={modalOpen} 
        onClose={() => {
          setModalOpen(false);
          router.push('/');
        }} 
        coinsAdded={coinsAdded}
        newBalance={newBalance}
      />
    </div>
  );
};

export default RedeemPage; 