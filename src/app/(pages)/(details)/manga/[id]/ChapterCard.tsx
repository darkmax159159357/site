import Image from "next/image";
import Link from "next/link";

interface ChapterCardProps {
  chapterNumber: number;
  chapterSlug: string;
  coverImage: string;
  releaseDate: string;
  isLocked?: boolean;
  coinAmount?: number;
  isPurchased?: boolean;
  mangaId: string;
  formatDate: (date: string) => string;
}

const ChapterCard = ({ 
  chapterNumber, 
  chapterSlug, 
  coverImage, 
  releaseDate, 
  isLocked = false, 
  coinAmount = 1, 
  isPurchased = false,
  mangaId,
  formatDate 
}: ChapterCardProps) => {
  return (
    <Link href={`/read/${chapterSlug || `${mangaId}-ch${chapterNumber}`}`}>
      <div className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5 shadow-lg hover:shadow-purple-500/10 transition-all duration-500 hover:-translate-y-1 h-full">
        <div className="p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg shadow-black/20 flex-shrink-0">
            <div className="w-full h-full relative">
              <Image 
                src={coverImage} 
                alt={`Chapter ${chapterNumber}`} 
                width={64} 
                height={64}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                unoptimized={true}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-1 left-0 right-0 text-center text-xs font-bold text-white">
                Ch. {chapterNumber}
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                Chapter {chapterNumber}
              </h3>
              
              {/* Lock indicator */}
              {isLocked ? (
                <div className="flex items-center">
                  {isPurchased ? (
                    <div className="bg-green-500/20 text-green-300 text-xs px-3 py-1 rounded-full flex items-center border border-green-500/30">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" data-slot="icon" className="h-3 w-3 text-green-500">
                        <path fill-rule="evenodd" d="M14.5 1A4.5 4.5 0 0 0 10 5.5V9H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1.5V5.5a3 3 0 1 1 6 0v2.75a.75.75 0 0 0 1.5 0V5.5A4.5 4.5 0 0 0 14.5 1Z" clip-rule="evenodd"></path>
                      </svg>
                    </div>
                  ) : (
                    <div className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full flex items-center shadow-md shadow-purple-900/20 border border-purple-500/30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>{coinAmount} {coinAmount === 1 ? 'coin' : 'coins'}</span>
                    </div>
                  )}
                </div>
              ) : isPurchased ? (
                <div className="bg-green-500/20 text-green-300 text-xs px-3 py-1 rounded-full flex items-center border border-green-500/30">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" data-slot="icon" className="h-3 w-3 text-green-500">
                    <path fill-rule="evenodd" d="M14.5 1A4.5 4.5 0 0 0 10 5.5V9H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1.5V5.5a3 3 0 1 1 6 0v2.75a.75.75 0 0 0 1.5 0V5.5A4.5 4.5 0 0 0 14.5 1Z" clip-rule="evenodd"></path>
                  </svg>
                </div>
              ) : null}
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                {formatDate(releaseDate)}
              </p>
              
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-purple-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ChapterCard; 