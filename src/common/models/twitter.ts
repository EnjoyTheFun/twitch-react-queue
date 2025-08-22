export interface TweetApiResponse {
  user_name?: string;
  username?: string;
  text?: string;
  combinedMediaUrl?: string;
  media_extended?: Array<{ thumbnail_url?: string }>;
  qrt?: {
    combinedMediaUrl?: string;
    media_extended?: Array<{ thumbnail_url?: string }>;
    mediaURLs?: string[];
  };
  user_profile_image_url?: string;
  date?: string | number;
  mediaURLs?: string[];
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
}

export default TweetApiResponse;
