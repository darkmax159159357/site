export async function generateMetadata() {
  return {
    title: "Refund Policy | Glint Scans",
    description: "Refund Policy for Glint Scans coin purchases.",
    icons: [{ rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon.png" }],
  };
}

const page = () => {
  return (
    <div className="w-[90%] max-w-4xl sm:w-[85%] m-auto flex flex-col gap-3 mt-8 mb-16">
      <div className="mb-4 flex justify-center">
        <h1 className="bg-[#1e1e24] rounded px-6 py-2 font-medium text-lg sm:text-xl text-gray-200">
          Refund Policy
        </h1>
      </div>
      <p className="text-base text-gray-400 leading-relaxed">
        Coins purchased on <span className="text-gray-300">Glint Scans</span> are a digital good. As
        a rule, completed coin purchases are non-refundable once the coins have been added to your
        account.
      </p>
      <h2 className="text-gray-200 font-medium text-lg sm:text-xl mt-4 border-b border-gray-800 pb-1">
        Exceptions
      </h2>
      <p className="text-base text-gray-400 leading-relaxed">
        If you were charged in error, or coins were not delivered, contact us through our Discord
        community and we will review your case.
      </p>
    </div>
  );
};

export default page;
