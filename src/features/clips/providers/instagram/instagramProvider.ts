import type { Clip } from '../../clipQueueSlice';
import type { ClipProvider } from '../providers';
import instagramLogo from './instagram-logo.svg';

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
      thumbnailUrl: instagramLogo,
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
