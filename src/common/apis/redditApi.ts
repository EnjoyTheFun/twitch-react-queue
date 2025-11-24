import axios from 'axios';
import type { RedditResponse, RedditClipInfo, RedditSort } from '../models/reddit';

const redditApiClient = axios.create({
  baseURL: 'https://www.reddit.com',
  timeout: 10000,
});

const getClip = async (id: string): Promise<RedditClipInfo | undefined> => {
  try {
    const { data } = await redditApiClient.get<RedditResponse>(`/comments/${id}.json`);

    if (!data || !Array.isArray(data) || data.length === 0) {
      return undefined;
    }

    const postData = data[0]?.data?.children?.[0]?.data;
    if (!postData) {
      return undefined;
    }

    const videoInfo = postData.secure_media?.reddit_video || postData.media?.reddit_video;
    if (!videoInfo?.fallback_url) {
      return undefined;
    }

    let thumbnailUrl = postData.thumbnail;
    if (thumbnailUrl === 'default' || thumbnailUrl === 'self' || !thumbnailUrl?.startsWith('http')) {
      thumbnailUrl = postData.preview?.images?.[0]?.source?.url;
    }
    if (thumbnailUrl) {
      thumbnailUrl = thumbnailUrl.replace(/&amp;/g, '&');
    }

    let videoUrl = videoInfo.fallback_url;
    if (videoInfo.has_audio && videoInfo.hls_url) {
      videoUrl = videoInfo.hls_url.replace(/&amp;/g, '&');
    }

    return {
      id,
      title: postData.title || `Reddit video ${id}`,
      author: postData.author || 'Unknown',
      thumbnailUrl,
      videoUrl,
      duration: videoInfo.duration,
      createdAt: postData.created_utc ? new Date(postData.created_utc * 1000).toISOString() : undefined,
      permalink: postData.permalink,
    };
  } catch (error) {
    console.error('Failed to fetch Reddit video:', id, error);
    return undefined;
  }
};

const getSubredditPosts = async (
  subreddit: string,
  sort: RedditSort = 'top',
  limit: number = 100,
  timeframe: string = 'day'
): Promise<Array<{ url: string; username: string; title: string; postId: string }>> => {
  try {
    const url = `/r/${subreddit}/${sort}.json?limit=${limit}&t=${timeframe}`;
    const { data } = await redditApiClient.get<RedditResponse>(url);

    if (!data?.data?.children || !Array.isArray(data.data.children)) {
      console.warn('Invalid response format from Reddit API');
      return [];
    }

    const posts: Array<{ url: string; username: string; title: string; postId: string }> = [];

    for (const post of data.data.children) {
      const postData = post.data;
      let url = postData.url_overridden_by_dest || postData.url;

      if (!url) continue;

      const domain = postData.domain || '';
      const isVideoPost =
        postData.is_video ||
        domain.includes('twitch.tv') ||
        domain.includes('kick.com') ||
        domain.includes('youtube.com') ||
        domain.includes('youtu.be') ||
        domain.includes('tiktok.com') ||
        domain.includes('twitter.com') ||
        domain.includes('x.com') ||
        domain.includes('v.redd.it') ||
        domain.includes('streamable.com') ||
        domain.includes('instagram.com');

      if (isVideoPost) {
        if (domain.includes('v.redd.it')) {
          const hasMedia = postData.secure_media?.reddit_video || postData.media?.reddit_video;
          if (!hasMedia) {
            continue;
          }
          if (postData.permalink) {
            url = `https://www.reddit.com${postData.permalink}`;
          }
        }

        posts.push({
          url,
          username: postData.author || 'reddit',
          title: postData.title || '',
          postId: postData.id || '',
        });
      }
    }

    return posts;
  } catch (error) {
    console.error('Failed to fetch Reddit posts:', error);
    return [];
  }
};

const redditApi = {
  getClip,
  getSubredditPosts,
  getPostUrl: async (postId: string): Promise<string | undefined> => {
    try {
      const { data } = await redditApiClient.get<RedditResponse>(`/comments/${postId}.json`);
      if (!data || !Array.isArray(data) || data.length === 0) {
        return undefined;
      }
      const postData = data[0]?.data?.children?.[0]?.data;
      return postData?.url_overridden_by_dest || postData?.url;
    } catch (error) {
      console.error('Failed to fetch Reddit post URL:', postId, error);
      return undefined;
    }
  },
};

export default redditApi;
