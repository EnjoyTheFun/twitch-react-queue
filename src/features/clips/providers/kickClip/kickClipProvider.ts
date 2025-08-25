import kickApi from '../../../../common/apis/kickApi';
import type { Clip } from '../../clipQueueSlice';
import type { ClipProvider } from '../providers';

class KickClipProvider implements ClipProvider {
  name = 'kick-clip';

  getIdFromUrl(url: string): string | undefined {
    try {
      const uri = new URL(url);
      if (uri.hostname === 'kick.com' || uri.hostname === 'www.kick.com') {
        const id = uri.searchParams.get('clip');
        if (id) {
          return id;
        }
        if (uri.pathname.includes('/clips/')) {
          const pathParts = uri.pathname.split('/').filter(Boolean);
          if (pathParts.length >= 3 && pathParts[1] === 'clips') {
            const channelName = pathParts[0];
            const clipId = pathParts[2].split('?')[0];
            if (channelName && clipId) {
              return `${channelName}|${clipId}`;
            }
          }
        }
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  async getClipById(id: string): Promise<Clip | undefined> {
    if (!id) return undefined;

    const actualClipId = id.includes('|') ? id.split('|')[1] : id;
    const clipInfo = await kickApi.getClip(actualClipId);
    if (!clipInfo || !clipInfo.video_url) return undefined;

    return {
      id,
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
    if (id.includes('|')) {
      const [channelName, clipId] = id.split('|');
      if (channelName && clipId) {
        return `https://kick.com/${channelName}/clips/${clipId}`;
      }
    }
    return undefined;
  }

  getEmbedUrl(id: string): string | undefined {
    return this.getUrl(id);
  }

  async getAutoplayUrl(id: string): Promise<string | undefined> {
    const actualClipId = id.includes('|') ? id.split('|')[1] : id;
    return await kickApi.getDirectUrl(actualClipId);
  }
}

const kickClipProvider = new KickClipProvider();
export default kickClipProvider;
