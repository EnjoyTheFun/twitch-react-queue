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
  private resolvedRedditMap: Record<string, string> = {};

  getIdFromUrl(url: string): string | undefined {
    try {
      const uri = new URL(url);
      if (uri.hostname.includes('reddit.com') && uri.pathname.includes('/comments/')) {
        const postIdMatch = uri.pathname.match(/\/comments\/([a-z0-9]+)/i);
        if (postIdMatch?.[1]) {
          return `reddit:${postIdMatch[1]}`;
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
      const clip = await provider.getClipById(idPart);
      if (clip) {
        clip.id = id;
        return clip;
      }

      const actualUrl = await redditApi.getPostUrl(idPart);
      if (actualUrl) {
        for (const providerName of this.enabledProviders) {
          const otherProvider = this.providers[providerName];
          if (otherProvider && otherProvider.name !== 'reddit') {
            const otherId = otherProvider.getIdFromUrl(actualUrl);
            if (otherId) {
              const otherClip = await otherProvider.getClipById(otherId);
              if (otherClip) {
                this.resolvedRedditMap[id] = `${otherProvider.name}:${otherId}`;
                otherClip.id = id;
                return otherClip;
              }
            }
          }
        }
      }

      return undefined;
    }

    const clip = await provider?.getClipById(idPart);

    if (clip) {
      clip.id = id;
    }

    return clip;
  }

  getUrl(id: string): string | undefined {
    if (id.startsWith('reddit:') && this.resolvedRedditMap[id]) {
      const resolved = this.resolvedRedditMap[id];
      const [realProvider, realId] = this.getProviderAndId(resolved);
      return realProvider?.getUrl(realId);
    }
    const [provider, idPart] = this.getProviderAndId(id);
    return provider?.getUrl(idPart);
  }
  getEmbedUrl(id: string): string | undefined {
    if (id.startsWith('reddit:') && this.resolvedRedditMap[id]) {
      const resolved = this.resolvedRedditMap[id];
      const [realProvider, realId] = this.getProviderAndId(resolved);
      return realProvider?.getEmbedUrl(realId);
    }
    const [provider, idPart] = this.getProviderAndId(id);
    return provider?.getEmbedUrl(idPart);
  }
  async getAutoplayUrl(id: string): Promise<string | undefined> {
    if (id.startsWith('reddit:') && this.resolvedRedditMap[id]) {
      const resolved = this.resolvedRedditMap[id];
      const [realProvider, realId] = this.getProviderAndId(resolved);
      return await realProvider?.getAutoplayUrl(realId);
    }
    const [provider, idPart] = this.getProviderAndId(id);
    return await provider?.getAutoplayUrl(idPart);
  }

  setProviders(providers: string[]) {
    logger.info('setProviders', providers);
    this.enabledProviders = providers;
  }

  private getProviderAndId(id: string): [ClipProvider | undefined, string] {
    const [providerName, idPart] = id.split(':');
    const provider = this.providers[providerName];

    return [provider, idPart];
  }
}

const clipProvider = new CombinedClipProvider();

export default clipProvider;
