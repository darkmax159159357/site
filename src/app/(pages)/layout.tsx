import Footer from "@/components/Footer";
import { BeforeContent1, BeforeContent2 } from '@/components/ads/AdPositions';

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <Footer />
    </>
  );
};

export default layout;
