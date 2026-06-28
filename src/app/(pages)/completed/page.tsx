import CompletedGrid from "@/components/CompletedGrid";

export async function generateMetadata() {
  return {
    title: "Complete Collection | Glint Scans",
    description: "Browse all completed manga, manhwa and webtoons on Glint Scans.",
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

const page = () => {
  return (
    <main className="min-h-[60vh] mt-6 sm:mt-10 mb-24">
      <CompletedGrid />
    </main>
  );
};

export default page;
