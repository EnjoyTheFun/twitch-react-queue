export interface RedditPostData {
  url?: string;
  url_overridden_by_dest?: string;
  domain?: string;
  is_video?: boolean;
  post_hint?: string;
  author?: string;
  title?: string;
  id?: string;
  permalink?: string;
  created_utc?: number;
  thumbnail?: string;
  over_18?: boolean;
  preview?: {
    images?: Array<{
      source?: {
        url?: string;
        width?: number;
        height?: number;
      };
    }>;
  };
  secure_media?: {
    reddit_video?: {
      fallback_url?: string;
      hls_url?: string;
      dash_url?: string;
      has_audio?: boolean;
      duration?: number;
      width?: number;
      height?: number;
    };
  };
  media?: {
    reddit_video?: {
      fallback_url?: string;
      hls_url?: string;
      dash_url?: string;
      has_audio?: boolean;
      duration?: number;
      width?: number;
      height?: number;
    };
  };
}

export interface RedditPost {
  kind: string;
  data: RedditPostData;
}

export interface RedditResponse {
  kind: string;
  data: {
    children: RedditPost[];
    after?: string | null;
    before?: string | null;
  };
}

export interface RedditClipInfo {
  id: string;
  title: string;
  author: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  duration?: number;
  createdAt?: string;
  permalink?: string;
}

export type RedditSort = 'top' | 'hot' | 'best' | 'new';
