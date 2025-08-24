import axios, { AxiosError } from 'axios';
import { OEmbedVideoResponse } from '../models/oembed';

const streamableClient = axios.create({
  timeout: 8000, // 8 second timeout
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
    const { data } = await streamableClient.get(`https://api.streamable.com/oembed.json?url=https://streamable.com/${id}`);
    return data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.warn(`Failed to fetch Streamable clip ${id}:`, {
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

    if (urlObj.hostname.includes('streamable.com')) {
      const match = urlObj.pathname.match(/\/([a-zA-Z0-9]+)/);
      return match?.[1] ?? null;
    }

    return null;
  } catch {
    return null;
  }
};

const streamableApi = {
  getClip,
  extractIdFromUrl,
};

export default streamableApi;
