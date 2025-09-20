export interface TweetApiResponse {
  user_name?: string;
  username?: string;
  text?: string;
  combinedMediaUrl?: string;
  media_extended?: Array<{
    thumbnail_url?: string;
    duration_millis?: number;
  }>;
  qrt?: {
    combinedMediaUrl?: string;
    media_extended?: Array<{
      thumbnail_url?: string;
      duration_millis?: number;
    }>;
    mediaURLs?: string[];
  };
  user_profile_image_url?: string;
  date?: string | number;
  mediaURLs?: string[];
  likes?: number;
}

export interface TweetClip {
  id: string;
  author: string;
  title: string;
  submitters: string[];
  thumbnailUrl: string;
  createdAt: string;
  Platform: 'Twitter';
  url: string;
  duration?: number;
  views?: number; // Count likes as views for now
}

export default TweetApiResponse;
