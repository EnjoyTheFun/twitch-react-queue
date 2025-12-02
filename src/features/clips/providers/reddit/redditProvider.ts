import redditApi from '../../../../common/apis/redditApi';
import type { Clip } from '../../clipQueueSlice';
import type { ClipProvider } from '../providers';

class RedditProvider implements ClipProvider {
  name = 'reddit';
  allowNsfw: boolean = false;

  setAllowNsfw(allow: boolean) {
    this.allowNsfw = allow;
  }

  getIdFromUrl(url: string): string | undefined {
    let uri: URL;
    try {
      uri = new URL(url);
    } catch {
      return undefined;
    }

    if (uri.hostname.includes('reddit.com')) {
      // Format: https://www.reddit.com/r/{subreddit}/comments/{postId}/{title}/
      const commentsMatch = uri.pathname.match(/\/comments\/([a-z0-9]+)/i);
      if (commentsMatch?.[1]) {
        return commentsMatch[1];
      }
    }

    return undefined;
  }

  async getClipById(id: string): Promise<Clip | undefined> {
    const clipInfo = await redditApi.getClip(id, this.allowNsfw);

    if (clipInfo) {
      return {
        id,
        title: clipInfo.title,
        author: clipInfo.author,
        thumbnailUrl: clipInfo.thumbnailUrl,
        submitters: [],
        Platform: 'Reddit',
        url: clipInfo.videoUrl,
        createdAt: clipInfo.createdAt,
        duration: clipInfo.duration,
      };
    }

    return undefined;
  }

  getUrl(id: string): string | undefined {
    return `https://www.reddit.com/comments/${id}`;
  }

  getEmbedUrl(id: string): string | undefined {
    return undefined;
  }

  async getAutoplayUrl(id: string): Promise<string | undefined> {
    const clip = await this.getClipById(id);
    return clip?.url;
  }
}

const redditProvider = new RedditProvider();

export default redditProvider;
