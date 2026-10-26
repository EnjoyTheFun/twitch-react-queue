import axios from 'axios';
import type { TikTokOEmbedResponse, TikwmResponse } from '../models/tiktok';

type TikwmData = NonNullable<TikwmResponse['data']>;

// TikTok's oEmbed no longer returns title/thumbnail/author
const TIKWM_API_URL = 'https://www.tikwm.com/api/';
const TIKWM_MIN_INTERVAL_MS = 1100;
const TIKWM_MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let tikwmQueue: Promise<unknown> = Promise.resolve();
let lastTikwmRequestAt = 0;
const tikwmCache = new Map<string, Promise<TikwmData | undefined>>();

const enqueueTikwmRequest = <T>(task: () => Promise<T>): Promise<T> => {
  const run = tikwmQueue.then(async () => {
    const wait = lastTikwmRequestAt + TIKWM_MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    try {
      return await task();
    } finally {
      lastTikwmRequestAt = Date.now();
    }
  });
  tikwmQueue = run.catch(() => undefined);
  return run;
};

const fetchTikwmMetadata = async (videoId: string): Promise<TikwmData | undefined> => {
  for (let attempt = 0; attempt < TIKWM_MAX_ATTEMPTS; attempt++) {
    try {
      const body = await enqueueTikwmRequest(async () => {
        const { data } = await axios.get<TikwmResponse>(TIKWM_API_URL, {
          params: { url: `https://www.tiktok.com/@_/video/${videoId}` },
          timeout: 10000,
        });
        return data;
      });
      if (body?.code === 0 && body.data) return body.data;
      if (!/limit/i.test(body?.msg ?? '')) return undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const getTikwmMetadata = (videoId: string): Promise<TikwmData | undefined> => {
  const cached = tikwmCache.get(videoId);
  if (cached) return cached;

  const request = fetchTikwmMetadata(videoId).then((data) => {
    if (!data) tikwmCache.delete(videoId);
    return data;
  });
  tikwmCache.set(videoId, request);
  return request;
};

const oembedCache = new Map<string, Promise<TikTokOEmbedResponse | undefined>>();

const fetchOEmbed = async (id: string): Promise<TikTokOEmbedResponse | undefined> => {
  try {
    let url: string;

    if (id.startsWith('l|')) {
      const realId = id.split('|')[1];
      if (!realId) return undefined;
      url = `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@_/video/${realId}`;
    } else if (id.startsWith('s|')) {
      const realId = id.split('|')[1];
      if (!realId) return undefined;
      url = `https://www.tiktok.com/oembed?url=https://vm.tiktok.com/${realId}`;
    } else {
      url = `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@_/video/${id}`;
    }

    const { data } = await axios.get<TikTokOEmbedResponse>(url);
    return data;
  } catch {
    return undefined;
  }
};

const getOEmbed = (id: string): Promise<TikTokOEmbedResponse | undefined> => {
  const cached = oembedCache.get(id);
  if (cached) return cached;

  const request = fetchOEmbed(id).then((data) => {
    if (!data) oembedCache.delete(id);
    return data;
  });
  oembedCache.set(id, request);
  return request;
};

const getVideoId = (id: string, oembed: TikTokOEmbedResponse): string | undefined => {
  if (oembed.embed_product_id) return oembed.embed_product_id;
  if (id.startsWith('s|')) return undefined;
  return id.startsWith('l|') ? id.split('|')[1] : id;
};

const getClip = async (id: string): Promise<TikTokOEmbedResponse | undefined> => {
  const oembed = await getOEmbed(id);
  if (!oembed) return undefined;
  if (oembed.title && oembed.thumbnail_url && oembed.author_name) return oembed;

  const videoId = getVideoId(id, oembed);
  const metadata = videoId ? await getTikwmMetadata(videoId) : undefined;
  if (!metadata) return oembed;

  const authorHandle = metadata.author?.unique_id;
  return {
    ...oembed,
    title: oembed.title || metadata.title?.trim() || undefined,
    thumbnail_url: oembed.thumbnail_url || metadata.cover || metadata.origin_cover || undefined,
    author_name: oembed.author_name || metadata.author?.nickname || authorHandle || undefined,
    author_url: oembed.author_url || (authorHandle ? `https://www.tiktok.com/@${authorHandle}` : undefined),
  };
};

const tiktokApi = {
  getClip,
  getOEmbed,
};

export default tiktokApi;
