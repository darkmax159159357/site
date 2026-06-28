/**
 * Generate JSON-LD schema for different content types
 */

import siteMetadata from './siteMetadata';

/**
 * Generate schema for manga content
 */
export function generateMangaSchema(manga: {
  title: string;
  description?: string;
  id: string;
  cover?: string;
  genres?: string[];
  author?: string;
  status?: string;
  chapters?: any[];
}) {
  const baseUrl = siteMetadata.siteUrl;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: manga.title,
    description: manga.description || `Read ${manga.title} online for free on Glint Scans.`,
    url: `${baseUrl}/manga/${manga.id}`,
    image: manga.cover || `${baseUrl}/favicon.png`,
    publisher: {
      '@type': 'Organization',
      name: siteMetadata.title,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/favicon.png`
      }
    },
    author: manga.author ? {
      '@type': 'Person',
      name: manga.author
    } : undefined,
    genre: manga.genres?.join(', '),
    bookFormat: 'GraphicNovel',
    potentialAction: {
      '@type': 'ReadAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/manga/${manga.id}`
      }
    }
  };
}

/**
 * Generate schema for chapter content
 */
export function generateChapterSchema(chapter: {
  mangaTitle: string;
  mangaId: string;
  chapterTitle: string;
  chapterId: string;
  cover?: string;
  description?: string;
}) {
  const baseUrl = siteMetadata.siteUrl;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Chapter',
    name: `${chapter.mangaTitle} - ${chapter.chapterTitle}`,
    description: chapter.description || `Read ${chapter.mangaTitle} ${chapter.chapterTitle} online for free on Glint Scans.`,
    url: `${baseUrl}/read/${chapter.chapterId}`,
    image: chapter.cover || `${baseUrl}/favicon.png`,
    isPartOf: {
      '@type': 'Book',
      name: chapter.mangaTitle,
      url: `${baseUrl}/manga/${chapter.mangaId}`
    },
    publisher: {
      '@type': 'Organization',
      name: siteMetadata.title,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/favicon.png`
      }
    }
  };
}

/**
 * Generate website schema
 */
export function generateWebsiteSchema() {
  const baseUrl = siteMetadata.siteUrl;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteMetadata.title,
    url: baseUrl,
    description: siteMetadata.description,
    publisher: {
      '@type': 'Organization',
      name: siteMetadata.title,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/favicon.png`
      }
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

export default {
  generateMangaSchema,
  generateChapterSchema,
  generateWebsiteSchema
}; 