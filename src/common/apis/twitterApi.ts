import axios from 'axios';
import { formatISO } from 'date-fns';
import type { TweetApiResponse, TweetClip } from '../models/twitter';

async function fetchTweetData(id: string): Promise<TweetApiResponse | undefined> {
  try {
    // using 3rd party API
    const resp = await axios.get(`https://api.vxtwitter.com/i/status/${id}`);
    return resp.data;
  } catch {
    return undefined;
  }
}

export async function getClipFromTweet(id: string): Promise<TweetClip | undefined> {
  const tweetUrl = `https://twitter.com/i/web/status/${id}`;
  const data = await fetchTweetData(id);
  if (!data || !data.user_name) return undefined;

  const thumbnailUrl =
    data.combinedMediaUrl || data.media_extended?.[0]?.thumbnail_url || data.qrt?.combinedMediaUrl || data.qrt?.media_extended?.[0]?.thumbnail_url || data.user_profile_image_url || '';

  const createdAt = data.date ? formatISO(new Date(data.date)) : '';

  const durationMs = data.media_extended?.[0]?.duration_millis || data.qrt?.media_extended?.[0]?.duration_millis;
  const duration = durationMs ? Math.round(durationMs / 1000) : undefined;

  const clip: TweetClip = {
    id,
    author: data.user_name || '',
    title: data.text || '',
    submitters: [],
    thumbnailUrl,
    createdAt,
    duration,
    views: data.likes,
    Platform: 'Twitter',
    url: tweetUrl,
  };

  return clip;
}

export async function getDirectMediaUrl(id: string): Promise<string | undefined> {
  const data = await fetchTweetData(id);
  if (!data || !data.user_name) return undefined;

  const hasMultipleVideos = (mediaURLs: string[] | undefined) => (mediaURLs ?? []).filter((url) => url.endsWith('.mp4')).length > 1;

  if (hasMultipleVideos(data.mediaURLs)) {
    return `https://c.vxtwitter.com/i/status/${id}`;
  }
  if ((data.mediaURLs?.length ?? 0) === 1) {
    return data.mediaURLs![0];
  }
  if ((data.mediaURLs?.length ?? 0) > 1 && data.combinedMediaUrl) {
    return data.combinedMediaUrl;
  }

  if (data.qrt) {
    if (hasMultipleVideos(data.qrt.mediaURLs)) {
      return `https://c.vxtwitter.com/i/status/${id}`;
    }
    if ((data.qrt.mediaURLs?.length ?? 0) === 1) {
      return data.qrt.mediaURLs![0];
    }
    if ((data.qrt.mediaURLs?.length ?? 0) > 1 && data.qrt.combinedMediaUrl) {
      return data.qrt.combinedMediaUrl;
    }
  }

  return undefined;
}

const twitterApi = {
  getClipFromTweet,
  getDirectMediaUrl,
};

export default twitterApi;
