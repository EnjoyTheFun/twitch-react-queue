import axios from 'axios';
import type { AppMiddlewareAPI } from '../../app/store';
import { TwitchClip, TwitchGame, TwitchVideo } from '../models/twitch';

let store: AppMiddlewareAPI;
export const injectStore = (_store: AppMiddlewareAPI) => {
  store = _store;
};

const TWITCH_CLIENT_ID = import.meta.env.VITE_TWITCH_CLIENT_ID ?? '';

const twitchApiClient = axios.create({
  baseURL: 'https://api.twitch.tv/helix/',
  headers: {
    'Client-ID': TWITCH_CLIENT_ID,
  },
});

const twitchGqlClient = axios.create({
  baseURL: 'https://gql.twitch.tv/gql',
  headers: {
    'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
  },
});

const gameCache = new Map<string, TwitchGame>();

const getDirectUrl = async (id: string): Promise<string | undefined> => {
  const operationName = 'ClipsDownloadButton';
  const persistedBody = [
    {
      operationName,
      variables: { slug: id },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: '6e465bb8446e2391644cf079851c0cb1b96928435a240f07ed4b240f0acc6f1b',
        },
      },
    },
  ];

  const fullQuery =
    'query ClipsDownloadButton($slug: ID!, $params: PlaybackAccessTokenParams!) {\n' +
    '  clip(slug: $slug) {\n' +
    '    playbackAccessToken(params: $params) { signature value }\n' +
    '    videoQualities { quality sourceURL frameRate }\n' +
    '  }\n' +
    '}';

  const fullQueryVariables = {
    slug: id,
    params: { platform: 'web', playerBackend: 'mediaplayer', playerType: 'embed' },
  } as Record<string, unknown>;

  try {
    let resp = await twitchGqlClient.post('', persistedBody);
    let node = Array.isArray(resp.data) ? resp.data[0] : resp.data;

    let token = node?.data?.clip?.playbackAccessToken;
    let qualities = node?.data?.clip?.videoQualities as Array<{ sourceURL: string }> | undefined;

    if (!token || !qualities?.length) {
      const fullQueryBody = [{ operationName, variables: fullQueryVariables, query: fullQuery }];
      resp = await twitchGqlClient.post('', fullQueryBody);
      node = Array.isArray(resp.data) ? resp.data[0] : resp.data;
      token = node?.data?.clip?.playbackAccessToken;
      qualities = node?.data?.clip?.videoQualities as Array<{ sourceURL: string }> | undefined;
    }

    const playbackAccessToken = token;
    if (!playbackAccessToken || !qualities?.length) {
      console.warn('Twitch GQL returned unexpected payload for clip', id, node);
      return undefined;
    }

    const url = `${qualities[0].sourceURL}?sig=${playbackAccessToken.signature}&token=${encodeURIComponent(
      playbackAccessToken.value
    )}`;

    return url;
  } catch (e: any) {
    console.warn('getDirectUrl failed for Twitch clip', id, e?.message || e);
    return undefined;
  }
};

twitchApiClient.interceptors.request.use((request) => {
  const { token } = store?.getState().auth;
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }

  return request;
});

const getClip = async (id: string): Promise<TwitchClip> => {
  const { data } = await twitchApiClient.get<{ data: TwitchClip[] }>(`clips?id=${id}`);

  return data.data[0];
};

const getVideo = async (id: string): Promise<TwitchVideo> => {
  const { data } = await twitchApiClient.get<{ data: TwitchVideo[] }>(`videos?id=${id}`);

  return data.data[0];
};

const getGame = async (id: string): Promise<TwitchGame | undefined> => {
  if (!id) return undefined;
  const cached = gameCache.get(id);
  if (cached) return cached;

  try {
    const { data } = await twitchApiClient.get<{ data: TwitchGame[] }>(`games?id=${id}`);
    const game = data?.data?.[0];
    if (game) gameCache.set(id, game);
    return game;
  } catch {
    return undefined;
  }
};

const twitchApi = {
  getClip,
  getVideo,
  getGame,
  getDirectUrl,
};

export default twitchApi;
