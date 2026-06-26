import { fetchDetail } from "@/action/fetchKomik";
import siteMetadata from "@/lib/seo/siteMetadata";
import { detailsDataProps } from "./dataType";
import Script from "next/script";
import { generateMangaSchema } from "@/lib/seo/schemaGenerator";
import NewDetails from "./NewDetails";
import MangaNotFound from "./MangaNotFound";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = params;
  const getData: detailsDataProps["data"] | null = await fetchDetail(id);

  if (!getData) return { title: "Manga Not Found | MedusaScans" };

  return {
    title: `${getData.title} | MedusaScans`,
    description: getData.description || "No description available",
    keywords: [getData.title, "manga", "read online", "scanlation", "free manga"],
    openGraph: {
      title: getData.title,
      description: getData.description?.slice(0, 300) || "No description available",
      url: `${siteMetadata.siteUrl}/manga/${id}`,
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

export default async function MangaDetail({ params }: { params: { id: string } }) {
    const { id } = params;
  const getData: detailsDataProps["data"] | null = await fetchDetail(id);

  // If no data, show the not found component
    if (!getData) {
    return <MangaNotFound id={id} />;
  }

  // Generate schema for this manga
  const mangaSchema = generateMangaSchema({
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
        id="manga-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mangaSchema) }}
      />
      <NewDetails dataDetails={getData} />
    </>
  );
}
