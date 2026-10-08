import { createAction } from '@reduxjs/toolkit';

export interface Userstate {
  username: string;
  mod?: boolean;
  broadcaster?: boolean;
  subscriber?: boolean;
  vip?: boolean;
}

export type UrlSourceType = 'standard' | 'channelPoints' | 'powerUp';

export const urlReceived = createAction<{
  url: string;
  userstate: Userstate;
  fromRedemption?: boolean;
  rewardId?: string;
  sourceType?: UrlSourceType;
  note?: string;
}>('twitchChat/urlReceived');
export const urlDeleted = createAction<string>('twitchChat/urlDeleted');
export const userTimedOut = createAction<string>('twitchChat/userTimedOut');
export const urlEnqueue = createAction<{ url: string; userstate: Userstate }>('twitchChat/urlEnqueue');
