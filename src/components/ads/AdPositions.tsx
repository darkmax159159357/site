'use client';

import AdSlot from './AdSlot';
import { useAds } from '@/contexts/AdContext';

// Helper to safely get ad code
const getAdCode = (adConfig: any, slotName: string) => {
  if (!adConfig || !adConfig.adSlots) return '';
  return adConfig.adSlots[slotName] || '';
};

// Before Content ads (after Hero Slider and Trending)
export function BeforeContent1() {
  const { adConfig, isLoading } = useAds();
  if (isLoading || !adConfig) return null;
  return <AdSlot adCode={getAdCode(adConfig, 'beforeContent1')} className="my-4" id="ad-before-content-1" />;
}

export function BeforeContent2() {
  const { adConfig, isLoading } = useAds();
  if (isLoading || !adConfig) return null;
  return <AdSlot adCode={getAdCode(adConfig, 'beforeContent2')} className="my-4" id="ad-before-content-2" />;
}

// In Content ads
export function Content1() {
  const { adConfig, isLoading } = useAds();
  if (isLoading || !adConfig) return null;
  return <AdSlot adCode={getAdCode(adConfig, 'content1')} className="my-4" id="ad-content-1" />;
}

export function Content2() {
  const { adConfig, isLoading } = useAds();
  if (isLoading || !adConfig) return null;
  return <AdSlot adCode={getAdCode(adConfig, 'content2')} className="my-4" id="ad-content-2" />;
}

// After Content ads
export function AfterContent1() {
  const { adConfig, isLoading } = useAds();
  if (isLoading || !adConfig) return null;
  return <AdSlot adCode={getAdCode(adConfig, 'afterContent1')} className="my-4" id="ad-after-content-1" />;
}

export function AfterContent2() {
  const { adConfig, isLoading } = useAds();
  if (isLoading || !adConfig) return null;
  return <AdSlot adCode={getAdCode(adConfig, 'afterContent2')} className="my-4" id="ad-after-content-2" />;
}

// Sidebar and Widget ads
export function SidebarAd() {
  const { adConfig, isLoading } = useAds();
  if (isLoading || !adConfig) return null;
  return <AdSlot adCode={getAdCode(adConfig, 'sidebar')} className="my-4" id="ad-sidebar" />;
}

export function WidgetAd() {
  const { adConfig, isLoading } = useAds();
  if (isLoading || !adConfig) return null;
  return <AdSlot adCode={getAdCode(adConfig, 'widget')} className="my-4" id="ad-widget" />;
}

// Sticky ad
export function StickyAd() {
  const { adConfig, isLoading } = useAds();
  if (isLoading || !adConfig) return null;
  
  return (
    <div className="fixed bottom-0 left-0 w-full z-50">
      <AdSlot adCode={getAdCode(adConfig, 'sticky')} className="sticky-ad" id="ad-sticky" />
    </div>
  );
} 