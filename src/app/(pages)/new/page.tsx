import UpdatesGridPage from "@/components/UpdatesGridPage";

export async function generateMetadata() {
  return {
    title: "New Series | Glint Scans",
    description: "The newest series on Glint Scans.",
    icons: [{ rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon.png" }],
  };
}

const Page = () => <UpdatesGridPage title="New Series" mode="new" />;

export default Page;
