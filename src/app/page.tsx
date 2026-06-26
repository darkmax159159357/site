import siteMetadata from "@/lib/seo/siteMetadata";
import Homepage from "./Homepage";
import Script from "next/script";
import { generateWebsiteSchema } from "@/lib/seo/schemaGenerator";

export async function generateMetadata() {
  return {
    title: siteMetadata.title,
    description: siteMetadata.description,
    icons: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/favicon.png",
      },
    ],
    openGraph: {
      title: siteMetadata.title,
      description: siteMetadata.description,
      url: siteMetadata.siteUrl,
      siteName: siteMetadata.title,
      images: [
        {
          url: `${siteMetadata.siteUrl}/favicon.png`,
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
      images: [`${siteMetadata.siteUrl}/favicon.png`],
    },
  };
}

export default function Home() {
  const websiteSchema = generateWebsiteSchema();
  
  return (
    <>
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Homepage />
    </>
  );
}
