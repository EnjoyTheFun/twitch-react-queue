import axios from 'axios';
import type { RedditResponse, RedditClipInfo, RedditSort } from '../models/reddit';

const redditApiClient = axios.create({
  baseURL: 'https://www.reddit.com',
  timeout: 10000,
});

const REDDIT_FALLBACK_THUMBNAIL = 'https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-57x57.png';

const getRedditPostIdFromPermalink = (permalink: string): string | undefined => {
  const idMatch = permalink.match(/\/comments\/([a-z0-9]+)/i);
  return idMatch?.[1];
};

const getRedditTitleFromPermalink = (permalink: string): string | undefined => {
  const slugMatch = permalink.match(/\/comments\/[a-z0-9]+\/([^/?#]+)/i);
  if (!slugMatch?.[1]) return undefined;

  return decodeURIComponent(slugMatch[1])
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getRedditAuthorFromOembedHtml = (html?: string): string | undefined => {
  if (!html) return undefined;
  const authorMatch = html.match(/\/user\/([^/"?]+)/i);
  return authorMatch?.[1];
};

interface RedditOembedLikeResponse {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
}

const getRedditMetadataFromRedditOembed = async (permalink: string): Promise<RedditOembedLikeResponse | undefined> => {
  try {
    const { data } = await redditApiClient.get<RedditOembedLikeResponse>(`/oembed?url=${encodeURIComponent(permalink)}&raw_json=1`);
    if (!data || typeof data !== 'object') return undefined;
    return data;
  } catch {
    return undefined;
  }
};

const getRedditMetadataFromNoembed = async (permalink: string): Promise<RedditOembedLikeResponse | undefined> => {
  try {
    const { data } = await axios.get<RedditOembedLikeResponse>(
      `https://noembed.com/embed?url=${encodeURIComponent(permalink)}`,
      { timeout: 10000 }
    );
    if (!data || typeof data !== 'object') return undefined;
    return data;
  } catch {
    return undefined;
  }
};

export interface RedditPostEntry {
  url: string;
  username: string;
  title: string;
  postId: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  createdAt?: string;
}

const getSubredditPosts = async (
  subreddit: string,
  sort: RedditSort = 'top',
  limit: number = 100,
  timeframe: string = 'day'
): Promise<RedditPostEntry[]> => {
  try {
    const url = `/r/${subreddit}/${sort}.json?limit=${limit}&t=${timeframe}`;
    const { data } = await redditApiClient.get<RedditResponse>(url);

    if (!data?.data?.children || !Array.isArray(data.data.children)) {
      console.warn('Invalid response format from Reddit API');
      return [];
    }

    const posts: RedditPostEntry[] = [];

    for (const post of data.data.children) {
      const postData = post.data;
      let url = postData.url_overridden_by_dest || postData.url;

      if (!url) continue;

      const domain = postData.domain || '';
      const isImagePost = postData.post_hint === 'image' ||
        domain.includes('i.redd.it') ||
        domain.includes('i.imgur.com') ||
        (postData.url && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(postData.url));

      const isVideoPost =
        postData.is_video ||
        domain.includes('twitch.tv') ||
        domain.includes('kick.com') ||
        domain.includes('youtube.com') ||
        domain.includes('youtu.be') ||
        domain.includes('tiktok.com') ||
        domain.includes('twitter.com') ||
        domain.includes('x.com') ||
        domain.includes('v.redd.it') ||
        domain.includes('streamable.com') ||
        domain.includes('instagram.com');

      if (isVideoPost || isImagePost) {
        if (domain.includes('v.redd.it')) {
          const videoInfo = postData.secure_media?.reddit_video || postData.media?.reddit_video;
          if (!videoInfo) {
            continue;
          }
          if (postData.permalink) {
            url = `https://www.reddit.com${postData.permalink}`;
          }

          let mediaUrl: string | undefined;
          if (videoInfo.has_audio && videoInfo.hls_url) {
            mediaUrl = videoInfo.hls_url.replace(/&amp;/g, '&');
          } else if (videoInfo.fallback_url) {
            mediaUrl = videoInfo.fallback_url.replace(/&amp;/g, '&');
          }

          let thumbnailUrl = postData.thumbnail;
          if (!thumbnailUrl?.startsWith('http')) {
            thumbnailUrl = postData.preview?.images?.[0]?.source?.url;
          }
          if (thumbnailUrl) {
            thumbnailUrl = thumbnailUrl.replace(/&amp;/g, '&');
          }

          posts.push({
            url,
            username: postData.author || 'reddit',
            title: postData.title || '',
            postId: postData.id || '',
            mediaUrl,
            thumbnailUrl,
            duration: videoInfo.duration,
            createdAt: postData.created_utc ? new Date(postData.created_utc * 1000).toISOString() : undefined,
          });
          continue;
        }

        if (isImagePost && !isVideoPost && domain.includes('i.redd.it')) {
          const mediaUrl = (postData.url_overridden_by_dest || postData.url || postData.preview?.images?.[0]?.source?.url)?.replace(/&amp;/g, '&');
          let thumbnailUrl = postData.thumbnail;
          if (!thumbnailUrl?.startsWith('http')) {
            thumbnailUrl = postData.preview?.images?.[0]?.source?.url;
          }
          if (thumbnailUrl) {
            thumbnailUrl = thumbnailUrl.replace(/&amp;/g, '&');
          }

          if (postData.permalink) {
            url = `https://www.reddit.com${postData.permalink}`;
          }

          posts.push({
            url,
            username: postData.author || 'reddit',
            title: postData.title || '',
            postId: postData.id || '',
            mediaUrl,
            thumbnailUrl,
            createdAt: postData.created_utc ? new Date(postData.created_utc * 1000).toISOString() : undefined,
          });
          continue;
        }

        posts.push({
          url,
          username: postData.author || 'reddit',
          title: postData.title || '',
          postId: postData.id || '',
        });
      }
    }

    return posts;
  } catch (error) {
    console.error('Failed to fetch Reddit posts:', error);
    return [];
  }
};

const redditApi = {
  getSubredditPosts,
  getClipFromPermalink: async (permalink: string, allowNsfw: boolean = true): Promise<RedditClipInfo | undefined> => {
    const normalizedPermalink = permalink.replace(/^https?:\/\/old\.reddit\.com/i, 'https://www.reddit.com');
    const id = getRedditPostIdFromPermalink(normalizedPermalink) || normalizedPermalink;
    const titleFromSlug = getRedditTitleFromPermalink(normalizedPermalink);

    if (!allowNsfw && /\/nsfw\//i.test(normalizedPermalink)) {
      return undefined;
    }

    const redditOembed = await getRedditMetadataFromRedditOembed(normalizedPermalink);
    const noembed = await getRedditMetadataFromNoembed(normalizedPermalink);
    const metadata = redditOembed || noembed;

    if (!metadata) {
      console.error('Failed to fetch Reddit permalink metadata:', permalink);
      return {
        id,
        title: titleFromSlug || `Reddit post ${id}`,
        author: 'reddit',
        thumbnailUrl: REDDIT_FALLBACK_THUMBNAIL,
        videoUrl: normalizedPermalink,
      };
    }

    const authorFromHtml = getRedditAuthorFromOembedHtml(metadata.html);
    const author = metadata.author_name || authorFromHtml || 'reddit';

    return {
      id,
      title: metadata.title || titleFromSlug || `Reddit post ${id}`,
      author,
      thumbnailUrl: metadata.thumbnail_url || REDDIT_FALLBACK_THUMBNAIL,
      videoUrl: normalizedPermalink,
    };
  },
};

export default redditApi;
