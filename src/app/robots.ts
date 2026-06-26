import { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/manga/", "/r19/", "/pornhwa/", "/read/", "/genre/", "/tag/", "/latestupdated/"],
        disallow: [
          "/auth/*",          // Auth pages
          "/api/*",           // API routes
          "/profile/*",       // User profile routes
          "/settings/*",      // User settings routes
          "/notifications/*", // Notification routes
          "/_next/*",         // Next.js internal routes
          "/static/*",        // Static files
          "/images/*",        // Image files
          "/favicon.ico",     // Favicon
        ]
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/manga/", "/r19/", "/pornhwa/", "/read/", "/genre/", "/tag/", "/latestupdated/"],
        disallow: [
          "/auth/*",
          "/api/*",
          "/profile/*",
          "/settings/*",
          "/notifications/*",
          "/_next/*",
          "/static/*",
        ]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
