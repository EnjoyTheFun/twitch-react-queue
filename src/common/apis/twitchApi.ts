import axios, { AxiosError } from 'axios';
import type { AppMiddlewareAPI } from '../../app/store';
import { TwitchClip, TwitchGame, TwitchVideo } from '../models/twitch';

let store: AppMiddlewareAPI;
export const injectStore = (_store: AppMiddlewareAPI) => {
  store = _store;
};

const TWITCH_CLIENT_ID = process.env.REACT_APP_TWITCH_CLIENT_ID ?? '';

const twitchApiClient = axios.create({
  baseURL: 'https://api.twitch.tv/helix/',
  timeout: 12000, // 12 second timeout for API calls
  headers: {
    'Client-ID': TWITCH_CLIENT_ID,
    'Accept': 'application/json',
  },
});

const twitchGqlClient = axios.create({
  baseURL: 'https://gql.twitch.tv/gql',
  timeout: 15000, // 15 second timeout for GraphQL
  headers: {
    'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

const GQL_CLIP_QUERY = [
  {
    operationName: 'ClipsDownloadButton',
    variables: {
      slug: '',
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: '6e465bb8446e2391644cf079851c0cb1b96928435a240f07ed4b240f0acc6f1b',
      },
    },
  },
];

const getDirectUrl = async (id: string): Promise<string | undefined> => {
  if (!id?.trim()) {
    return undefined;
  }

  try {
    const queryData = [...GQL_CLIP_QUERY];
    queryData[0].variables.slug = id;

    const resp = await twitchGqlClient.post('', queryData);
    const [respData] = resp.data;

    if (!respData?.data?.clip) {
      console.warn(`No clip data found for Twitch clip ID: ${id}`);
      return undefined;
    }

    const { playbackAccessToken, videoQualities } = respData.data.clip;

    if (!videoQualities?.[0]?.sourceURL || !playbackAccessToken) {
      console.warn(`Invalid clip data structure for Twitch clip ID: ${id}`);
      return undefined;
    }

    const url = `${videoQualities[0].sourceURL}?sig=${playbackAccessToken.signature}&token=${encodeURIComponent(playbackAccessToken.value)}`;

    return url;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.warn(`Failed to fetch Twitch direct URL for ${id}:`, {
      status: axiosError.response?.status,
      message: axiosError.message,
    });
    return undefined;
  }
};

twitchApiClient.interceptors.request.use(
  (request) => {
    const { token } = store?.getState()?.auth || {};
    if (token) {
      request.headers = { Authorization: `Bearer ${token}`, ...request.headers };
    }
    return request;
  },
  (error) => {
    console.warn('Twitch API request interceptor error:', error);
    return Promise.reject(error);
  }
);

const getClip = async (id: string): Promise<TwitchClip | undefined> => {
  if (!id?.trim()) {
    return undefined;
  }

  try {
    const { data } = await twitchApiClient.get<{ data: TwitchClip[] }>(`clips?id=${id}`);
    const clipData = data.data?.[0];

    if (!clipData) {
      console.warn(`No clip found for Twitch ID: ${id}`);
      return undefined;
    }

    return clipData;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.warn(`Failed to fetch Twitch clip ${id}:`, {
      status: axiosError.response?.status,
      message: axiosError.message,
    });
    return undefined;
  }
};

const getVideo = async (id: string): Promise<TwitchVideo | undefined> => {
  if (!id?.trim()) {
    return undefined;
  }

  try {
    const { data } = await twitchApiClient.get<{ data: TwitchVideo[] }>(`videos?id=${id}`);
    const videoData = data.data?.[0];

    if (!videoData) {
      console.warn(`No video found for Twitch ID: ${id}`);
      return undefined;
    }

    return videoData;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.warn(`Failed to fetch Twitch video ${id}:`, {
      status: axiosError.response?.status,
      message: axiosError.message,
    });
    return undefined;
  }
};

const getGame = async (id: string): Promise<TwitchGame | undefined> => {
  if (!id?.trim()) {
    return undefined;
  }

  try {
    const { data } = await twitchApiClient.get<{ data: TwitchGame[] }>(`games?id=${id}`);
    const gameData = data.data?.[0];

    if (!gameData) {
      console.warn(`No game found for Twitch ID: ${id}`);
      return undefined;
    }

    return gameData;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.warn(`Failed to fetch Twitch game ${id}:`, {
      status: axiosError.response?.status,
      message: axiosError.message,
    });
    return undefined;
  }
};

const extractClipIdFromUrl = (url: string): string | null => {
  if (!url?.trim()) return null;

  try {
    const urlObj = new URL(url);

    if (urlObj.hostname === 'clips.twitch.tv') {
      return urlObj.pathname.slice(1);
    }

    if (urlObj.hostname.includes('twitch.tv')) {
      const match = urlObj.pathname.match(/\/\w+\/clip\/(\w+)/);
      return match?.[1] ?? null;
    }

    return null;
  } catch {
    return null;
  }
};

const twitchApi = {
  getClip,
  getVideo,
  getGame,
  getDirectUrl,
  extractClipIdFromUrl,
};

export default twitchApi;
