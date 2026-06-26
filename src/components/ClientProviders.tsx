"use client";

import React from 'react';
import { AuthProvider } from "@/contexts/AuthContext";
import { BookmarkProvider } from "@/contexts/BookmarkContext";
import { ReadingHistoryProvider } from "@/contexts/ReadingHistoryContext";
import { MaintenanceProvider } from "@/contexts/MaintenanceContext";
import { SecurityProvider } from "@/contexts/SecurityContext";
import { AdProvider } from "@/contexts/AdContext";
import { PaginationProvider } from "@/contexts/PaginationContext";
import ChapterImageProtector from './ChapterImageProtector';
import { AdsHeadConfig } from './ads/AdsConfig';
import { StickyAdContainer } from './ads/SidebarAds';
import BackButtonHandler from '@/lib/router-events/BackButtonHandler';

interface ClientProvidersProps {
  children: React.ReactNode;
}

const ClientProviders: React.FC<ClientProvidersProps> = ({ children }) => {
  return (
    <SecurityProvider>
      <MaintenanceProvider>
        <AuthProvider>
          <AdProvider>
            <AdsHeadConfig />
            <BookmarkProvider>
              <ReadingHistoryProvider>
                <PaginationProvider>
                  <ChapterImageProtector>
                    <BackButtonHandler />
                    {children}
                    <StickyAdContainer />
                  </ChapterImageProtector>
                </PaginationProvider>
              </ReadingHistoryProvider>
            </BookmarkProvider>
          </AdProvider>
        </AuthProvider>
      </MaintenanceProvider>
    </SecurityProvider>
  );
};

export default ClientProviders; 