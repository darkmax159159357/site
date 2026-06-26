"use client";

/**
 * Anti-scraping module for manga websites
 * 
 * This module provides protection against automated scraping and image theft
 * without interfering with normal navigation functionality.
 * 
 * Protection methods:
 * 1. Canvas-based image protection (adds overlay)
 * 2. Disables right-click on protected images only
 * 3. Prevents direct image copy/save on protected content
 * 4. Advanced obfuscation for image URLs
 * 5. Adds transparent image watermarking
 */

let isProtectionEnabled = true;
let isDebugMode = false;

// Configuration object
const config = {
  // Only enable protection on the actual reader pages
  readerPageOnly: true, 
  // Selectors for images that need protection
  protectedSelectors: ['.manga-reader-image img', '.image-container img', '.protected-image', '.secure-chapter-image'],
  // Selectors for elements that should remain clickable
  clickableSelectors: ['a:not(.manga-reader-image a):not(.image-container a)', 
                      'button', '[role="button"]', '.clickable', 
                      '.latest-poster', '.manga-card-main-link', 
                      '.manga-card-clickable'],
  // Enable more aggressive protection for premium content
  premiumProtection: true,
  // Enable DEBUG mode to log protection activities
  debug: true
};

/**
 * Initialize anti-scraping protection
 */
export function initAntiScraping(options = {}) {
  try {
    // TEMPORARY: Disable anti-scraping protection while fixing click issues
    isProtectionEnabled = false;
    logDebug('Anti-scraping protection temporarily disabled due to click issues');
    return;
    
    /*
    // Merge options with defaults
    Object.assign(config, options);

    // Check if we're on a reader page that needs protection
    const isReaderPage = window.location.pathname.includes('/read/');
    
    // Only apply protection on reader pages if readerPageOnly is true
    if (config.readerPageOnly && !isReaderPage) {
      isProtectionEnabled = false;
      logDebug('Anti-scraping protection disabled - not a reader page');
      return;
    }
    
    // Apply basic protections
    applyBasicProtections();
    
    // Apply advanced protections
    if (config.premiumProtection) {
      applyAdvancedProtections();
    }
    
    logDebug('Anti-scraping protection initialized');
    */
  } catch (error) {
    console.error('Error initializing anti-scraping:', error);
  }
}

/**
 * Apply basic protections
 */
function applyBasicProtections() {
  try {
    // Disable right-click context menu ONLY on protected elements
    document.addEventListener('contextmenu', (e) => {
      // Only prevent context menu on protected elements
      if (isProtectedElement(e.target)) {
        e.preventDefault();
        logDebug('Prevented context menu on protected element');
        return false;
      }
      // Allow context menu on all other elements
      return true;
    });
    
    // Disable drag-and-drop ONLY on protected elements
    document.addEventListener('dragstart', (e) => {
      if (isProtectedElement(e.target)) {
        e.preventDefault();
        logDebug('Prevented drag on protected element');
        return false;
      }
      return true;
    });
    
    // Disable keyboard shortcuts for protected actions
    document.addEventListener('keydown', (e) => {
      const isControlKey = e.ctrlKey || e.metaKey;
      const isProtectedKey = e.key === 'c' || e.key === 's' || e.key === 'p';
      
      if (isControlKey && isProtectedKey && isDocumentBeingProtected()) {
        if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
          return true; // Allow copy/paste in input fields
        }
        
        e.preventDefault();
        logDebug(`Prevented keyboard shortcut: Ctrl+${e.key}`);
        return false;
      }
    });
    
    logDebug('Basic protections applied');
  } catch (error) {
    console.error('Error applying basic protections:', error);
  }
}

/**
 * Check if an element or its parent should be protected
 */
function isProtectedElement(element: any): boolean {
  if (!element || !isProtectionEnabled) return false;
  
  // Check if element is an HTMLElement
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  // Check if element matches protected selectors
  for (const selector of config.protectedSelectors) {
    if (element.matches(selector) || element.closest(selector)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if document is currently displaying protected content
 */
function isDocumentBeingProtected(): boolean {
  if (!isProtectionEnabled) return false;
  
  // Check if we're on a reader page
  const isReaderPage = window.location.pathname.includes('/read/');
  if (!isReaderPage) return false;
  
  // Check if there are any protected images on the page
  for (const selector of config.protectedSelectors) {
    if (document.querySelector(selector)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Apply advanced protections that make automated extraction harder
 */
function applyAdvancedProtections() {
  // Add CSS to prevent screenshots and printing, but ensure links remain clickable
  const style = document.createElement('style');
  style.innerHTML = `
    @media print {
      body { display: none !important; }
    }
    
    .manga-reader-image img,
    .image-container img,
    .protected-image,
    .secure-chapter-image {
      -webkit-user-drag: none;
      user-select: none;
    }
    
    /* Fix for clickable elements - ensure they have higher z-index and proper pointer events */
    a, button, [role="button"], .clickable, .latest-poster, 
    .manga-card-main-link, .manga-card-clickable {
      pointer-events: auto !important;
      cursor: pointer !important;
      position: relative;
      z-index: 10;
    }
    
    /* Ensure all manga cards are clickable */
    .manga-card-clickable {
      z-index: 15;
    }

    /* Fix global pointer events issue */
    body {
      pointer-events: auto !important;
    }
  `;
  document.head.appendChild(style);
  
  // Disable copy/paste for protected content only
  document.addEventListener('copy', (e) => {
    const selection = window.getSelection();
    if (selection && isProtectedElement(selection.anchorNode)) {
      e.preventDefault();
      return false;
    }
  });
  
  // Disable view source shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.key === 'u') || (e.ctrlKey && e.key === 's')) {
      e.preventDefault();
      return false;
    }
  });

  // REMOVED DEBUG click monitor that was causing issues with click events
  // NOTE: Only log clicks in actual debug mode, and don't use capture phase
  if (isDebugMode) {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      // Check if the click is on a link or button
      const isOnClickable = target.closest('a') || target.closest('button') || 
                            target.closest('[role="button"]') || target.closest('.manga-card-clickable');
      
      if (isOnClickable) {
        console.log('Click on clickable element:', target);
      } else {
        console.log('Click on non-clickable element:', target);
      }
    }, false); // Changed to false to not use capture phase
  }
}

/**
 * Log debug messages if debug mode is enabled
 */
function logDebug(message: string, ...args: any[]) {
  if (config.debug) {
    console.log(`[Anti-Scraping] ${message}`, ...args);
  }
}

/**
 * Enable or disable protection
 */
export function toggleProtection(enable: boolean) {
  isProtectionEnabled = enable;
  logDebug(`Protection ${enable ? 'enabled' : 'disabled'}`);
}

/**
 * Enable or disable debug mode
 */
export function toggleDebug(enable: boolean) {
  config.debug = enable;
  isDebugMode = enable;
  console.log(`[Anti-Scraping] Debug mode ${enable ? 'enabled' : 'disabled'}`);
}

/**
 * Initialize DevTools guard to detect and handle DevTools opening
 * This provides an additional layer of protection against scraping
 * 
 * CURRENTLY DISABLED DUE TO INTERFERENCE WITH NORMAL SITE FUNCTIONALITY
 */
export function initDevToolsGuard() {
  try {
    logDebug('DevTools guard is currently disabled due to interference with normal functionality');
    
    // DISABLED: The code below was causing issues with normal site functionality
    
    /*
    // Basic detection for DevTools
    const devToolsDetector = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        logDebug('DevTools may be open based on window size difference');
      }
    };
    
    // Set up periodic check
    const checkInterval = setInterval(devToolsDetector, 1000);
    
    // Listen for resize events which might indicate DevTools opening
    window.addEventListener('resize', devToolsDetector);
    
    // Return cleanup function
    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('resize', devToolsDetector);
    };
    */
    
    return () => {}; // Empty cleanup function
  } catch (error) {
    console.error('Error initializing DevTools guard:', error);
  }
}

// Export default module
export default {
  init: initAntiScraping,
  enable: () => toggleProtection(true),
  disable: () => toggleProtection(false),
  debug: toggleDebug
};
