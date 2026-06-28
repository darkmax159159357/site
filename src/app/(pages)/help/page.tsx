export async function generateMetadata() {
  return {
    title: "Help & Support | Glint Scans",
    description: "Help and support for Glint Scans.",
    icons: [{ rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon.png" }],
  };
}

const page = () => {
  return (
    <div className="w-[90%] max-w-4xl sm:w-[85%] m-auto flex flex-col gap-3 mt-8 mb-16">
      <div className="mb-4 flex justify-center">
        <h1 className="bg-[#1e1e24] rounded px-6 py-2 font-medium text-lg sm:text-xl text-gray-200">
          Help &amp; Support
        </h1>
      </div>
      <p className="text-base text-gray-400 leading-relaxed">
        Need a hand? Most questions about reading, accounts and coins are answered fastest in our
        community.
      </p>
      <h2 className="text-gray-200 font-medium text-lg sm:text-xl mt-4 border-b border-gray-800 pb-1">
        Get in touch
      </h2>
      <p className="text-base text-gray-400 leading-relaxed">
        Join our{" "}
        <a
          href="https://discord.gg/2Ssehz7GNa"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#FF7F57] hover:text-[#ff6a3d] transition-colors"
        >
          Discord server
        </a>{" "}
        for support, announcements and updates.
      </p>
    </div>
  );
};

export default page;
