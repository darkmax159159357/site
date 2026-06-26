export type Chapter = {
  id: string;
  number: number;
  title: string;
  pages: string[];
  chapter_slug?: string;
  chapter_title?: string;
  chapter_release?: string;
  date?: string;
  added_chap_date?: string;
  added_date?: string;
  release_date?: string;
  isLocked?: boolean;
  unlockTime?: string | null;
  coinAmount?: number;
  thumbnail?: string;
  isPurchased?: boolean;
  showUnlockIcon?: boolean;
};

export type detailsDataProps = {
  status: string;
  data: {
    id: string;
    title: string;
    cover: string;
    banner: string;
    type: string;
    status: string;
    rating: string;
    description: string;
    genres: string[];
    published: string;
    author: string;
    total_chapter: number;
    bookmark_users: number;
    chapters: Chapter[];
  };
};
