import BlogPosts2 from "@/components/BlogPosts2";

export async function generateMetadata() {
  return {
    title: "Announcements | Glint Scans",
    description: "Latest announcements and updates from Glint Scans.",
    icons: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/favicon.png",
      },
    ],
  };
}

// Full announcements list — reuses the same Firestore-backed component as the
// homepage section, with variant="page" (no "View all" link, never collapses).
const page = () => {
  return (
    <main className="min-h-[60vh] mt-6 sm:mt-10 mb-24">
      <BlogPosts2 variant="page" />
    </main>
  );
};

export default page;
