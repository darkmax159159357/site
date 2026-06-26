'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const MaintenancePage: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-black">
      {/* Full screen image with default brightness */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Assets/maintenance.jpg"
          alt="Site Maintenance"
          fill
          sizes="100vw"
          quality={100}
          priority
          className="object-cover"
        />
      </div>
      
      {/* Enhanced animated particles - much more visible now */}
      <EnhancedParticles />
    </div>
  );
};

// Enhanced animated particles component with improved visibility
const EnhancedParticles: React.FC = () => {
  // Small particles
  const smallParticles = Array.from({ length: 50 }, (_, i) => ({
    id: `small-${i}`,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 15 + 10,
    delay: Math.random() * 5,
    color: getRandomColor(0.7), // More opaque
  }));
  
  // Medium particles
  const mediumParticles = Array.from({ length: 30 }, (_, i) => ({
    id: `medium-${i}`,
    size: Math.random() * 7 + 5,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
    color: getRandomColor(0.8), // More opaque
  }));
  
  // Large particles
  const largeParticles = Array.from({ length: 15 }, (_, i) => ({
    id: `large-${i}`,
    size: Math.random() * 10 + 10,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 25 + 20,
    delay: Math.random() * 5,
    color: getRandomColor(0.9), // Most opaque
  }));
  
  // Combine all particles
  const allParticles = [...smallParticles, ...mediumParticles, ...largeParticles];
  
  return (
    <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
      {allParticles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: particle.color,
            boxShadow: particle.size > 10 
              ? `0 0 20px 5px ${particle.color}`
              : particle.size > 5 
                ? `0 0 15px 3px ${particle.color}`
                : `0 0 10px 2px ${particle.color}`
          }}
          animate={{
            y: [0, -80, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0.4, 1, 0.4],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Helper function to get random colors
function getRandomColor(opacity = 1) {
  // Array of bright, visible colors
  const colors = [
    `rgba(255, 255, 255, ${opacity})`, // White
    `rgba(255, 105, 180, ${opacity})`, // Hot Pink
    `rgba(0, 191, 255, ${opacity})`, // Deep Sky Blue
    `rgba(255, 215, 0, ${opacity})`, // Gold
    `rgba(50, 205, 50, ${opacity})`, // Lime Green
    `rgba(255, 69, 0, ${opacity})`, // Red-Orange
    `rgba(147, 112, 219, ${opacity})`, // Medium Purple
    `rgba(0, 250, 154, ${opacity})`, // Medium Spring Green
    `rgba(255, 165, 0, ${opacity})`, // Orange
    `rgba(135, 206, 250, ${opacity})`, // Light Sky Blue
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

export default MaintenancePage; 