import { createLogger } from '../../../common/logging';
import { Clip } from '../clipQueueSlice';
import streamableProvider from './streamable/streamableProvider';
import twitchClipProvider from './twitchClip/twitchClipProvider';
import twitchVodProvider from './twitchVod/twitchVodProvider';
import youtubeProvider from './youtube/youtubeProvider';
import kickClipProvider from './kickClip/kickClipProvider';
import tiktokProvider from './tiktok/tiktokProvider';
import twitterProvider from './twitter/twitterProvider';
import instagramProvider from './instagram/instagramProvider';
import redditProvider from './reddit/redditProvider';
import redditApi from '../../../common/apis/redditApi';
const logger = createLogger('CombinedClipProvider');

export interface ClipProvider {
  name: string;
  getIdFromUrl(url: string): string | undefined;
  getClipById(id: string): Promise<Clip | undefined>;
  getUrl(id: string): string | undefined;
  getEmbedUrl(id: string): string | undefined;
  getAutoplayUrl(id: string): Promise<string | undefined>;
}

class CombinedClipProvider implements ClipProvider {
  name = 'combined';
  providers = {
    [twitchClipProvider.name]: twitchClipProvider,
    [twitchVodProvider.name]: twitchVodProvider,
    [youtubeProvider.name]: youtubeProvider,
    [streamableProvider.name]: streamableProvider,
    [kickClipProvider.name]: kickClipProvider,
    [tiktokProvider.name]: tiktokProvider,
    [twitterProvider.name]: twitterProvider,
    [instagramProvider.name]: instagramProvider,
    [redditProvider.name]: redditProvider,
  };
  enabledProviders: string[] = [];
  allowRedditNsfw: boolean = false;
  private resolvedRedditMap: Record<string, string> = {};
  private redditPermalinkMap: Record<string, string> = {};

  private getRedditFallbackTitle(permalink: string, idPart: string): string {
    const slugMatch = permalink.match(/\/comments\/[a-z0-9]+\/([^/?#]+)/i);
    if (!slugMatch?.[1]) return `Reddit post ${idPart}`;

    const title = decodeURIComponent(slugMatch[1])
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return title || `Reddit post ${idPart}`;
  }

  getIdFromUrl(url: string): string | undefined {
    try {
      const uri = new URL(url);
      if (uri.hostname.includes('reddit.com') && uri.pathname.includes('/comments/')) {
        const postIdMatch = uri.pathname.match(/\/comments\/([a-z0-9]+)/i);
        if (postIdMatch?.[1]) {
          const redditId = `reddit:${postIdMatch[1]}`;
          this.redditPermalinkMap[redditId] = `${uri.origin}${uri.pathname}${uri.search}`;
          return redditId;
        }
      }
    } catch {
    }

    for (const providerName of this.enabledProviders) {
      const provider = this.providers[providerName];
      if (provider && provider.name !== 'reddit') {
        const id = provider.getIdFromUrl(url);
        if (id) {
          return `${provider.name}:${id}`;
        }
      }
    }
    return undefined;
  }

  async getClipById(id: string): Promise<Clip | undefined> {
    const [provider, idPart] = this.getProviderAndId(id);

    if (provider?.name === 'reddit') {
      const permalink = this.redditPermalinkMap[id] || `https://www.reddit.com/comments/${idPart}`;
      const clipInfo = await redditApi.getClipFromPermalink(permalink, this.allowRedditNsfw);

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

      return {
        id,
        title: this.getRedditFallbackTitle(permalink, idPart),
        author: 'reddit',
        submitters: [],
        Platform: 'Reddit',
        url: permalink,
      };
    }

    const clip = await provider?.getClipById(idPart);

    if (clip) {
      clip.id = id;
    }

    return clip;
  }

  getUrl(id: string): string | undefined {
    if (id.startsWith('reddit:')) {
      return this.redditPermalinkMap[id] || `https://www.reddit.com/comments/${id.split(':')[1]}`;
    }

    const resolved = this.resolveReddit(id);
    if (resolved) {
      const [realProvider, realId] = resolved;
      return realProvider?.getUrl(realId);
    }
    const [provider, idPart] = this.getProviderAndId(id);
    return provider?.getUrl(idPart);
  }

  getEmbedUrl(id: string): string | undefined {
    if (id.startsWith('reddit:')) {
      const permalink = this.getUrl(id);
      if (!permalink) return undefined;

      try {
        const uri = new URL(permalink);
        const query = uri.search ? `${uri.search}&` : '?';
        return `https://www.redditmedia.com${uri.pathname}${query}ref_source=embed&ref=share&embed=true`;
      } catch {
        return undefined;
      }
    }

    const resolved = this.resolveReddit(id);
    if (resolved) {
      const [realProvider, realId] = resolved;
      return realProvider?.getEmbedUrl(realId);
    }
    const [provider, idPart] = this.getProviderAndId(id);
    return provider?.getEmbedUrl(idPart);
  }

  async getAutoplayUrl(id: string): Promise<string | undefined> {
    const resolved = this.resolveReddit(id);
    if (resolved) {
      const [realProvider, realId] = resolved;
      return await realProvider?.getAutoplayUrl(realId);
    }
    const [provider, idPart] = this.getProviderAndId(id);
    return await provider?.getAutoplayUrl(idPart);
  }

  setProviders(providers: string[]) {
    logger.info('setProviders', providers);
    this.enabledProviders = providers;
  }

  setAllowRedditNsfw(allow: boolean) {
    this.allowRedditNsfw = allow;
    redditProvider.setAllowNsfw(allow);
  }

  // Rebuild in-memory mapping from persisted clips after rehydrate (for Reddit media)
  restoreResolvedRedditMap(clipsById?: Record<string, Clip>) {
    if (!clipsById) return;
    try {
      for (const [id, clip] of Object.entries(clipsById)) {
        if (!id.startsWith('reddit:')) continue;
        if (!clip || !clip.url) continue;

        try {
          const uri = new URL(clip.url);
          if (uri.hostname.includes('reddit.com') && uri.pathname.includes('/comments/')) {
            this.redditPermalinkMap[id] = `${uri.origin}${uri.pathname}${uri.search}`;
          }
        } catch (e) { }

        // If the clip was actually from another platform, try to detect it
        // by asking each enabled provider to extract an id from the stored url
        for (const providerName of this.enabledProviders) {
          const provider = this.providers[providerName];
          if (!provider || provider.name === 'reddit') continue;
          try {
            const otherId = provider.getIdFromUrl(clip.url!);
            if (otherId) {
              this.resolvedRedditMap[id] = `${provider.name}:${otherId}`;
              break;
            }
          } catch (e) { }
        }
      }
    } catch (e) { }
  }

  private getProviderAndId(id: string): [ClipProvider | undefined, string] {
    const [providerName, idPart] = id.split(':');
    const provider = this.providers[providerName];

    return [provider, idPart];
  }

  private resolveReddit(id: string): [ClipProvider | undefined, string] | undefined {
    if (!id.startsWith('reddit:')) return undefined;
    const mapped = this.resolvedRedditMap[id];
    if (!mapped) return undefined;
    return this.getProviderAndId(mapped);
  }
}

const clipProvider = new CombinedClipProvider();

export default clipProvider;
