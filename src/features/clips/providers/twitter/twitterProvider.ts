import type { Clip } from '../../clipQueueSlice';
import type { ClipProvider } from '../providers';
import twitterApi, { getClipFromTweet, getDirectMediaUrl } from '../../../../common/apis/twitterApi';

class TwitterProvider implements ClipProvider {
  name = 'twitter';

  getIdFromUrl(url: string): string | undefined {
    return twitterApi.extractIdFromUrl(url) ?? undefined;
  }

  async getClipById(id: string): Promise<Clip | undefined> {
    return await getClipFromTweet(id);
  }

  getUrl(id: string): string | undefined {
    return `https://twitter.com/i/web/status/${id}`;
  }

  getEmbedUrl(id: string): string | undefined {
    return `https://c.vxtwitter.com/i/status/${id}.mp4`;
  }

  async getAutoplayUrl(id: string): Promise<string | undefined> {
    const directUrl = await getDirectMediaUrl(id);
    return directUrl ?? (await this.getClipById(id))?.url;
  }
}

const twitterProvider = new TwitterProvider();
export default twitterProvider;
