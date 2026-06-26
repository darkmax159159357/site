import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'

// Note: The protected routes authentication is now handled by client-side components
// through the AuthContext rather than in middleware to work with Firebase Auth

// Cache common patterns for performance
const MANGA_CHAPTER_REGEX = /\/(?:Medusa\/)?manga\/([^\/]+)\/chapter-([^\/]+)\//;
const IMAGE_REQUEST_REGEX = /\.(jpe?g|png|gif|webp|avif)$/i;
const CHAPTER_IMAGE_REGEX = /\/Medusa\/manga\/[^\/]+\/chapter-\d+\/.*\.(jpe?g|png|gif|webp|avif)$/i;

// Helper function to extract chapter info from path - optimized for performance
function extractChapterInfoFromPath(pathname: string): { mangaId: string, chapterNum: string } | null {
  // Match patterns like:
  // /Medusa/manga/manga-id/chapter-1/image.jpg
  // /public/Medusa/manga/manga-id/chapter-1/image.jpg
  
  const match = pathname.match(MANGA_CHAPTER_REGEX);
  
  if (match && match.length >= 3) {
    return {
      mangaId: match[1],
      chapterNum: match[2]
    };
  }
  
  return null;
}

// Check if the request is coming from a valid reader page or is a valid reader request
function isValidReaderRequest(req: NextRequest): boolean {
  const referer = req.headers.get('referer') || '';
  const origin = req.headers.get('origin') || '';
  
  // First check if it's from a reader page - this handles most legitimate cases
  if (referer.includes('/read/')) {
    return true;
  }
  
  // Check for fetch requests from the same origin
  if (origin && (
      origin === req.nextUrl.origin || 
      origin.includes('localhost') || 
      origin.includes('medusascans.org')
  )) {
    return true;
  }
  
  // For image viewing in the reader, we need to allow these
  const requestingUrl = req.nextUrl.pathname;
  if (requestingUrl.includes('/read/') || requestingUrl.includes('/api/')) {
    return true;
  }

  console.log('Blocked request from:', referer, 'to:', requestingUrl);
  
  return false;
}

// This function can be marked `async` if using `await` inside
export async function middleware(req: NextRequest) {
  // Always force HTTPS except for localhost
  const host = req.headers.get('host') || '';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  
  if (!isLocalhost && req.nextUrl.protocol === 'http:') {
    const url = req.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url);
  }

  const { pathname } = req.nextUrl;
  
  // Skip middleware for reader pages
  if (pathname.startsWith('/read/')) {
    return NextResponse.next();
  }
  
  // Check if this is a legitimate reader request
  const isReader = isValidReaderRequest(req);
  
  // For chapter image access, allow if from reader, otherwise protect
  if (CHAPTER_IMAGE_REGEX.test(pathname)) {
    // If it's a valid reader request, allow it through
    if (isReader) {
      return NextResponse.next();
    }
    
    console.log('Blocking direct chapter image access:', pathname);
    
    // Extract chapter info
    const chapterInfo = extractChapterInfoFromPath(pathname);
    if (chapterInfo) {
      const { mangaId, chapterNum } = chapterInfo;
      
      // Extract filename from path
      const pathParts = pathname.split('/');
      const file = pathParts[pathParts.length - 1];
      
      // Redirect to chapter page instead of blocking
      const protocol = isLocalhost ? 'http:' : 'https:';
      const host = req.headers.get('host') || req.nextUrl.host;
      return NextResponse.redirect(
        new URL(`${protocol}//${host}/read/${mangaId}-ch${chapterNum}`)
      );
    }
    
    // If we can't extract info, just block access
    return new NextResponse('Access Denied', { status: 403 });
  }
  
  // Skip middleware for static assets to improve performance
  if (pathname.match(IMAGE_REQUEST_REGEX) && 
      !pathname.includes('/Medusa/') && 
      !pathname.startsWith('/manga/') && 
      (pathname.startsWith('/_next/') || 
       pathname.startsWith('/static/'))) {
    return NextResponse.next();
  }
  
  // Process API routes normally
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Aggressive protection for directory listing, especially in development
  if ((pathname.startsWith('/Medusa/') || pathname.startsWith('/public/Medusa/')) && 
      (pathname.endsWith('/') || !pathname.includes('.'))) {
    console.log('Blocking directory access attempt:', pathname);
    return new NextResponse('Directory access denied', { status: 403 });
  }

  // Handle direct access to Medusa/* paths (manga content)
  if (pathname.startsWith('/Medusa/')) {
    // Allow if from reader
    if (isReader) {
      return NextResponse.next();
    }
    
    // Block directory access - if request doesn't end with a file extension, it's likely a directory listing
    const pathParts = pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    const hasFileExtension = lastPart.includes('.') && !lastPart.endsWith('/');
    
    // Block any path that doesn't have a file extension (likely directory browsing)
    if (!hasFileExtension) {
      console.log('Blocking Medusa access - not a file:', pathname);
      return new NextResponse('Access Denied', { status: 403 });
    }
    
    // Block direct access to JSON files — EXCEPT the public manga catalog
    // (manga.json), which homepage components fetch directly to render the lists.
    if (pathname.endsWith('.json') && !pathname.endsWith('/manga/manga.json')) {
      console.log('Blocking direct JSON access:', pathname);
      return new NextResponse('Access Denied', { status: 403 });
    }
    
    // Block direct access to image files in manga directories
    if (pathname.includes('/manga/') && pathname.match(IMAGE_REQUEST_REGEX)) {
      console.log('Blocking direct image access:', pathname);
      
      // Extract chapter info if available
      const chapterInfo = extractChapterInfoFromPath(pathname);
      if (chapterInfo) {
        const { mangaId, chapterNum } = chapterInfo;
        const chapterId = `${mangaId}-ch${chapterNum}`;
        
        // Redirect to chapter page to force client-side lock checking
        const protocol = isLocalhost ? 'http:' : 'https:';
        const host = req.headers.get('host') || req.nextUrl.host;
        return NextResponse.redirect(new URL(`${protocol}//${host}/read/${chapterId}`));
      }
      
      // If not a chapter image, just block access
      return new NextResponse('Image access denied', { status: 403 });
    }
    
    // For direct access to Medusa paths, check if it's trying to access chapter content
    // Pattern: /Medusa/manga/{mangaId}/chapter-{number}/...
    if (pathParts.length >= 5 && 
        pathParts[1] === 'manga' && 
        pathParts[3]?.startsWith('chapter-')) {
      
      const mangaId = pathParts[2];
      const chapterNum = pathParts[3].replace('chapter-', '');
      const chapterId = `${mangaId}-ch${chapterNum}`;
      
      // Always redirect to the chapter page to force client-side lock checking
      const protocol = isLocalhost ? 'http:' : 'https:';
      const host = req.headers.get('host') || req.nextUrl.host;
      return NextResponse.redirect(new URL(`${protocol}//${host}/read/${chapterId}`));
    }
    
    return NextResponse.next();
  }

  // Check for direct access to chapter images in other paths - optimized check
  if (pathname.includes('/manga/') && pathname.includes('/chapter-')) {
    // Allow if from reader
    if (isReader) {
      return NextResponse.next();
    }
    
    // Block directory access attempts here too
    const pathParts = pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    const hasFileExtension = lastPart.includes('.') && !lastPart.endsWith('/');
    
    if (!hasFileExtension) {
      console.log('Blocking manga directory access attempt:', pathname);
      return new NextResponse('Access Denied', { status: 403 });
    }
    
    const chapterInfo = extractChapterInfoFromPath(pathname);
    
    if (chapterInfo) {
      const { mangaId, chapterNum } = chapterInfo;
      const chapterId = `${mangaId}-ch${chapterNum}`;
      
      // Redirect to chapter page to ensure lock checks happen
      const protocol = isLocalhost ? 'http:' : 'https:';
      const host = req.headers.get('host') || req.nextUrl.host;
      return NextResponse.redirect(new URL(`${protocol}//${host}/read/${chapterId}`));
    }
  }

  // Special handling for auth paths if needed
  if (pathname.startsWith('/auth/')) {
    console.log('Auth path detected');
    return NextResponse.next();
  }

  // Continue the request for all other paths
  return NextResponse.next();
}

// Configure the middleware to run on specific paths - optimized patterns
export const config = {
  matcher: [
    // Match all manga paths
    '/manga/:path*',
    // Match all read paths
    '/read/:path*',
    // Match direct Medusa directory access
    '/Medusa/:path*',
    // Match auth paths
    '/auth/:path*',
    // Match any paths with manga chapter patterns
    '/:path*/chapter-:chapterNum/:file*',
  ],
};
