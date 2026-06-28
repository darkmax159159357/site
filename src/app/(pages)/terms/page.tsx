export async function generateMetadata() {
  return {
    title: "Terms of Service | Glint Scans",
    description: "Terms of Service for Glint Scans.",
    icons: [{ rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon.png" }],
  };
}

const page = () => {
  return (
    <div className="w-[90%] max-w-4xl sm:w-[85%] m-auto flex flex-col gap-3 mt-8 mb-16">
      <div className="mb-4 flex justify-center">
        <h1 className="bg-[#1e1e24] rounded px-6 py-2 font-medium text-lg sm:text-xl text-gray-200">
          Terms of Service
        </h1>
      </div>
      <p className="text-base text-gray-400 leading-relaxed">
        By using <span className="text-gray-300">Glint Scans</span>, you agree to these terms. The
        comics shown here are previews intended to help readers discover series; please support the
        original creators and publishers wherever possible.
      </p>
      <h2 className="text-gray-200 font-medium text-lg sm:text-xl mt-4 border-b border-gray-800 pb-1">
        Acceptable Use
      </h2>
      <p className="text-base text-gray-400 leading-relaxed">
        You agree not to abuse, scrape, or disrupt the service, and to use it only for personal,
        non-commercial reading.
      </p>
      <h2 className="text-gray-200 font-medium text-lg sm:text-xl mt-4 border-b border-gray-800 pb-1">
        Changes
      </h2>
      <p className="text-base text-gray-400 leading-relaxed">
        We may update these terms from time to time. Continued use of the site means you accept the
        latest version.
      </p>
    </div>
  );
};

export default page;
