import axios from 'axios';
import { formatISO } from 'date-fns';

async function fetchTweetData(id: string): Promise<any | undefined> {
  try {
    // using 3rd party API
    const resp = await axios.get(`https://api.vxtwitter.com/i/status/${id}`);
    return resp.data;
  } catch {
    return undefined;
  }
}

export async function getClipFromTweet(id: string): Promise<any | undefined> {
  const tweetUrl = `https://twitter.com/i/web/status/${id}`;
  const data = await fetchTweetData(id);
  if (!data) return undefined;

  return {
    id,
    author: data.user_name || '',
    title: data.text || '',
    submitters: [],
    thumbnailUrl: data.combinedMediaUrl ||
      data.media_extended?.[0]?.thumbnail_url ||
      data.qrt?.combinedMediaUrl ||
      data.qrt?.media_extended?.[0]?.thumbnail_url ||
      data.user_profile_image_url ||
      '',
    createdAt: formatISO(new Date(data.date)) || '',
    Platform: 'Twitter',
    url: tweetUrl,
  };
}

export async function getDirectMediaUrl(id: string): Promise<string | undefined> {
  const data = await fetchTweetData(id);
  if (!data) return undefined;

  const hasMultipleVideos = (mediaURLs: string[] | undefined) =>
    (mediaURLs ?? []).filter(url => url.endsWith('.mp4')).length > 1;

  if (hasMultipleVideos(data.mediaURLs)) {
    return `https://c.vxtwitter.com/i/status/${id}`;
  }
  if (data.mediaURLs?.length === 1) {
    return data.mediaURLs[0];
  }
  if (data.mediaURLs?.length > 1 && data.combinedMediaUrl) {
    return data.combinedMediaUrl;
  }

  if (data.qrt) {
    if (hasMultipleVideos(data.qrt.mediaURLs)) {
      return `https://c.vxtwitter.com/i/status/${id}`;
    }
    if (data.qrt.mediaURLs?.length === 1) {
      return data.qrt.mediaURLs[0];
    }
    if (data.qrt.mediaURLs?.length > 1 && data.qrt.combinedMediaUrl) {
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
