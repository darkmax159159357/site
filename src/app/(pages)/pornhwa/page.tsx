import BreadcumbPath from "@/components/ui/BreadcumbPath";
import { fetchPornhwa } from "@/action/genreFilters";
import Navbar from "@/components/Navbar";
import siteMetadata from "@/lib/seo/siteMetadata";
import PornhwaClient from "./PornhwaClient";

export async function generateMetadata() {
  return {
    title: `Pornhwa Content | ${siteMetadata.title}`,
    description: "Adult Korean comics on Glint Scans",
    icons: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/favicon.png",
      },
    ],
    openGraph: {
      title: `Pornhwa Content | ${siteMetadata.title}`,
      description: "Adult Korean comics on Glint Scans",
      url: siteMetadata.siteUrl,
      siteName: siteMetadata.title,
      images: [siteMetadata.socialBanner],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Pornhwa Content | ${siteMetadata.title}`,
      description: "Adult Korean comics on Glint Scans",
      images: [siteMetadata.socialBanner],
    },
  };
}

export default function Page() {
  return <PornhwaClient />;
} 