import axios, { AxiosRequestConfig } from 'axios';
import { OEmbedVideoResponse } from '../models/oembed';

// SOOP API (formerly AfreecaTV)
const soopClient = axios.create({
  timeout: 15000, // 15 second timeout
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': '*/*',
    'User-Agent': 'TwitchReactQueue/1.0',
  },
});

const getClip = async (id: string): Promise<OEmbedVideoResponse | undefined> => {
  if (!id?.trim()) {
    return undefined;
  }

  try {
    const config: AxiosRequestConfig = {
      method: 'get',
      url: `https://openapi.afreecatv.com/oembed/embedinfo?vod_url=https://vod.sooplive.co.kr/player/${id}`,
    };

    const { data } = await soopClient(config);
    return data;
  } catch (error) {
    console.warn(`Failed to fetch SOOP clip ${id}:`, error);
    return undefined;
  }
};

const extractIdFromUrl = (url: string): string | null => {
  if (!url?.trim()) return null;

  try {
    const urlObj = new URL(url);

    if (urlObj.hostname.includes('afreecatv.com') ||
        urlObj.hostname.includes('sooplive.co.kr') ||
        urlObj.hostname.includes('sooplive.com')) {

      let match = urlObj.pathname.match(/\/(?:player|video)\/(\d+)/);
      return match?.[1] ?? null;
    }

    return null;
  } catch {
    return null;
  }
};

const soopApi = {
  getClip,
  extractIdFromUrl,
};

export default soopApi;
