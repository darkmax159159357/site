// This is a custom service worker for caching manga images
self.addEventListener('install', (event) => {
  console.log('Manga reader service worker installed');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('Manga reader service worker activated');
  event.waitUntil(self.clients.claim());
});

// Cache name for manga images
const MANGA_CACHE = 'manga-images-cache-v1';

// Cache manga images on fetch
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Check if this is a manga image request
  // Adjust this check based on your image URL patterns
  if (event.request.method === 'GET' && 
      url.pathname.match(/\.(jpg|jpeg|png|webp|avif)$/) && 
      (url.pathname.includes('/manga/') || url.pathname.includes('/comics/'))) {
    
    event.respondWith(
      cacheFirst(event.request)
    );
  }
});

// Cache-first strategy with network fallback
async function cacheFirst(request) {
  const cache = await caches.open(MANGA_CACHE);
  
  // Try to get from cache
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    // Only cache successful responses
    if (networkResponse.ok) {
      // Clone the response before caching it
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Error fetching manga image:', error);
    // If offline and not in cache, return a fallback image
    return new Response('Image not available offline', { status: 503 });
  }
}

// Periodically clean up old cached images
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_OLD_CACHES') {
    event.waitUntil(cleanOldCaches());
  }
});

async function cleanOldCaches() {
  try {
    const cache = await caches.open(MANGA_CACHE);
    const requests = await cache.keys();
    
    // Keep only recent entries - max 300 images
    if (requests.length > 300) {
      const toDelete = requests.slice(0, requests.length - 300);
      await Promise.all(toDelete.map(request => cache.delete(request)));
      console.log(`Cleaned ${toDelete.length} old images from cache`);
    }
  } catch (error) {
    console.error('Error cleaning cache:', error);
  }
} 