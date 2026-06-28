"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { signIn, registerUser, signInWithGoogle, signInWithDiscord, completeGoogleRedirect } from "@/lib/firebaseAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaDiscord, FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock } from "react-icons/fa";
// No longer using next/image

export default function AuthPage() {
  // Form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Animation states
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [bgParticles, setBgParticles] = useState<{x: number, y: number, size: number, duration: number}[]>([]);
  
  const { user } = useAuth();
  const router = useRouter();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  // Complete a redirect-based Google sign-in when the user returns to this page.
  useEffect(() => {
    completeGoogleRedirect()
      .then((data) => {
        if (data) router.push("/");
      })
      .catch(() => {});
  }, [router]);

  // Setup page load animations
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 100);
    
    // Generate random background particles
    const particles = Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 10 + 5
    }));
    setBgParticles(particles);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle form submissions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      setLoginError("Please fill in all fields");
      return;
    }
    
    setIsLoginLoading(true);
    setLoginError("");
    
    try {
      await signIn(loginEmail, loginPassword);
      router.push("/");
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message.includes('user-not-found') || error.message.includes('wrong-password')) {
        setLoginError('Invalid email or password');
      } else {
        setLoginError(error.message || 'An error occurred. Please try again.');
      }
    } finally {
      setIsLoginLoading(false);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerUsername || !registerEmail || !registerPassword) {
      setRegisterError("Please fill in all fields");
      setRegisterSuccess("");
      return;
    }
    
    setIsRegisterLoading(true);
    setRegisterError("");
    setRegisterSuccess("");
    
    try {
      await registerUser(registerEmail, registerPassword, registerUsername);
      setRegisterSuccess('Registration successful! You can now sign in.');
      setRegisterUsername("");
      setRegisterEmail("");
      setRegisterPassword("");
      
      setTimeout(() => {
        setIsSignUp(false);
      }, 2000);
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.message.includes('email-already-in-use')) {
        setRegisterError('Email already in use. Please use a different email.');
      } else if (error.message.includes('weak-password')) {
        setRegisterError('Password is too weak. Please use a stronger password.');
      } else {
        setRegisterError(error.message || 'An error occurred. Please try again.');
      }
    } finally {
      setIsRegisterLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      setIsLoginLoading(true);
      setLoginError("");
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      setLoginError(error.message || "Google sign-in failed");
      setIsLoginLoading(false);
    }
  };

  const handleDiscordSignIn = async () => {
    try {
      setLoginError("");
      await signInWithDiscord();
    } catch (error: any) {
      console.error("Discord sign-in error:", error);
      setLoginError(error.message || "Discord sign-in failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        {/* Gradient backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.15)_0%,rgba(0,0,0,0)_70%)]"></div>
        
        {/* Animated gradient orbs */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1.5, delay: 0.2 }}
          className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-purple-600/20 to-violet-600/20 blur-[100px] animate-floatSlow"
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1.5, delay: 0.4 }}
          className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-fuchsia-600/20 to-pink-600/20 blur-[100px] animate-floatMedium"
        />
      </div>
      
      {/* Main layout with 2 columns on desktop */}
      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 p-4">
        {/* Left Column - Auth Form */}
        <div className="w-full md:w-1/2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isPageLoaded ? 1 : 0, y: isPageLoaded ? 0 : 20 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full relative"
          >
            {/* Card container with glass effect */}
            <div className="relative w-full overflow-hidden rounded-2xl shadow-[0_0_25px_rgba(139,92,246,0.3)]">
              {/* Glowing border animation */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-fuchsia-500/20 to-pink-500/10 rounded-2xl"></div>
                <div className="absolute inset-[-1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent rounded-2xl animate-borderFlow"></div>
              </div>
              
              {/* Glass background */}
              <div className="absolute inset-0 bg-black/80 backdrop-blur-lg rounded-2xl"></div>
              
              {/* Grid pattern background */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
              </div>
              
              {/* Content container */}
              <div className="relative p-6 md:p-8">
                <AnimatePresence mode="wait" initial={false}>
                  {!isSignUp ? (
                    <motion.div
                      key="signin"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      className="space-y-6"
                    >
                      <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold">
                          <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Welcome Back</span>
                        </h2>
                        <p className="text-gray-400 text-sm">Sign in to continue your journey</p>
                      </div>
                      
                      {loginError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-3 rounded-lg bg-red-500/20 border-l-4 border-red-500 text-white text-sm"
                        >
                          {loginError}
                        </motion.div>
                      )}
                      
                      <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-4">
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-500 transition-colors">
                              <FaEnvelope />
                            </div>
                            <input
                              type="email"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              placeholder="Email"
                              className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-800 focus:border-purple-500 rounded-lg focus:ring-2 ring-purple-500/20 focus:outline-none text-white transition-all duration-300"
                            />
                            <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-gradient-to-r from-purple-500 to-pink-500 group-focus-within:w-full transition-all duration-300"></div>
                          </div>
                          
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-500 transition-colors">
                              <FaLock />
                            </div>
                            <input
                              type={showPassword ? "text" : "password"}
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              placeholder="Password"
                              className="block w-full pl-10 pr-10 py-3 bg-white/5 border border-gray-800 focus:border-purple-500 rounded-lg focus:ring-2 ring-purple-500/20 focus:outline-none text-white transition-all duration-300"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                            >
                              {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                            <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-gradient-to-r from-purple-500 to-pink-500 group-focus-within:w-full transition-all duration-300"></div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <input 
                              id="remember-me" 
                              name="remember-me" 
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-700 text-purple-600 focus:ring-purple-500 bg-gray-800"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-gray-400">
                              Remember me
                            </label>
                          </div>
                          <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">Forgot password?</a>
                        </div>
                        
                        <motion.button
                          type="submit"
                          disabled={isLoginLoading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all overflow-hidden group"
                        >
                          <span className={`relative z-10 transition-opacity ${isLoginLoading ? 'opacity-0' : 'opacity-100'}`}>Sign In</span>
                          {isLoginLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                          )}
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700"></div>
                        </motion.button>
                      </form>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-800"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-black/80 px-2 text-gray-500">Or continue with</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          type="button"
                          onClick={handleGoogleSignIn}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-gray-800 rounded-lg text-white transition-all duration-300"
                        >
                          <FaGoogle className="text-red-500" />
                          <span>Google</span>
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={handleDiscordSignIn}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-gray-800 rounded-lg text-white transition-all duration-300"
                        >
                          <FaDiscord className="text-indigo-400" />
                          <span>Discord</span>
                        </motion.button>
                      </div>
                      
                      <div className="text-center md:hidden">
                        <p className="text-gray-500 text-sm">
                          Don&apos;t have an account?{" "}
                          <button
                            type="button"
                            onClick={() => setIsSignUp(true)}
                            className="text-purple-400 hover:text-purple-300"
                          >
                            Sign Up
                          </button>
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="signup"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      className="space-y-6"
                    >
                      <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold">
                          <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">Create Account</span>
                        </h2>
                        <p className="text-gray-400 text-sm">Join our community today</p>
                      </div>
                      
                      {registerSuccess && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-3 rounded-lg bg-green-500/20 border-l-4 border-green-500 text-white text-sm"
                        >
                          {registerSuccess}
                        </motion.div>
                      )}
                      
                      {registerError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-3 rounded-lg bg-red-500/20 border-l-4 border-red-500 text-white text-sm"
                        >
                          {registerError}
                        </motion.div>
                      )}
                      
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-4">
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                              <FaUser />
                            </div>
                            <input
                              type="text"
                              value={registerUsername}
                              onChange={(e) => setRegisterUsername(e.target.value)}
                              placeholder="Username"
                              className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-800 focus:border-blue-500 rounded-lg focus:ring-2 ring-blue-500/20 focus:outline-none text-white transition-all duration-300"
                            />
                            <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-gradient-to-r from-blue-500 to-violet-500 group-focus-within:w-full transition-all duration-300"></div>
                          </div>
                          
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                              <FaEnvelope />
                            </div>
                            <input
                              type="email"
                              value={registerEmail}
                              onChange={(e) => setRegisterEmail(e.target.value)}
                              placeholder="Email"
                              className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-800 focus:border-blue-500 rounded-lg focus:ring-2 ring-blue-500/20 focus:outline-none text-white transition-all duration-300"
                            />
                            <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-gradient-to-r from-blue-500 to-violet-500 group-focus-within:w-full transition-all duration-300"></div>
                          </div>
                          
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                              <FaLock />
                            </div>
                            <input
                              type={showPassword ? "text" : "password"}
                              value={registerPassword}
                              onChange={(e) => setRegisterPassword(e.target.value)}
                              placeholder="Password"
                              className="block w-full pl-10 pr-10 py-3 bg-white/5 border border-gray-800 focus:border-blue-500 rounded-lg focus:ring-2 ring-blue-500/20 focus:outline-none text-white transition-all duration-300"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                            >
                              {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                            <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-gradient-to-r from-blue-500 to-violet-500 group-focus-within:w-full transition-all duration-300"></div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            id="terms"
                            name="terms"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-700 text-blue-600 focus:ring-blue-500 bg-gray-800"
                          />
                          <label htmlFor="terms" className="ml-2 block text-sm text-gray-400">
                            I agree to the{" "}
                            <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Terms</a>
                            {" "}and{" "}
                            <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Privacy Policy</a>
                          </label>
                        </div>
                        
                        <motion.button
                          type="submit"
                          disabled={isRegisterLoading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg font-medium text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all overflow-hidden group"
                        >
                          <span className={`relative z-10 transition-opacity ${isRegisterLoading ? 'opacity-0' : 'opacity-100'}`}>Create Account</span>
                          {isRegisterLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                          )}
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700"></div>
                        </motion.button>
                      </form>
                      
                      <div className="text-center md:hidden">
                        <p className="text-gray-500 text-sm">
                          Already have an account?{" "}
                          <button
                            type="button"
                            onClick={() => setIsSignUp(false)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            Sign In
                          </button>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Welcome Image */}
        <div className="hidden md:flex w-1/2 flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isPageLoaded ? 1 : 0, y: isPageLoaded ? 0 : 20 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(139,92,246,0.4)]"
            style={{ width: "80%", maxWidth: "400px" }}
          >
            <img
              src="/Assets/glow_spirit.svg"
              alt="Welcome to Glint Scans"
              style={{ width: "100%", height: "auto", display: "block" }}
              className="object-cover bg-[#1a1118]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-6">
              <h3 className="text-2xl font-bold text-white mb-2">Let&apos;s join!</h3>
              <p className="text-gray-300 mb-4">Start your journey today</p>
              
              <motion.button
                onClick={() => setIsSignUp(!isSignUp)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="py-2.5 px-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white text-sm shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:shadow-[0_0_25px_rgba(139,92,246,0.7)] transition-all w-full"
              >
                {isSignUp ? "Sign In Instead" : "Create an Account"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 