import type { Clip } from '../../clipQueueSlice';
import type { ClipProvider } from '../providers';
import { getClipFromTweet, getDirectMediaUrl } from '../../../../common/apis/twitterApi';

const TWITTER_HOSTS = ['twitter.com', 'x.com', 'www.twitter.com', 'www.x.com'];

class TwitterProvider implements ClipProvider {
  name = 'twitter';

  getIdFromUrl(url: string): string | undefined {
    try {
      const uri = new URL(url);
      if (TWITTER_HOSTS.some(h => uri.hostname.endsWith(h))) {
        const match = uri.pathname.match(/\/status\/(\d+)/);
        return match ? match[1] : undefined;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  async getClipById(id: string): Promise<Clip | undefined> {
    try {
      return await getClipFromTweet(id);
    } catch (error) {
      return undefined;
    }
  }

  getUrl(id: string): string | undefined {
    return `https://twitter.com/i/web/status/${id}`;
  }

  getEmbedUrl(id: string): string | undefined {
    return `https://c.vxtwitter.com/i/status/${id}.mp4`;
  }

  async getAutoplayUrl(id: string): Promise<string | undefined> {
    try {
      const directUrl = await getDirectMediaUrl(id);
      if (directUrl && directUrl.includes('video.twimg.com')) {
        return `https://c.vxtwitter.com/i/status/${id}`;
      }

      return directUrl ?? `https://c.vxtwitter.com/i/status/${id}`;
    } catch (error) {
      return `https://c.vxtwitter.com/i/status/${id}`;
    }
  }
}

const twitterProvider = new TwitterProvider();

export default twitterProvider;
