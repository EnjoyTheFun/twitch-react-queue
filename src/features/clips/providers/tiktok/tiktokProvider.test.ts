import { afterEach, describe, expect, it, vi } from 'vitest';
import tiktokApi from '../../../../common/apis/tiktokApi';
import tiktokProvider from './tiktokProvider';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TikTokProvider', () => {
  it('gets clip id from www.TikTok.com url', () => {
    expect(tiktokProvider.getIdFromUrl('https://www.tiktok.com/@scout2015/video/6718335390845095173')).toEqual(
      'l|6718335390845095173'
    );
  });
});

describe('TikTokProvider.getClipById', () => {
  it('uses fallback title and leaves the thumbnail empty when metadata is missing', async () => {
    vi.spyOn(tiktokApi, 'getClip').mockResolvedValue({});

    const clip = await tiktokProvider.getClipById('l|7332973688431840558');

    expect(clip?.title).toBe('TikTok video');
    expect(clip?.thumbnailUrl).toBeUndefined();
    expect(clip?.author).toBe('TikTok');
  });
});
