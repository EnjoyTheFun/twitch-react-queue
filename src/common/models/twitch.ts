export interface AuthInfo {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface UserInfo {
  aud: string;
  azp: string;
  exp: string;
  iat: string;
  iss: string;
  sub: string;

  preferred_username?: string;
  picture?: string;
}

export interface TokenInfo {
  client_id: string;
  expires_in: number;
  login: string;
  scopes: string[];
  user_id: string;
}

export interface TwitchClip {
  id: string;
  url: string;
  embed_url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  video_id: string;
  game_id: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
}

export interface TwitchVideo {
  id: string;
  url: string;
  embed_url: string;
  user_id: string;
  user_name: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
}

export interface TwitchGame {
  box_art_url: string;
  id: string;
  name: string;
}

export const isTwitchClip = (obj: any): obj is TwitchClip => {
  return obj &&
         typeof obj.id === 'string' &&
         typeof obj.url === 'string' &&
         typeof obj.broadcaster_name === 'string' &&
         typeof obj.title === 'string';
};

export const isTwitchVideo = (obj: any): obj is TwitchVideo => {
  return obj &&
         typeof obj.id === 'string' &&
         typeof obj.url === 'string' &&
         typeof obj.user_name === 'string' &&
         typeof obj.title === 'string';
};

export const isTwitchGame = (obj: any): obj is TwitchGame => {
  return obj &&
         typeof obj.id === 'string' &&
         typeof obj.name === 'string' &&
         typeof obj.box_art_url === 'string';
};

export const formatTwitchDuration = (duration: number): string => {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const getTwitchThumbnailUrl = (
  baseUrl: string,
  width: number = 480,
  height: number = 272
): string => {
  return baseUrl
    .replace('%{width}', width.toString())
    .replace('%{height}', height.toString());
};

export const isTokenExpired = (tokenInfo: TokenInfo): boolean => {
  if (!tokenInfo.expires_in) return true;

  const bufferTime = 5 * 60;
  return tokenInfo.expires_in <= bufferTime;
};

export const extractTwitchClipId = (url: string): string | null => {
  if (!url?.trim()) return null;

  try {
    const urlObj = new URL(url);

    if (urlObj.hostname === 'clips.twitch.tv') {
      return urlObj.pathname.slice(1);
    }

    if (urlObj.hostname.includes('twitch.tv')) {
      const clipMatch = urlObj.pathname.match(/\/\w+\/clip\/(\w+)/);
      return clipMatch?.[1] ?? null;
    }

    return null;
  } catch {
    return null;
  }
};

export const extractTwitchVideoId = (url: string): string | null => {
  if (!url?.trim()) return null;

  try {
    const urlObj = new URL(url);

    if (urlObj.hostname.includes('twitch.tv')) {
      const videoMatch = urlObj.pathname.match(/\/videos\/(\d+)/);
      return videoMatch?.[1] ?? null;
    }

    return null;
  } catch {
    return null;
  }
};

export const createSafeTwitchClip = (partial: Partial<TwitchClip> & Pick<TwitchClip, 'id'>): TwitchClip => {
  return {
    url: `https://clips.twitch.tv/${partial.id}`,
    embed_url: `https://clips.twitch.tv/embed?clip=${partial.id}`,
    broadcaster_id: '',
    broadcaster_name: 'Unknown',
    creator_id: '',
    creator_name: 'Unknown',
    video_id: '',
    game_id: '',
    language: 'en',
    title: 'Untitled Clip',
    view_count: 0,
    created_at: new Date().toISOString(),
    thumbnail_url: '',
    duration: 0,
    ...partial,
  };
};
