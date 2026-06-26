"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Component to handle browser back button behavior
 * This solves issues with Next.js navigation where sometimes back button requires double-clicks
 */
const BackButtonHandler = () => {
  const router = useRouter();

  useEffect(() => {
    // Handler for back/forward navigation
    const handlePopState = () => {
      // Force a router refresh to ensure proper back navigation
      router.refresh();
    };

    // Handler for our custom event
    const handleRouterBackButton = () => {
      // This helps ensure proper state updates after back button press
      setTimeout(() => {
        router.refresh();
      }, 0);
    };

    // Add event listeners
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('router-back-button', handleRouterBackButton);

    // Clean up
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('router-back-button', handleRouterBackButton);
    };
  }, [router]);

  // This component doesn't render anything
  return null;
};

export default BackButtonHandler; 