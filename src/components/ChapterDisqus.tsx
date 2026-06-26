"use client";
import { useEffect, useRef } from "react";
import disqusConfig from "@/lib/disqus-config";
import { chapterType } from "@/app/(pages)/read/[id]/chapterType";

interface ChapterDisqusProps {
  chapterId?: string;
  chapterTitle?: string;
  mangaId?: string;
  dataRead?: chapterType;
}

const ChapterDisqus = ({ 
  chapterId, 
  chapterTitle, 
  mangaId, 
  dataRead 
}: ChapterDisqusProps) => {
  const disqusThreadRef = useRef<HTMLDivElement>(null);
  
  // Use the provided chapterId or fallback
  const id = chapterId || '';
  
  // Construct the title safely without causing undefined errors
  const title = chapterTitle || (
    id && id.includes('-ch') 
      ? `Chapter ${id.split('-ch')[1] || ''}` 
      : 'Chapter'
  );
  
  useEffect(() => {
    if (typeof window === 'undefined' || !disqusThreadRef.current || !id) return;
    
    // Clean up any existing Disqus
    const existingScript = document.querySelector('script[src*="disqus.com/embed.js"]');
    if (existingScript && existingScript.parentNode) {
      existingScript.parentNode.removeChild(existingScript);
    }
    
    // Reset the thread div
    if (disqusThreadRef.current) {
      disqusThreadRef.current.innerHTML = '';
    }
    
    // Set up Disqus
    const shortname = "medusascans";
    const identifier = `chapter/${id}`;
    const url = `${disqusConfig.domain}/read/${id}`;
    
    console.log("ChapterDisqus - Setting up Disqus with:", { shortname, identifier, url, title });
    
    // Set global variables
    window.disqus_shortname = shortname;
    
    // Configure Disqus
    window.disqus_config = function(this: any) {
      this.page = {
        url: url,
        identifier: identifier,
        title: title
      };
    };
    
    // Load the Disqus script
    const script = document.createElement('script');
    script.src = `https://${shortname}.disqus.com/embed.js`;
    script.setAttribute('data-timestamp', Date.now().toString());
    script.async = true;
    
    document.body.appendChild(script);
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [id, title]);
  
  return (
    <div className="w-full max-w-none">
      <div className="bg-black rounded-xl p-6 shadow-lg ring-1 ring-white/10 backdrop-blur-md">
        <div className="flex items-center mb-4">
          <h3 className="text-xl font-bold text-white">Comments</h3>
          <div className="ml-3 flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <div className="w-2 h-2 rounded-full bg-pink-500"></div>
          </div>
        </div>
        <div id="disqus_thread" ref={disqusThreadRef} className="rounded-lg overflow-hidden"></div>
      </div>
    </div>
  );
};

export default ChapterDisqus; 