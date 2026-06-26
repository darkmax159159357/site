'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import firebaseApp from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { FaKey, FaCoins, FaCalendarAlt, FaCopy, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Image from 'next/image';

const db = getFirestore(firebaseApp);

// Utility to generate random codes
const generateRandomCode = (length = 10) => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  
  // First 4 characters - current year and month
  const date = new Date();
  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  result += year + month;
  
  // Remaining characters - random
  for (let i = 0; i < length - 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  // Insert dashes for readability
  return `${result.slice(0, 4)}-${result.slice(4, 8)}-${result.slice(8)}`;
};

const CodeGeneratorPage: React.FC = () => {
  const { userData } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [amount, setAmount] = useState(100);
  const [expiration, setExpiration] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  
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
  
  const floatVariants = {
    initial: { y: 0 },
    float: {
      y: [0, -15, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        repeatType: "loop" as const,
        ease: "easeInOut"
      }
    }
  };
  
  useEffect(() => {
    // Set default expiration date to 3 months from now
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    setExpiration(threeMonthsLater.toISOString().split('T')[0]);
    
    // Check if user is admin
    setIsAdmin(userData?.role === 'admin');
  }, [userData]);
  
  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast.error('You do not have permission to generate codes');
      return;
    }
    
    if (quantity <= 0 || quantity > 100) {
      toast.error('Please enter a valid quantity (1-100)');
      return;
    }
    
    if (amount <= 0) {
      toast.error('Please enter a valid coin amount');
      return;
    }
    
    if (!expiration) {
      toast.error('Please set an expiration date');
      return;
    }
    
    setIsGenerating(true);
    const codes: string[] = [];
    
    try {
      // Generate the specified number of codes
      for (let i = 0; i < quantity; i++) {
        const code = generateRandomCode();
        codes.push(code);
        
        // Add code to Firestore
        await addDoc(collection(db, 'redemption_codes'), {
          code,
          coins: amount,
          expirationDate: new Date(expiration),
          used: false,
          createdAt: new Date(),
          createdBy: userData?.uid
        });
      }
      
      setGeneratedCodes(codes);
      toast.success(`${quantity} code${quantity > 1 ? 's' : ''} generated successfully`);
    } catch (error) {
      console.error('Error generating codes:', error);
      toast.error('Failed to generate codes');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Code copied to clipboard'))
      .catch(() => toast.error('Failed to copy code'));
  };
  
  const copyAllCodes = () => {
    const codesText = generatedCodes.join('\n');
    navigator.clipboard.writeText(codesText)
      .then(() => toast.success('All codes copied to clipboard'))
      .catch(() => toast.error('Failed to copy codes'));
  };
  
  // Redirect or show access denied message if not admin
  if (!isAdmin && userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4">
        <motion.div 
          className="bg-gradient-to-r from-red-900/30 to-red-800/30 p-8 rounded-3xl border border-red-500/20 text-center max-w-md backdrop-blur-sm shadow-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mx-auto mb-4 w-16 h-16 flex items-center justify-center bg-red-500/20 rounded-full"
          >
            <FaKey className="text-3xl text-red-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">You do not have permission to access this administrative page.</p>
          <motion.a 
            href="/"
            className="group inline-flex items-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-full shadow-lg transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" />
            Return to Homepage
          </motion.a>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-12 px-4 relative overflow-hidden bg-gradient-to-b from-gray-900 to-black">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-72 h-72 bg-green-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-amber-500/10 rounded-full filter blur-3xl"></div>
      </div>
      
      <motion.div 
        className="max-w-5xl mx-auto relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header with Medusa image */}
        <motion.div 
          variants={itemVariants}
          className="text-center mb-16 relative"
        >
          <motion.div
            className="relative inline-block mb-6"
            variants={floatVariants}
            initial="initial"
            animate="float"
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-green-600/50 via-cyan-500/50 to-blue-600/50 filter blur-xl"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, 0, -5, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "loop",
              }}
            ></motion.div>
            <div className="relative mx-auto mb-2 w-32 h-32 overflow-hidden">
              <Image
                src="/Assets/medusa2.png"
                alt="Medusa"
                width={128}
                height={128}
                className="object-contain drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]"
              />
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 mb-3"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            style={{ backgroundSize: '200% auto' }}
          >
            Code Generator
          </motion.h1>
          <motion.p 
            className="text-gray-300 text-lg max-w-lg mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Generate redemption codes for premium users
          </motion.p>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          className="mb-16"
        >
          <motion.div
            className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 p-10 rounded-3xl backdrop-blur-sm border border-white/10 shadow-xl relative overflow-hidden"
            whileHover={{ boxShadow: "0 0 30px rgba(34, 197, 94, 0.15)" }}
          >
            <motion.div
              className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-blue-500"
              initial={{ scaleX: 0, transformOrigin: "0% 0%" }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            
            <form onSubmit={handleGenerateCode} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="flex items-center text-white text-lg font-medium mb-2">
                    <FaCoins className="mr-2 text-2xl text-yellow-500" />
                    Coin Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                      className="w-full p-5 bg-gray-900/80 border-2 border-green-500/30 rounded-2xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-300"
                      min="1"
                    />
                    <motion.span 
                      className="absolute top-0 left-0 w-full h-full rounded-2xl pointer-events-none"
                      animate={{ 
                        boxShadow: ['0 0 0 rgba(34, 197, 94, 0)', '0 0 8px rgba(34, 197, 94, 0.3)', '0 0 0 rgba(34, 197, 94, 0)']
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    ></motion.span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="flex items-center text-white text-lg font-medium mb-2">
                    <FaCalendarAlt className="mr-2 text-2xl text-blue-500" />
                    Expiration Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={expiration}
                      onChange={(e) => setExpiration(e.target.value)}
                      className="w-full p-5 bg-gray-900/80 border-2 border-blue-500/30 rounded-2xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
                    />
                    <motion.span 
                      className="absolute top-0 left-0 w-full h-full rounded-2xl pointer-events-none"
                      animate={{ 
                        boxShadow: ['0 0 0 rgba(59, 130, 246, 0)', '0 0 8px rgba(59, 130, 246, 0.3)', '0 0 0 rgba(59, 130, 246, 0)']
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    ></motion.span>
                  </div>
                </motion.div>
              </div>
              
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="flex items-center text-white text-lg font-medium mb-2">
                  <FaKey className="mr-2 text-2xl text-purple-400" />
                  Number of Codes to Generate
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full p-5 bg-gray-900/80 border-2 border-purple-500/30 rounded-2xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
                    min="1"
                    max="100"
                  />
                  <motion.span 
                    className="absolute top-0 left-0 w-full h-full rounded-2xl pointer-events-none"
                    animate={{ 
                      boxShadow: ['0 0 0 rgba(168, 85, 247, 0)', '0 0 8px rgba(168, 85, 247, 0.3)', '0 0 0 rgba(168, 85, 247, 0)']
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  ></motion.span>
                </div>
                <p className="text-gray-400 text-sm italic mt-2">Maximum: 100 codes per batch</p>
              </motion.div>
              
              <motion.button
                type="submit"
                disabled={isGenerating}
                className="w-full py-5 px-8 mt-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-bold text-lg rounded-full shadow-lg transition-all duration-300 disabled:opacity-70 flex items-center justify-center relative overflow-hidden"
                whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(34, 197, 94, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {isGenerating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Codes...
                  </span>
                ) : (
                  <>
                    <span>Generate Codes</span>
                    <motion.span 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1 }}
                    />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
        
        {generatedCodes.length > 0 && (
          <motion.div
            className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 p-8 rounded-3xl backdrop-blur-sm border border-white/10 shadow-xl relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500"
              initial={{ scaleX: 0, transformOrigin: "0% 0%" }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8 }}
            />
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <motion.div
                  className="mr-3 p-2 bg-cyan-500/20 rounded-xl"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, 0, -5, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <FaKey className="text-xl text-cyan-400" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white">Generated Codes</h2>
              </div>
              
              {generatedCodes.length > 1 && (
                <motion.button 
                  onClick={copyAllCodes}
                  className="flex items-center gap-2 py-2 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-full transition-all"
                  whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(6, 182, 212, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaCopy className="text-sm" /> Copy All
                </motion.button>
              )}
            </div>
            
            <div className="max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              <ul className="space-y-3">
                {generatedCodes.map((code, index) => (
                  <motion.li 
                    key={index} 
                    className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:bg-gray-800/80 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <div className="font-mono text-lg text-cyan-200 tracking-wider">{code}</div>
                    <motion.button 
                      onClick={() => copyToClipboard(code)}
                      className="text-cyan-400 hover:text-cyan-300 p-2 rounded-full hover:bg-cyan-900/30 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Copy code"
                    >
                      <FaCopy />
                    </motion.button>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default CodeGeneratorPage; 