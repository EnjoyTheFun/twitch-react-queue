import kickApi from '../../../../common/apis/kickApi';
import type { Clip } from '../../clipQueueSlice';
import type { ClipProvider } from '../providers';

class KickClipProvider implements ClipProvider {
  name = 'kick-clip';

  getIdFromUrl(url: string): string | undefined {
    return kickApi.extractIdFromUrl(url) ?? undefined;
  }

  async getClipById(id: string): Promise<Clip | undefined> {
    if (!id) return undefined;

    const clipInfo = await kickApi.getClip(id);
    if (!clipInfo || !clipInfo.video_url) return undefined;

    return {
      id: clipInfo.id,
      title: clipInfo.title,
      author: clipInfo.channel.username,
      category: clipInfo.category.name,
      url: clipInfo.video_url,
      createdAt: clipInfo.created_at,
      thumbnailUrl: clipInfo.thumbnail_url.replace('%{width}x%{height}', '480x272'),
      submitters: [],
      Platform: 'Kick',
    };
  }

  getUrl(id: string): string | undefined {
    return id ? `https://kick.com/clips/${id}` : undefined;
  }

  getEmbedUrl(id: string): string | undefined {
    return this.getUrl(id);
  }
  async getAutoplayUrl(id: string): Promise<string | undefined> {
    return await kickApi.getDirectUrl(id);
  }
}

const kickClipProvider = new KickClipProvider();
export default kickClipProvider;
