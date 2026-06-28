export async function generateMetadata() {
  return {
    title: "Privacy Policy | Glint Scans",
    description: "Privacy Policy for Glint Scans.",
    icons: [{ rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon.png" }],
  };
}

const page = () => {
  return (
    <div className="w-[90%] max-w-4xl sm:w-[85%] m-auto flex flex-col gap-3 mt-8 mb-16">
      <div className="mb-4 flex justify-center">
        <h1 className="bg-[#1e1e24] rounded px-6 py-2 font-medium text-lg sm:text-xl text-gray-200">
          Privacy Policy
        </h1>
      </div>
      <p className="text-base text-gray-400 leading-relaxed">
        At <span className="text-gray-300">Glint Scans</span> we respect your privacy. This page
        explains, in simple terms, what limited information we handle and how it is used.
      </p>
      <h2 className="text-gray-200 font-medium text-lg sm:text-xl mt-4 border-b border-gray-800 pb-1">
        Information We Collect
      </h2>
      <p className="text-base text-gray-400 leading-relaxed">
        We only store the data needed to provide the service — such as your account details and
        reading progress when you sign in. We do not sell your personal information.
      </p>
      <h2 className="text-gray-200 font-medium text-lg sm:text-xl mt-4 border-b border-gray-800 pb-1">
        Contact
      </h2>
      <p className="text-base text-gray-400 leading-relaxed">
        For any privacy questions, please reach us through our community on Discord.
      </p>
    </div>
  );
};

export default page;
