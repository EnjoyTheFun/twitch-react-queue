import axios from 'axios';
import type { RedditClipInfo } from '../models/reddit';

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

const redditApi = {
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
