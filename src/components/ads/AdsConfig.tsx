'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { useAds } from '@/contexts/AdContext';

export function AdsHeadConfig() {
  const { adConfig, isLoading } = useAds();

  // If still loading the config, don't render anything yet
  if (isLoading || !adConfig) return null;

  // Add AdSense script if available
  const adsenseScript = adConfig.adsense ? (
    <Script
      id="google-adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?${adConfig.adsense}`}
      strategy="afterInteractive"
    />
  ) : null;

  // Add Analytics script if available
  const analyticsScript = adConfig.analytics ? (
    <Script
      id="google-analytics"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: adConfig.analytics
      }}
    />
  ) : null;

  // Add custom head content if available
  const headContent = adConfig.head ? (
    <Script
      id="custom-head-content"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: adConfig.head
      }}
    />
  ) : null;

  return (
    <>
      {adsenseScript}
      {analyticsScript}
      {headContent}
    </>
  );
}

// API route handler for ads.txt
// This will be implemented as a separate route handler 