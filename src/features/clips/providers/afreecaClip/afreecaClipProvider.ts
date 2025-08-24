import soopApi from '../../../../common/apis/afreecaApi';
import type { Clip } from '../../clipQueueSlice';
import type { ClipProvider } from '../providers';

// SOOP (formerly AfreecaTV)
class AfreecaClipProvider implements ClipProvider {
  name = 'afreeca-clip';

  getIdFromUrl(url: string): string | undefined {
    return soopApi.extractIdFromUrl(url) ?? undefined;
  }

  async getClipById(id: string): Promise<Clip | undefined> {
    const clipInfo = await soopApi.getClip(id);

    return {
      id,
      title: clipInfo?.title ?? id,
      author: clipInfo?.author_name ?? 'SOOP',
      thumbnailUrl: clipInfo?.thumbnail_url,
      submitters: [],
      Platform: 'SOOP',
    };
  }

  getUrl(id: string): string | undefined {
    return `https://www.sooplive.com/video/${id}`;
  }

  getEmbedUrl(id: string): string | undefined {
    return `https://www.sooplive.com/player/embed/video/${id}`;
  }

  async getAutoplayUrl(id: string): Promise<string | undefined> {
    return `https://www.sooplive.com/video/${id}`;
  }
}

const afreecaClipProvider = new AfreecaClipProvider();

export default afreecaClipProvider;
