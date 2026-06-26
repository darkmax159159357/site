import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function BookmarksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
} 