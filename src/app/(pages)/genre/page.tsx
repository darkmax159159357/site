import BreadcumbPath from "@/components/ui/BreadcumbPath";
import { fetchAllMangaWithGenres } from "@/action/genreFilters";
import Navbar from "@/components/Navbar";
import siteMetadata from "@/lib/seo/siteMetadata";
import GenreClient from "./GenreClient";

export async function generateMetadata() {
  return {
    title: `Browse by Genre | ${siteMetadata.title}`,
    description: "Explore manga, manhwa, and manhua by genre on Medusa Scans",
    icons: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/favicon.png",
      },
    ],
    openGraph: {
      title: `Browse by Genre | ${siteMetadata.title}`,
      description: "Explore manga, manhwa, and manhua by genre on Medusa Scans",
      url: siteMetadata.siteUrl,
      siteName: siteMetadata.title,
      images: [siteMetadata.socialBanner],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Browse by Genre | ${siteMetadata.title}`,
      description: "Explore manga, manhwa, and manhua by genre on Medusa Scans",
      images: [siteMetadata.socialBanner],
    },
  };
}

export default function Page() {
  return <GenreClient />;
} 