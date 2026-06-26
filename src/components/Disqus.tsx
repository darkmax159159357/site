"use client";
import disqusConfig from "@/lib/disqus-config";
import { useEffect, useState, useRef } from "react";

// Add type declaration for the DISQUS property on the window object
declare global {
  interface Window {
    DISQUS?: any;
    disqus_config?: any;
    disqus_shortname?: string;
  }
}

interface DisqusProps {
  shortname?: string;
  identifier: string;
  title: string;
  url?: string;
  category?: string;
  language?: string;
}

const Disqus = ({
  shortname,
  identifier,
  title,
  url,
  category,
  language = disqusConfig.language
}: DisqusProps) => {
  // State to store the current URL and loading status
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const disqusThreadRef = useRef<HTMLDivElement>(null);
  
  // Use values from config file with fallbacks to props
  const disqusShortname = shortname || disqusConfig.shortname;
  
  // Determine the URL to use for Disqus
  // For localhost, we'll use the production domain + path to ensure comments persist
  const getDisqusUrl = () => {
    if (url) {
      console.log("Using provided URL:", url);
      return url;
    }
    
    if (currentUrl.includes('localhost')) {
      // Extract the path from the localhost URL
      const path = new URL(currentUrl).pathname;
      // Use the production domain + path
      const constructedUrl = `${disqusConfig.domain}${path}`;
      console.log("Using constructed URL for localhost:", constructedUrl);
      return constructedUrl;
    }
    
    const defaultUrl = currentUrl || `${disqusConfig.domain}/${identifier}`;
    console.log("Using default URL:", defaultUrl);
    return defaultUrl;
  };
  
  // Load Disqus script
  useEffect(() => {
    if (typeof window === 'undefined') {
      console.log("Window is undefined, skipping Disqus initialization");
      return;
    }
    
    if (!disqusThreadRef.current) {
      console.log("Disqus thread ref is not available, skipping initialization");
      return;
    }
    
    console.log("Starting Disqus initialization for:", identifier);
    console.log("Component props:", { shortname, identifier, title, url, category });
    
    try {
      // Set global Disqus variables
      window.disqus_shortname = disqusShortname;
      console.log("Set window.disqus_shortname =", window.disqus_shortname);
      
      const windowUrl = window.location.href;
      console.log("Current window URL:", windowUrl);
      
      const fullUrl = getDisqusUrl();
      console.log("Final URL for Disqus:", fullUrl);
      
      const debugData = {
        shortname: disqusShortname,
        domain: disqusConfig.domain,
        isDev: process.env.NODE_ENV === 'development',
        currentUrl: windowUrl,
        identifier: identifier,
        title: title,
        fullUrl: fullUrl,
        category: category,
        disqusThreadExists: !!disqusThreadRef.current,
        windowDisqusExists: !!window.DISQUS
      };
      
      console.log("Disqus debug info:", debugData);
      setDebugInfo(debugData);
      setCurrentUrl(windowUrl);
      
      // If DISQUS is already loaded, reset it
      if (window.DISQUS) {
        console.log("DISQUS already exists, resetting...");
        window.DISQUS.reset({
          reload: true,
          config: function(this: any) {
            this.page = {
              url: fullUrl,
              identifier: identifier,
              title: title
            };
          }
        });
        console.log("DISQUS reset completed");
        setIsLoading(false);
        return;
      }
      
      // Configure Disqus
      console.log("Configuring disqus_config");
      window.disqus_config = function(this: any) {
        this.page = {
          url: fullUrl,
          identifier: identifier,
          title: title
        };
        console.log("disqus_config set with:", { url: fullUrl, identifier, title });
      };
      
      // Use the standard format for the site shortname
      const scriptUrl = `https://${disqusShortname}.disqus.com/embed.js`;
      console.log("Loading Disqus with URL:", scriptUrl);
      
      // Load the Disqus script
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.setAttribute('data-timestamp', Date.now().toString());
      script.async = true;
      
      // Add event listeners for script loading
      script.onload = () => {
        console.log("Disqus script loaded successfully");
        
        // Check if DISQUS object exists after a short delay
        setTimeout(() => {
          if (window.DISQUS) {
            console.log("DISQUS object initialized successfully");
            setIsLoading(false);
          } else {
            console.error("DISQUS object not initialized after script load");
            setErrorMessage("DISQUS object not initialized after script load");
            setHasError(true);
            setIsLoading(false);
          }
        }, 2000);
      };
      
      script.onerror = (error) => {
        console.error("Error loading Disqus script:", error);
        setErrorMessage(`Error loading Disqus script: ${error}`);
        setHasError(true);
        setIsLoading(false);
      };
      
      console.log("Appending Disqus script to document body");
      document.body.appendChild(script);
      
      // Set a timeout to detect if Disqus fails to load
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.error("Disqus script loading timed out");
          setErrorMessage("Disqus script loading timed out");
          setHasError(true);
          setIsLoading(false);
        }
      }, 10000);
      
      return () => {
        // Clean up script and timeout when component unmounts
        console.log("Cleaning up Disqus component");
        clearTimeout(timeoutId);
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    } catch (error) {
      console.error("Error setting up Disqus:", error);
      setErrorMessage(`Error setting up Disqus: ${error}`);
      setHasError(true);
      setIsLoading(false);
    }
  }, [disqusShortname, identifier, title, category]);
  
  // Reset Disqus if it fails to load
  const handleReset = () => {
    if (typeof window !== 'undefined') {
      console.log("Resetting Disqus...");
      
      // Remove any existing Disqus script
      const existingScript = document.querySelector('script[src*="disqus.com/embed.js"]');
      if (existingScript && existingScript.parentNode) {
        console.log("Removing existing Disqus script");
        existingScript.parentNode.removeChild(existingScript);
      } else {
        console.log("No existing Disqus script found");
      }
      
      // Reset state
      setIsLoading(true);
      setHasError(false);
      setErrorMessage("");
      
      // Clear the disqus thread div
      if (disqusThreadRef.current) {
        console.log("Clearing disqus_thread div");
        disqusThreadRef.current.innerHTML = '';
      } else {
        console.log("disqus_thread ref not available");
      }
      
      // Force reload the page to reinitialize Disqus
      console.log("Reloading page to reinitialize Disqus");
      window.location.reload();
    }
  };
  
  // Toggle debug information
  const [showDebug, setShowDebug] = useState(true); // Set to true by default to help diagnose issues
  
  return (
    <div className="w-full bg-black py-4">
      <div className="max-w-screen-xl mx-auto">
        <div className="bg-[#222222] rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Comments</h3>
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-gray-400 hover:text-white"
            >
              {showDebug ? 'Hide Debug' : 'Show Debug'}
            </button>
          </div>
          
          {showDebug && debugInfo && (
            <div className="mb-4 p-3 bg-gray-800 rounded text-xs text-gray-300 overflow-auto">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              {errorMessage && (
                <div className="mt-2 p-2 bg-red-900 rounded">
                  <p className="text-red-300">Error: {errorMessage}</p>
                </div>
              )}
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Loading comments...</p>
            </div>
          ) : hasError ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">We were unable to load Disqus comments.</p>
              {errorMessage && (
                <p className="text-red-400 text-sm mb-4">{errorMessage}</p>
              )}
              <button 
                onClick={handleReset}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div id="disqus_thread" ref={disqusThreadRef}></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Disqus;
