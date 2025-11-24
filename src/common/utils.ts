export type PlatformType = 'Twitch' | 'Kick' | 'YouTube' | 'Streamable' | 'TikTok' | 'Twitter' | 'Instagram' | 'Reddit' | undefined;

export const getUrlFromMessage = (message: string) => {
  const urlStart = message.indexOf('http');
  if (urlStart >= 0) {
    const urlEnd = message.indexOf(' ', urlStart);
    const url = message.slice(urlStart, urlEnd > 0 ? urlEnd : undefined);
    return url;
  }

  return undefined;
};

export type ProviderMeta = {
  key: string;
  label: string;
};

const PLATFORM_META: Record<string, { label: string; providers: ProviderMeta[] }> = {
  Twitch: {
    label: 'Twitch',
    providers: [
      { key: 'twitch-clip', label: 'Twitch Clips' },
      { key: 'twitch-vod', label: 'Twitch Videos / VODs' },
    ],
  },
  Kick: {
    label: 'Kick',
    providers: [{ key: 'kick-clip', label: 'Kick Clips' }],
  },
  YouTube: {
    label: 'YouTube',
    providers: [{ key: 'youtube', label: 'YouTube' }],
  },
  Streamable: {
    label: 'Streamable',
    providers: [{ key: 'streamable', label: 'Streamable' }],
  },
  TikTok: {
    label: 'TikTok',
    providers: [{ key: 'tiktok', label: 'TikToks' }],
  },
  Twitter: {
    label: 'Twitter',
    providers: [{ key: 'twitter', label: 'X / Twitter' }],
  },
  Instagram: {
    label: 'Instagram',
    providers: [{ key: 'instagram', label: 'Instagram (Experimental)' }],
  },
  Reddit: {
    label: 'Reddit',
    providers: [{ key: 'reddit', label: 'Reddit Videos' }],
  },
};

const ALL_PROVIDERS: ProviderMeta[] = Object.values(PLATFORM_META).flatMap((p) => p.providers);

export const getProviderKeysForPlatform = (platform?: PlatformType): string[] => {
  if (!platform) return [];
  return (PLATFORM_META[platform as string]?.providers ?? []).map((p) => p.key);
};

export const getProviders = (): ProviderMeta[] => ALL_PROVIDERS.slice();
