import axios, { AxiosError } from 'axios';
import { KickClip } from '../models/kick';

const kickClient = axios.create({
  baseURL: 'https://kick.com/api/v2',
  timeout: 10000, // 10 second timeout
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'TwitchReactQueue/1.0',
  },
});

export async function getClip(id: string): Promise<KickClip | undefined> {
  if (!id?.trim()) {
    return undefined;
  }

  try {
    const response = await kickClient.get<{ clip: KickClip }>(`/clips/${id}`);
    return response.data.clip;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.warn(`Failed to fetch Kick clip ${id}:`, {
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      message: axiosError.message,
    });
    return undefined;
  }
}

export async function getDirectUrl(id: string): Promise<string | undefined> {
  if (!id?.trim()) {
    return undefined;
  }

  const clip = await getClip(id);
  if (!clip?.video_url) {
    console.warn(`Invalid Kick clip or missing video URL for ID: ${id}`);
    return undefined;
  }

  return clip.video_url;
}

const extractIdFromUrl = (url: string): string | null => {
  if (!url?.trim()) return null;

  try {
    const urlObj = new URL(url);

    if (urlObj.hostname === 'kick.com' || urlObj.hostname === 'www.kick.com') {
      const clipId = urlObj.searchParams.get('clip');
      if (clipId) return clipId;

      const clipsMatch = urlObj.pathname.match(/\/clips?\/([^/?]+)/);
      if (clipsMatch) return clipsMatch[1];
    }

    return null;
  } catch {
    return null;
  }
};

const kickApi = {
  getClip,
  getDirectUrl,
  extractIdFromUrl,
};

export default kickApi;
