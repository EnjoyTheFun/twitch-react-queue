import axios, { AxiosError } from 'axios';
import type { TikTokOEmbedResponse } from '../models/tiktok';

const tiktokClient = axios.create({
  baseURL: 'https://www.tiktok.com',
  timeout: 10000, // 10 second timeout
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'TwitchReactQueue/1.0',
  },
});

const constructTikTokUrl = (id: string): string => {
  if (id.startsWith('l|')) {
    const realId = id.split('|')[1];
    return `https://www.tiktok.com/@_/video/${realId}`;
  } else if (id.startsWith('s|')) {
    const realId = id.split('|')[1];
    return `https://vm.tiktok.com/${realId}`;
  } else {
    return `https://www.tiktok.com/@_/video/${id}`;
  }
};

const getClip = async (id: string): Promise<TikTokOEmbedResponse | undefined> => {
  if (!id?.trim()) {
    return undefined;
  }

  try {
    const tikTokUrl = constructTikTokUrl(id);

    const { data } = await tiktokClient.get<TikTokOEmbedResponse>('/oembed', {
      params: {
        url: tikTokUrl,
      },
    });

    if (!data || typeof data !== 'object') {
      console.warn(`Invalid TikTok OEmbed response for ID: ${id}`);
      return undefined;
    }

    return data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.warn(`Failed to fetch TikTok clip ${id}:`, {
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      message: axiosError.message,
      url: constructTikTokUrl(id),
    });
    return undefined;
  }
};

const extractIdFromUrl = (url: string): string | null => {
  if (!url?.trim()) return null;

  try {
    const urlObj = new URL(url);

    // Photo format: tiktok.com/@username/photo/1234567890
    if (urlObj.hostname.includes('tiktok.com') && /^\/@[^/]+\/photo\/(\d+)/.test(urlObj.pathname)) {
      const match = urlObj.pathname.match(/^\/@[^/]+\/photo\/(\d+)/);
      return match ? `l|${match[1]}` : null;
    }

    // Short format: vm.tiktok.com or vt.tiktok.com URLs
    if (urlObj.hostname === 'vm.tiktok.com' || urlObj.hostname === 'vt.tiktok.com') {
      const shortId = urlObj.pathname.slice(1).replace(/\/$/, '');
      if (shortId) {
        return `s|${shortId}`;
      }
    }

    // /t/ format on main hosts: tiktok.com/t/ZMeFG2VW8/
    if (urlObj.hostname.includes('tiktok.com') && urlObj.pathname.startsWith('/t/')) {
      const match = urlObj.pathname.match(/^\/t\/([A-Za-z0-9_]+)/);
      return match ? `s|${match[1]}` : null;
    }

    // Long video format: tiktok.com/@username/video/1234567890
    if (urlObj.hostname.includes('tiktok.com')) {
      const videoMatch = urlObj.pathname.match(/\/video\/(\d+)/);
      if (videoMatch) {
        return `l|${videoMatch[1]}`;
      }
    }

    return null;
  } catch {
    return null;
  }
};

const isValidTikTokId = (id: string): boolean => {
  if (!id?.trim()) return false;

  if (/^\d+$/.test(id)) return true;

  if (id.startsWith('l|') || id.startsWith('s|')) {
    const realId = id.split('|')[1];
    return Boolean(realId && realId.trim().length > 0);
  }

  return false;
};

const tiktokApi = {
  getClip,
  extractIdFromUrl,
  isValidTikTokId,
};

export default tiktokApi;
