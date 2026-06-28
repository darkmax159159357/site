import BreadcumbPath from "@/components/ui/BreadcumbPath";
import { fetchR19Manga } from "@/action/genreFilters";
import Navbar from "@/components/Navbar";
import siteMetadata from "@/lib/seo/siteMetadata";
import R19Client from "./R19Client";

export async function generateMetadata() {
  return {
    title: `R19 Content | ${siteMetadata.title}`,
    description: "Adult content with age restrictions on Glint Scans",
    icons: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/favicon.png",
      },
    ],
    openGraph: {
      title: `R19 Content | ${siteMetadata.title}`,
      description: "Adult content with age restrictions on Glint Scans",
      url: siteMetadata.siteUrl,
      siteName: siteMetadata.title,
      images: [siteMetadata.socialBanner],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `R19 Content | ${siteMetadata.title}`,
      description: "Adult content with age restrictions on Glint Scans",
      images: [siteMetadata.socialBanner],
    },
  };
}

export default function Page() {
  return <R19Client />;
} 