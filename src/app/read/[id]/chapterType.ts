export interface Chapter {
  number: number;
  title?: string;
  date?: string;
  pages?: string[];
  isLocked?: boolean;
  unlockTime?: string;
  coinAmount?: number;  // Number of coins required to unlock
}

export interface chapterType {
  id: string;
  title: string;
  chapterTitle: string;
  status?: "ONGOING" | "COMPLETED" | "RELEASED";
  cover?: string;
  banner?: string;
  description?: string;
  author?: string;
  artist?: string;
  rating?: string | number;
  published?: string;
  type?: string;
  genre?: string;
  genres?: string[];
  mangaId?: string;
  mangaTitle?: string;
  mangaCover?: string;
  pages: string[];
  data?: string[]; // Keeping for backward compatibility
  has_next: { 
    has_next_link: string | null; 
    is_next_link: boolean 
  };
  has_prev: { 
    has_prev_link: string | null; 
    is_prev_link: boolean 
  };
  chapters?: Chapter[];
  isLocked?: boolean; // Whether this chapter is locked
  unlockTime?: string; // ISO timestamp when the chapter will be unlocked
  coinAmount?: number; // Number of coins required to unlock
}
