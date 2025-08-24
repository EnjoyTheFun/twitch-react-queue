import type { Clip } from '../../clipQueueSlice';
import type { ClipProvider } from '../providers';
import tiktokApi from '../../../../common/apis/tiktokApi';

const TIKTOK_SHORT_URL_PREFIXES = ['https://vm.tiktok.com/', 'https://vt.tiktok.com/'];

const buildTiktokVideoUrl = (videoId: string) => `https://www.tiktok.com/@_/video/${videoId}`;
const buildTiktokPlayerUrl = (videoId: string) => `https://www.tiktok.com/player/v1/${videoId}`;

class TiktokProvider implements ClipProvider {
  name = 'tiktok';

  getIdFromUrl(url: string): string | undefined {
    return tiktokApi.extractIdFromUrl(url) ?? undefined;
  }

  async getClipById(id: string): Promise<Clip | undefined> {
    try {
      const data = await tiktokApi.getClip(id);
      if (!data) return undefined;
      const actualId = id.split('|')[1] || id;
      return {
        id: data.embed_product_id || actualId,
        author: data.author_name,
        title: data.title,
        submitters: [],
        thumbnailUrl: data.thumbnail_url,
        Platform: 'TikTok',
      };
    } catch {
      return undefined;
    }
  }

  getUrl(id: string): string | undefined {
    const actualId = id.split('|')[1];
    return id.startsWith('s|')
      ? TIKTOK_SHORT_URL_PREFIXES[0] + actualId
      : buildTiktokVideoUrl(actualId);
  }

  getEmbedUrl(id: string): string | undefined {
    return this.getUrl(id);
  }

  async getAutoplayUrl(id: string): Promise<string | undefined> {
    const clip = await this.getClipById(id);
    const actualId = clip?.id || id.split('|')[1];
    return buildTiktokPlayerUrl(actualId);
  }
}

const tiktokProvider = new TiktokProvider();
export default tiktokProvider;
