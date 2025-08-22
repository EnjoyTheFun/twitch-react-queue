import axios from 'axios';
import type { TikTokOEmbedResponse } from '../models/tiktok';

const getClip = async (id: string): Promise<TikTokOEmbedResponse | undefined> => {
  try {
    let url: string;

    if (id.startsWith('l|')) {
      const realId = id.split('|')[1];
      url = `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@_/video/${realId}`;
    } else if (id.startsWith('s|')) {
      const realId = id.split('|')[1];
      url = `https://www.tiktok.com/oembed?url=https://vm.tiktok.com/${realId}`;
    } else {
      url = `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@_/video/${id}`;
    }

  const { data } = await axios.get<TikTokOEmbedResponse>(url);
  return data;
  } catch {
    return undefined;
  }
};

const tiktokApi = {
  getClip,
};

export default tiktokApi;
