import axios, { AxiosError } from 'axios';
import { formatISO } from 'date-fns';
import type { TweetApiResponse, TweetClip } from '../models/twitter';

const twitterClient = axios.create({
  timeout: 10000, // 10 second timeout
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'TwitchReactQueue/1.0',
  },
});
async function fetchTweetData(id: string): Promise<TweetApiResponse | undefined> {
  if (!id?.trim()) {
    return undefined;
  }

  try {
    const resp = await twitterClient.get(`https://api.vxtwitter.com/i/status/${id}`);

    if (resp.data) {
      return resp.data;
    }

    return undefined;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.warn(`Failed to fetch Twitter data for ${id}:`, {
      status: axiosError.response?.status,
      message: axiosError.message,
    });
    return undefined;
  }
}

export async function getClipFromTweet(id: string): Promise<TweetClip | undefined> {
  const tweetUrl = `https://twitter.com/i/web/status/${id}`;
  const data = await fetchTweetData(id);
  if (!data) return undefined;

  const thumbnailUrl =
    data.combinedMediaUrl || data.media_extended?.[0]?.thumbnail_url || data.qrt?.combinedMediaUrl || data.qrt?.media_extended?.[0]?.thumbnail_url || data.user_profile_image_url || '';

  const createdAt = data.date ? formatISO(new Date(data.date)) : '';

  const clip: TweetClip = {
    id,
    author: data.user_name || '',
    title: data.text || '',
    submitters: [],
    thumbnailUrl,
    createdAt,
    Platform: 'Twitter',
    url: tweetUrl,
  };

  return clip;
}

export async function getDirectMediaUrl(id: string): Promise<string | undefined> {
  if (!id?.trim()) {
    return undefined;
  }

  const data = await fetchTweetData(id);
  if (!data) return undefined;

  const hasMultipleVideos = (mediaURLs: string[] | undefined) => (mediaURLs ?? []).filter((url) => url.endsWith('.mp4')).length > 1;

  let mediaUrl: string | undefined;

  if (hasMultipleVideos(data.mediaURLs)) {
    mediaUrl = `https://c.vxtwitter.com/i/status/${id}`;
  } else if ((data.mediaURLs?.length ?? 0) === 1) {
    mediaUrl = data.mediaURLs![0];
  } else if ((data.mediaURLs?.length ?? 0) > 1 && data.combinedMediaUrl) {
    mediaUrl = data.combinedMediaUrl;
  } else if (data.qrt) {
    if (hasMultipleVideos(data.qrt.mediaURLs)) {
      mediaUrl = `https://c.vxtwitter.com/i/status/${id}`;
    } else if ((data.qrt.mediaURLs?.length ?? 0) === 1) {
      mediaUrl = data.qrt.mediaURLs![0];
    } else if ((data.qrt.mediaURLs?.length ?? 0) > 1 && data.qrt.combinedMediaUrl) {
      mediaUrl = data.qrt.combinedMediaUrl;
    }
  }

  return mediaUrl;
}

const extractIdFromUrl = (url: string): string | null => {
  if (!url?.trim()) return null;

  try {
    const urlObj = new URL(url);

    if (urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com')) {
      const match = urlObj.pathname.match(/\/status(?:es)?\/(\d+)/);
      return match?.[1] ?? null;
    }

    return null;
  } catch {
    return null;
  }
};

const twitterApi = {
  getClipFromTweet,
  getDirectMediaUrl,
  extractIdFromUrl,
};

export default twitterApi;
