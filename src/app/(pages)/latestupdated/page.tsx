import UpdatesGridPage from "@/components/UpdatesGridPage";

export async function generateMetadata() {
  return {
    title: "Latest Updated | Glint Scans",
    description: "The most recently updated manga, manhwa and webtoons on Glint Scans.",
    icons: [{ rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon.png" }],
  };
}

const Page = () => <UpdatesGridPage title="Latest Updated" mode="latest" />;

export default Page;
