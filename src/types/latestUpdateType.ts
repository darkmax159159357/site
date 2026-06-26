export interface LatestUpdateType {
  id: string;
  manga_slug: string;
  banner: string;
  rating: string;
  title: string;
  hasNext: boolean;
  hasPrev: boolean;
  cover: string;
  genres?: string[];
  genre?: string;
  chapters: {
    number: number;
    title?: string;
    release_date?: string;
    added_date?: string; 
    added_chap_date?: string;
  }[];
}
