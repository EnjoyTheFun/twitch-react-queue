import type { Clip } from '../../clipQueueSlice';
import type { ClipProvider } from '../providers';
import tiktokApi from '../../../../common/apis/tiktokApi';

const TIKTOK_MAIN_HOSTS = ['tiktok.com', 'www.tiktok.com'];
const TIKTOK_SHORT_HOSTS = ["vm.tiktok.com", "vt.tiktok.com"];
const TIKTOK_SHORT_URL_PREFIXES = ['https://vm.tiktok.com/', 'https://vt.tiktok.com/'];

const buildTiktokVideoUrl = (videoId: string) => `https://www.tiktok.com/@_/video/${videoId}`;
const buildTiktokPlayerUrl = (videoId: string) => `https://www.tiktok.com/player/v1/${videoId}`;

class TiktokProvider implements ClipProvider {
  name = 'tiktok';

  getIdFromUrl(url: string): string | undefined {
    try {
      const uri = new URL(url);

      if (TIKTOK_MAIN_HOSTS.some(h => uri.hostname.endsWith(h)) &&
        /^\/@[^/]+\/photo\/(\d+)/.test(uri.pathname)) {
        const match = uri.pathname.match(/^\/@[^/]+\/photo\/(\d+)/);
        return match ? `l|${match[1]}` : undefined;
      }

      if (TIKTOK_SHORT_HOSTS.some(h => uri.hostname.endsWith(h)) ||
        (TIKTOK_MAIN_HOSTS.some(h => uri.hostname.endsWith(h)) && uri.pathname.startsWith('/t/'))) {
        const match = uri.pathname.match(/^\/(?:t\/)?([A-Za-z0-9_]+)/);
        return match ? `s|${match[1]}` : undefined;
      }

      if (TIKTOK_MAIN_HOSTS.some(h => uri.hostname.endsWith(h))) {
        const match = uri.pathname.match(/\/video\/(\d+)/);
        return match ? `l|${match[1]}` : undefined;
      }
    } catch {
      return undefined;
    }
    return undefined;
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
        url: this.getUrl(id),
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
