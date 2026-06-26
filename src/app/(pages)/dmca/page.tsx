

export async function generateMetadata() {
  return {
    title: "DMCA Policy | Medusa Scans",
    description: "DMCA Policy and copyright information for Medusa Scans",
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
    <>
      <div className="w-[90%] max-w-4xl sm:w-[85%] m-auto flex flex-col gap-2 mt-8 mb-16">
        <div className="mb-6 flex justify-center">
          <h1 className="bg-[#1e1e24] rounded px-6 py-2 font-medium text-lg sm:text-xl text-gray-200">
            DMCA Policy
          </h1>
        </div>

        {/* Terms of Service Section */}
        <h2 className="text-gray-200 font-medium text-lg sm:text-xl mt-4 border-b border-gray-800 pb-1">
          Terms of Service
        </h2>
        
        <h3 className="font-medium text-base sm:text-lg text-gray-300 mt-3">
          Ability to Accept Terms of Service
        </h3>
        <p className="text-base text-gray-400 leading-relaxed">
          By using <span className="text-gray-300">Medusa Scans</span>, you affirm that you are at least <span className="text-gray-300">13 years of age</span> and are competent to accept and comply with these Terms of Service. If you are under <span className="text-gray-300">13</span>, please refrain from using our services. This platform is <span className="text-gray-300">not intended for minors below this age</span>.
        </p>
        
        <h3 className="font-medium text-base sm:text-lg text-gray-300 mt-4">
          General Use of the Service
        </h3>
        <p className="text-base text-gray-400 leading-relaxed">
          When using <span className="text-gray-300">Medusa Scans</span>, you join a global community of users. We have established the following guidelines to ensure a <span className="text-gray-300">positive and enjoyable experience</span> for all users. Please adhere to these rules, and if you see content that violates these terms, report it through the provided channels.
        </p>
        
        <ul className="list-disc pl-5 sm:pl-6 mt-2 space-y-1.5">
          <li className="text-gray-400 text-base">
            <span className="text-gray-300">Spam & Deceptive Practices:</span> Content that misleads, scams, or spams users is strictly prohibited.
          </li>
          <li className="text-gray-400 text-base">
            <span className="text-gray-300">Sensitive Content:</span> We aim to protect our users, especially minors. Explicit content, including <span className="text-gray-300">pornography or hentai</span>, is not allowed on Medusa Scans.
          </li>
          <li className="text-gray-400 text-base">
            <span className="text-gray-300">Spoiler Content:</span> Content revealing major plot elements or spoilers without warnings is discouraged to maintain a positive user experience.
          </li>
          <li className="text-gray-400 text-base">
            <span className="text-gray-300">Violent or Dangerous Content:</span> Any form of hate speech, violence, predatory behavior, or content promoting harm is forbidden.
          </li>
          <li className="text-gray-400 text-base">
            <span className="text-gray-300">Misinformation:</span> Deliberate misinformation or deceptive content that could cause <span className="text-gray-300">real-world harm</span> is prohibited.
          </li>
        </ul>
        
        {/* DMCA Section */}
        <h2 className="text-gray-200 font-medium text-lg sm:text-xl mt-6 border-b border-gray-800 pb-1">
          DMCA Takedown Request Requirements
        </h2>
        <p className="text-base text-gray-400 leading-relaxed mt-3">
          We take the <span className="text-gray-300">intellectual property rights</span> of others seriously. If you believe that material on <span className="text-gray-300">Medusa Scans</span> infringes upon your copyright, you may file a <span className="text-gray-300">DMCA request</span> with our designated agent as described below. We will promptly review your claim and take the appropriate actions, including removing the infringing content if necessary.
        </p>
        
        <h3 className="font-medium text-base sm:text-lg text-gray-300 mt-4">
          DMCA Report Requirements
        </h3>
        
        <ol className="list-decimal pl-5 sm:pl-6 mt-2 space-y-2">
          <li className="text-gray-400 text-base">
            <span className="text-gray-300">Identify the copyrighted work</span> that you claim has been infringed or provide a representative list if multiple works are involved.
          </li>
          <li className="text-gray-400 text-base">
            <span className="text-gray-300">Identify the material or link</span> that you claim is infringing, including the <span className="text-gray-300">URL or location</span> where the material may be found.
          </li>
          <li className="text-gray-400 text-base">
            <span className="text-gray-300">Provide your full contact information</span> (name, address, telephone number, and email address).
          </li>
          <li className="text-gray-400 text-base">
            Include both of the following statements in your Notice:
            <ul className="list-disc pl-5 mt-1.5 space-y-1.5">
              <li className="text-gray-400 text-base italic">
                &ldquo;I have a good faith belief that the use of the copyrighted material I am complaining of is not authorized by the copyright owner, its agent, or the law.&rdquo;
              </li>
              <li className="text-gray-400 text-base italic">
                &ldquo;The information in this notice is accurate, and under penalty of perjury, I am the owner, or authorized to act on behalf of the owner, of the copyright or exclusive right that is allegedly infringed.&rdquo;
              </li>
            </ul>
          </li>
          <li className="text-gray-400 text-base">
            <span className="text-gray-300">Provide your full legal name</span> and an electronic or physical signature.
          </li>
        </ol>
      </div>
    </>
  );
};

export default page;
