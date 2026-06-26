'use client';

import { SidebarAd, WidgetAd, StickyAd } from './AdPositions';

export function SidebarAdsContainer() {
  return (
    <div className="flex flex-col gap-4">
      <SidebarAd />
      <WidgetAd />
    </div>
  );
}

export function StickyAdContainer() {
  return <StickyAd />;
} 