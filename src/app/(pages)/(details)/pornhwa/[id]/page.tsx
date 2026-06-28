import { fetchDetail } from "@/action/fetchKomik";
import NewDetails from "../../manga/[id]/NewDetails";
import siteMetadata from "@/lib/seo/siteMetadata";
import { detailsDataProps } from "../../manga/[id]/dataType";
import { Suspense } from "react";
import LoadingIndicator from "@/components/LoadingIndicator";
import MangaNotFound from "../../manga/[id]/MangaNotFound";
import Script from "next/script";
import { generateMangaSchema } from "@/lib/seo/schemaGenerator";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = params;
  const getData: detailsDataProps["data"] | null = await fetchDetail(id);

  if (!getData) return { title: "Pornhwa Content Not Found | GlintScans" };

  return {
    title: `${getData.title} | GlintScans`,
    description: getData.description || "No description available",
    keywords: [getData.title, "pornhwa", "adult content", "read online", "scanlation", "free manga"],
    openGraph: {
      title: getData.title,
      description: getData.description?.slice(0, 300) || "No description available",
      url: `${siteMetadata.siteUrl}/pornhwa/${id}`,
      images: [
        {
          url: getData.cover || `${siteMetadata.siteUrl}/favicon.png`,
          width: 1200,
          height: 630,
          alt: getData.title,
        }
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: getData.title,
      description: getData.description?.slice(0, 300) || "No description available",
      images: [getData.cover || `${siteMetadata.siteUrl}/favicon.png`],
    },
  };
}

export default async function PornhwaDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const getData: detailsDataProps["data"] | null = await fetchDetail(id);

  if (!getData) {
    return <MangaNotFound id={id} />;
  }

  // Generate schema for this content
  const contentSchema = generateMangaSchema({
    title: getData.title,
    description: getData.description,
    id: id,
    cover: getData.cover,
    genres: getData.genres,
    author: getData.author,
    status: getData.status,
    chapters: getData.chapters
  });

  return (
    <>
      <Script
        id="pornhwa-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contentSchema) }}
      />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A1B1E]">
          <div className="text-center">
            <LoadingIndicator size="large" color="border-orange-500" />
            <p className="text-white mt-4">Loading content details...</p>
          </div>
        </div>
      }>
        <NewDetails dataDetails={getData} />
      </Suspense>
    </>
  );
} 