import axios, { AxiosError } from 'axios';
import { OEmbedVideoResponse, validateOEmbedResponse } from '../models/oembed';

const youtubeClient = axios.create({
  baseURL: 'https://www.youtube.com',
  timeout: 8000,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'TwitchReactQueue/1.0',
  },
});

const getClip = async (id: string): Promise<OEmbedVideoResponse | undefined> => {
  if (!id?.trim()) {
    return undefined;
  }

  try {
    const { data } = await youtubeClient.get('/oembed', {
      params: {
        format: 'json',
        url: `https://www.youtube.com/watch?v=${id}`,
        maxwidth: 640,
        maxheight: 360,
      },
    });

    if (!validateOEmbedResponse(data)) {
      console.warn(`Invalid OEmbed response from YouTube for ID: ${id}`);
      return undefined;
    }

    if (data.type !== 'video') {
      console.warn(`Expected video type from YouTube, got: ${data.type}`);
      return undefined;
    }

    const videoResponse = data as OEmbedVideoResponse;

    return videoResponse;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.warn(`Failed to fetch YouTube clip ${id}:`, {
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      message: axiosError.message,
    });
    return undefined;
  }
};

const extractIdFromUrl = (url: string): string | null => {
  if (!url?.trim()) return null;

  try {
    const urlObj = new URL(url);

    if (urlObj.hostname.includes('youtube.com')) {
      // Regular video URLs: youtube.com/watch?v=ID
      const videoId = urlObj.searchParams.get('v');
      if (videoId) return videoId;

      // Shorts URLs: youtube.com/shorts/ID
      const shortsMatch = urlObj.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch) return shortsMatch[1];

      // Embed URLs: youtube.com/embed/ID
      const embedMatch = urlObj.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch) return embedMatch[1];
    }

    // Short URLs: youtu.be/ID
    if (urlObj.hostname === 'youtu.be') {
      const id = urlObj.pathname.slice(1).split('?')[0];
      if (id) return id;
    }

    return null;
  } catch {
    return null;
  }
};

const youtubeApi = {
  getClip,
  extractIdFromUrl,
};

export default youtubeApi;
