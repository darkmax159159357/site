"use client";

import React, { useEffect } from 'react';
import { AuthProvider } from "@/contexts/AuthContext";
import { BookmarkProvider } from "@/contexts/BookmarkContext";
import { ReadingHistoryProvider } from "@/contexts/ReadingHistoryContext";
import { SecurityProvider } from "@/contexts/SecurityContext";
import ChapterImageProtector from '@/components/ChapterImageProtector';
import { AdsHeadConfig } from './ads/AdsConfig';
import { StickyAdContainer } from './ads/SidebarAds';
import { initLinkPreviewScript } from '@/lib/link-preview-script';
import { ThemeProvider } from 'next-themes';

interface ClientProvidersProps {
  children: React.ReactNode;
}

const ClientProviders: React.FC<ClientProvidersProps> = ({ children }) => {
  // Initialize link preview functionality
  useEffect(() => {
    try {
      initLinkPreviewScript();
    } catch (error) {
      console.error('Error initializing link preview script:', error);
    }
  }, []);

  return (
    <SecurityProvider>
      <AuthProvider>
        <AdsHeadConfig>
          <BookmarkProvider>
            <ReadingHistoryProvider>
              <ThemeProvider attribute="class" defaultTheme="dark">
                <ChapterImageProtector>
                  {children}
                  <StickyAdContainer />
                </ChapterImageProtector>
              </ThemeProvider>
            </ReadingHistoryProvider>
          </BookmarkProvider>
        </AdsHeadConfig>
      </AuthProvider>
    </SecurityProvider>
  );
};

export default ClientProviders; 