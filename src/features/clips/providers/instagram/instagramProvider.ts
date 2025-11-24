import type { Clip } from '../../clipQueueSlice';
import type { ClipProvider } from '../providers';

const INSTAGRAM_HOSTS = ['instagram.com', 'www.instagram.com'];

class InstagramProvider implements ClipProvider {
  name = 'instagram';

  getIdFromUrl(url: string): string | undefined {
    try {
      const uri = new URL(url);
      if (INSTAGRAM_HOSTS.some(h => uri.hostname.endsWith(h))) {
        const match = uri.pathname.match(/\/(p|reel|tv)\/([^/]+)/);
        return match ? match[2] : undefined;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  async getClipById(id: string): Promise<Clip | undefined> {
    // No public API unless you register your app :(
    return {
      id,
      author: 'Instagram',
      title: `https://www.instagram.com/reel/${id}/`,
      submitters: [],
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Instagram_logo_2022.svg/1200px-Instagram_logo_2022.svg.png',
      createdAt: '',
      Platform: 'Instagram',
      url: this.getUrl(id),
    };
  }

  getUrl(id: string): string | undefined {
    return `https://www.instagram.com/reel/${id}/`;
  }

  getEmbedUrl(id: string): string | undefined {
    return `https://www.instagram.com/reel/${id}/`;
  }

  async getAutoplayUrl(id: string): Promise<string | undefined> {
    return `https://www.instagram.com/reel/${id}/`;
  }
}

const instagramProvider = new InstagramProvider();
export default instagramProvider;
