"use client";
import React from 'react';
import { DiscussionEmbed } from 'disqus-react';

interface DisqusCommentsProps {
  identifier: string;
  title: string;
  url: string;
  category?: string;
}

const DisqusComments: React.FC<DisqusCommentsProps> = ({ 
  identifier, 
  title, 
  url,
  category
}) => {
  // Replace 'your-disqus-shortname' with your actual Disqus shortname
  const disqusShortname = 'medusascans';
  
  const disqusConfig = {
    url: url,
    identifier: identifier,
    title: title,
    category_id: category,
  };

  return (
    <div className="w-full bg-black py-4">
      <div className="max-w-screen-xl mx-auto">
        <div className="bg-[#222222] rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-white">Comments</h3>
          <DiscussionEmbed
            shortname={disqusShortname}
            config={disqusConfig}
          />
        </div>
      </div>
    </div>
  );
};

export default DisqusComments; 