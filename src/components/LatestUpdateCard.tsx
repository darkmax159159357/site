import Image from "next/image";
import { MotionDiv } from "./motion/MotionDiv";
import NavLink from "./navlink/NavLink";
import Link from "next/link";
import { LatestUpdateType } from "@/types/latestUpdateType";

const variant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// Function to get relative time
const getRelativeTime = (chapter: any) => {
  try {
    if (!chapter || typeof chapter !== 'object') {
      return 'Recently added';
    }

    // Get the added_chap_date field
    const dateString = chapter.added_chap_date;
    if (!dateString) {
        return 'Recently added';
      }
      
    // Parse the date - format is "09-06-2025 10:00 pm"
    // Let's handle this format specifically
    const dateParts = dateString.split(' ');
    if (dateParts.length < 2) {
      return dateString; // Return the raw string if we can't parse it
    }

    // Parse date part: "09-06-2025"
    const dateComponents = dateParts[0].split('-');
    if (dateComponents.length !== 3) {
      return dateString;
    }

    const day = parseInt(dateComponents[0]);
    const month = parseInt(dateComponents[1]) - 1; // Months are 0-indexed
    const year = parseInt(dateComponents[2]);

    // Parse time part: "10:00"
    const timeParts = dateParts[1].split(':');
    if (timeParts.length !== 2) {
      return dateString;
    }
    
    let hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    
    // Adjust for PM
    const isPM = dateParts[2]?.toLowerCase() === 'pm';
    if (isPM && hour < 12) {
      hour += 12;
    }
    
    // Create date object
    const date = new Date(year, month, day, hour, minute);
    
    // Check if date is valid
      if (isNaN(date.getTime())) {
      return dateString;
      }
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
    if (diffInSeconds < 0) {
      // Future date, just return the formatted date
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } else if (diffInSeconds < 60) {
        return 'Just now';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 172800) { // Less than 2 days (48 hours)
      return '1 day ago';
      } else {
      // Format as MMM D, YYYY (Apr 8, 2025)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
  } catch (error) {
    return 'Recently added';
  }
};

// Function to check if a chapter is new (less than 24 hours old)
const isNewChapter = (chapter: any) => {
  try {
    if (!chapter || typeof chapter !== 'object') {
      return false;
    }

    // Get the added_chap_date field - this is our primary date field
    const dateString = chapter.added_chap_date;
    if (!dateString) {
      return false;
    }

    // Parse the date - format is "09-06-2025 10:00 pm"
    // Let's handle this format specifically
    const dateParts = dateString.split(' ');
    if (dateParts.length < 2) {
      return false;
    }

    // Parse date part: "09-06-2025"
    const dateComponents = dateParts[0].split('-');
    if (dateComponents.length !== 3) {
      return false;
    }

    const day = parseInt(dateComponents[0]);
    const month = parseInt(dateComponents[1]) - 1; // Months are 0-indexed
    const year = parseInt(dateComponents[2]);

    // Parse time part: "10:00"
    const timeParts = dateParts[1].split(':');
    if (timeParts.length !== 2) {
      return false;
    }
    
    let hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    
    // Adjust for PM
    const isPM = dateParts[2]?.toLowerCase() === 'pm';
    if (isPM && hour < 12) {
      hour += 12;
    }
    
    // Create date object
    const date = new Date(year, month, day, hour, minute);
    
    // Check if date is valid
      if (isNaN(date.getTime())) {
      return false;
      }
      
    // Check if it's less than 24 hours old
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      return diffInHours < 24;
  } catch (error) {
    return false; // Any error means it's not new
  }
};

const LatestUpdateCard = ({
  data,
  index,
}: {
  data: LatestUpdateType;
  index: number;
}) => {
  const title =
    data.title.length > 18 ? data.title.substring(0, 18) + "..." : data.title;

  // Log chapter data for debugging
  console.log(`Chapters for ${data.title}:`, data.chapters);

  return (
    <MotionDiv
      className="group bg-[#1c1c1e] p-4 rounded-xl shadow-md hover:bg-[#2a2a2d] transition-all"
      variants={variant}
      animate="visible"
      initial="hidden"
      transition={{
        delay: index * 0.15,
        ease: "easeInOut",
        duration: 0.5,
      }}
      viewport={{ amount: 0 }}
    >
      {/* Manga Cover */}
      <Link href={`/manga/${data?.id}`} className="block group">
        <div className="relative overflow-hidden rounded-lg">
          <Image
            src={data?.cover}
            loading="lazy"
            alt={title}
            width={300}
            height={500}
            referrerPolicy="no-referrer"
            className="w-full h-44 sm:h-60 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>

      {/* Manga Title */}
      <Link href={`/manga/${data?.id}`} className="block mt-3 text-center">
        <h1 className="text-white font-semibold text-sm sm:text-base hover:text-[#ff4b2b] transition-colors">
          {title}
        </h1>
      </Link>

      {/* Chapter Buttons */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {data.chapters.slice(0, 2).map((chapter) => {
          // Log each chapter's date properties
          console.log(`Chapter ${chapter.number} date properties:`, {
            added_chap_date: chapter.added_chap_date,
            added_date: chapter.added_date,
            release_date: chapter.release_date,
          });
          
          return (
            <Link key={chapter.number} href={`/read/${data.id}-ch${chapter.number}`}>
              <div className="bg-[#303136] text-gray-200 px-3 py-1.5 rounded-full text-xs sm:text-sm hover:bg-[#ff4b2b] hover:text-white transition-all">
                <div className="flex flex-col items-center">
                  <span className="font-semibold">Chapter {chapter.number}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5 bg-black/30 px-2 py-0.5 rounded-full">
                    {getRelativeTime(chapter)}
                  </span>
                  {isNewChapter(chapter) && (
                    <span className="bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold mt-0.5 uppercase">
                      NEW
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

    </MotionDiv>
  );
};

export default LatestUpdateCard;
