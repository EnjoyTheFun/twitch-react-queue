import { describe, it, expect } from 'vitest';
import redditProvider from './redditProvider';

describe('RedditProvider', () => {
  describe('getIdFromUrl', () => {
    it('extracts post ID from reddit.com comment URL', () => {
      const url = 'https://www.reddit.com/r/LivestreamFail/comments/1p3iybq/jack_doherty_got_a_reality_check/';
      expect(redditProvider.getIdFromUrl(url)).toBe('1p3iybq');
    });

    it('extracts post ID from old.reddit.com URL', () => {
      const url = 'https://old.reddit.com/r/LivestreamFail/comments/abc123/some_title/';
      expect(redditProvider.getIdFromUrl(url)).toBe('abc123');
    });

    it('returns undefined for v.redd.it direct video URL (handled via import path)', () => {
      const url = 'https://v.redd.it/abc123xyz';
      expect(redditProvider.getIdFromUrl(url)).toBeUndefined();
    });

    it('returns undefined for non-Reddit URL', () => {
      const url = 'https://youtube.com/watch?v=abc123';
      expect(redditProvider.getIdFromUrl(url)).toBeUndefined();
    });

    it('returns undefined for invalid URL', () => {
      const url = 'not a url';
      expect(redditProvider.getIdFromUrl(url)).toBeUndefined();
    });
  });

  describe('getUrl', () => {
    it('returns reddit comments URL for given post ID', () => {
      expect(redditProvider.getUrl('abc123')).toBe('https://www.reddit.com/comments/abc123');
    });
  });

  describe('getEmbedUrl', () => {
    it('returns undefined (embed requires fetch)', () => {
      expect(redditProvider.getEmbedUrl('abc123')).toBeUndefined();
    });
  });
});
