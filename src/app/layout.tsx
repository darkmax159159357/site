import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import '../styles/responsive.css';
import '../styles/animations.css';
const inter = Inter({ subsets: ["latin"] });
import { Toaster } from "react-hot-toast";
import { HandleOnComplete } from "@/lib/router-events";
import siteMetadata from "@/lib/seo/siteMetadata";
import ClientProviders from "@/components/ClientProviders";
import Navbar from "@/components/Navbar";
import Script from "next/script";
import { getBaseUrl } from "@/lib/env";

// Use environment helper to get base URL
const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    template: `%s | ${siteMetadata.title}`,
    default: siteMetadata.title,
  },
  description: siteMetadata.description,
  manifest: "/manifest.webmanifest",
  verification: {
    google: "GwF-YCVfOWL8weGH0D33e6ZX4vdqT96S_9BnHQ7590A",
  },
  keywords:
    "Medusa Scans, medusascans, manga, manhwa, webtoon, adult comics, r19, pornhwa, manga online, free manga, read manga online",
  icons: [
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      url: "/favicon.png",
    },
    {
      rel: "apple-touch-icon",
      type: "image/png",
      sizes: "180x180",
      url: "/favicon.png",
    },
  ],
  alternates: {
    canonical: baseUrl,
    languages: {
      "id-ID": `${baseUrl}/id-ID`,
      "en-US": `${baseUrl}/en-US`,
    },
  },
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: baseUrl,
    siteName: siteMetadata.title,
    images: [
      {
        url: `${baseUrl}/favicon.png`,
        width: 1200,
        height: 630,
        alt: siteMetadata.title,
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteMetadata.title,
    description: siteMetadata.description,
    images: [`${baseUrl}/favicon.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href={`${baseUrl}/`} />
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: siteMetadata.title,
              url: baseUrl,
              description: siteMetadata.description,
              publisher: {
                "@type": "Organization",
                name: siteMetadata.title,
                logo: {
                  "@type": "ImageObject",
                  url: `${baseUrl}/favicon.png`
                }
              },
              potentialAction: {
                "@type": "SearchAction",
                target: `${baseUrl}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ClientProviders>
          <Navbar />
          {children}
          <Toaster
            position="top-center"
            gutter={10}
            toastOptions={{
              duration: 3500,
              style: {
                background: "#18181b",
                color: "#f4f4f5",
                border: "1px solid #27272a",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "14px",
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.6)",
              },
              success: {
                iconTheme: { primary: "#22c55e", secondary: "#18181b" },
                style: { border: "1px solid rgba(34,197,94,0.35)" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#18181b" },
                style: { border: "1px solid rgba(239,68,68,0.35)" },
              },
              loading: {
                iconTheme: { primary: "#f97316", secondary: "#18181b" },
              },
            }}
          />
        </ClientProviders>
        <HandleOnComplete />
      </body>
    </html>
  );
}
