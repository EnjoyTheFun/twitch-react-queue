import { Middleware, isAnyOf } from '@reduxjs/toolkit';
import type { AppMiddlewareAPI, RootState } from '../../app/store';
import { Client, ChatUserstate, DeleteUserstate } from 'tmi.js';
import { logout, authenticateWithToken, validateToken } from '../auth/authSlice';
import { channelChanged, settingsChanged, channelPointsRedemptionObserved } from '../settings/settingsSlice';
import { createLogger } from '../../common/logging';
import { getUrlFromMessage, getNoteFromMessage } from '../../common/utils';
import { showNotification } from '@mantine/notifications';
import { Userstate, UrlSourceType, urlReceived, urlDeleted, userTimedOut } from './actions';
import { processCommand } from './chatCommands';
import { pruneOldMemory } from '../clips/clipQueueSlice';
import { pollVoteRecorded } from './pollSlice';
import { chatConnectionStatusChanged } from './chatConnectionSlice';
import { highlightClipByIndex } from '../clips/clipQueueSlice';

const logger = createLogger('Twitch Chat');
let lastRedemptionDispatch = '';
let lastRedemptionDispatchAt = 0;
const DEFAULT_TARGET_REWARD_NAME = 'react';
const LISTEN_AUTO_STOP_MS = 30 * 1000;
const PENDING_REDEMPTION_WINDOW_MS = 60 * 1000;
const pendingRedemptionByUser = new Map<string, number>();

const getStringField = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const getNumberField = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const getRedemptionInput = (tags: Record<string, unknown> = {}): string | undefined => {
  return (
    getStringField(tags['msg-param-user-input']) ||
    getStringField(tags['message']) ||
    getStringField(tags['user-input']) ||
    getStringField(tags['input'])
  );
};

const getRedemptionId = (tags: Record<string, unknown> = {}): string | undefined => {
  return (
    getStringField(tags['custom-reward-id']) ||
    getStringField(tags['msg-param-custom-reward-id']) ||
    getStringField(tags['reward-id'])
  );
};

const highlightForRedemption = (storeApi: AppMiddlewareAPI, redemptionId: string | undefined, input: string | undefined): void => {
  const configuredId = (storeApi.getState().settings.highlightRedemptionId || '').trim().toLowerCase();
  if (!configuredId || !redemptionId || redemptionId.trim().toLowerCase() !== configuredId || !input) {
    return;
  }

  const number = input.match(/\d+/)?.[0];
  if (number) {
    storeApi.dispatch(highlightClipByIndex(number));
  }
};

const getRedemptionName = (type: string, tags: Record<string, unknown> = {}): string | undefined => {
  const candidates = [
    getStringField(type),
    getStringField(tags['msg-param-reward-title']),
    getStringField(tags['reward-name']),
    getStringField(tags['reward-title']),
    getStringField(tags['msg-id']),
  ].filter((value): value is string => !!value);

  if (!candidates.length) {
    return undefined;
  }

  const configuredRewardName = getStringField(tags.__configuredRewardName) || DEFAULT_TARGET_REWARD_NAME;
  const normalizedTarget = configuredRewardName.toLowerCase();
  const exactMatch = candidates.find((candidate) => candidate.trim().toLowerCase() === normalizedTarget);
  if (exactMatch) {
    return exactMatch;
  }

  const partialMatch = candidates.find((candidate) => candidate.trim().toLowerCase().includes(normalizedTarget));
  if (partialMatch) {
    return partialMatch;
  }

  return undefined;
};

const getAnyRedemptionName = (type: string, tags: Record<string, unknown> = {}): string | undefined => {
  return [
    getStringField(type),
    getStringField(tags['msg-param-reward-title']),
    getStringField(tags['reward-name']),
    getStringField(tags['reward-title']),
  ].find((value): value is string => !!value);
};

const isTargetRedemption = (type: string, tags: Record<string, unknown> = {}): boolean => {
  const configuredRewardId = (tags.__configuredRewardId as string | undefined) || '';
  const configuredRewardName = (tags.__configuredRewardName as string | undefined) || DEFAULT_TARGET_REWARD_NAME;
  const redemptionId = (getRedemptionId(tags) || '').toLowerCase();
  if (configuredRewardId) {
    if (redemptionId && redemptionId === configuredRewardId) {
      return true;
    }

    // If the configured reward id is actually a reward title (e.g. "react"), allow name fallback.
    const matchedByName = getRedemptionName(type, tags);
    return !!matchedByName && matchedByName.trim().toLowerCase() === configuredRewardId;
  }

  const matchedByName = getRedemptionName(type, {
    ...tags,
    __configuredRewardName: configuredRewardName,
  });

  return !!matchedByName;
};

const withRewardConfig = (storeApi: AppMiddlewareAPI, tags: Record<string, unknown>): Record<string, unknown> => {
  const settingsRewardId = ((storeApi.getState().settings.channelPointsRewardId || '') as string).trim().toLowerCase();
  const powerUpTypeId = ((storeApi.getState().settings.powerUpRedemptionTypeId || '') as string).trim().toLowerCase();

  return {
    ...tags,
    __configuredRewardId: settingsRewardId,
    __configuredRewardName: DEFAULT_TARGET_REWARD_NAME,
    __configuredPowerUpTypeId: powerUpTypeId,
  };
};

const isDuplicateRedemptionLink = (username: string, url: string): boolean => {
  const now = Date.now();
  const key = `${username.toLowerCase()}|${url.toLowerCase()}`;
  const duplicate = lastRedemptionDispatch === key && now - lastRedemptionDispatchAt < 2000;

  if (!duplicate) {
    lastRedemptionDispatch = key;
    lastRedemptionDispatchAt = now;
  }

  return duplicate;
};

const normalizeUser = (username: string): string => username.trim().toLowerCase();

const markPendingRedemption = (username: string): void => {
  const user = normalizeUser(username);
  if (!user) return;
  pendingRedemptionByUser.set(user, Date.now());
};

const consumePendingRedemption = (username: string): boolean => {
  const user = normalizeUser(username);
  if (!user) return false;

  const createdAt = pendingRedemptionByUser.get(user);
  if (!createdAt) return false;

  pendingRedemptionByUser.delete(user);
  return Date.now() - createdAt <= PENDING_REDEMPTION_WINDOW_MS;
};

const shouldObserveRedemptions = (storeApi: AppMiddlewareAPI): boolean => {
  return storeApi.getState().settings.listenForChannelPointsRewardIds === true;
};

const getPowerUpIdentifiers = (tags: Record<string, unknown> = {}): string[] => {
  const directKeys = [
    'msg-id',
    'msg-param-power-up-id',
    'msg-param-power-up-type',
    'power-up-id',
    'power-up-type',
    'pinned-chat-paid-level',
    'pinned-chat-paid-currency',
    'pinned-chat-paid-id',
    'pinned-chat-paid-message-id',
  ];

  const directIdentifiers = directKeys
    .map((key) => getStringField(tags[key]))
    .filter((value): value is string => !!value)
    .map((value) => value.trim().toLowerCase());

  const dynamicIdentifiers = Object.keys(tags)
    .filter((key) => key.toLowerCase().includes('power-up') || key.toLowerCase().includes('pinned-chat-paid'))
    .map((key) => getStringField(tags[key]))
    .filter((value): value is string => !!value)
    .map((value) => value.trim().toLowerCase());

  return Array.from(new Set([...directIdentifiers, ...dynamicIdentifiers])).filter(Boolean);
};

const getPowerUpTypeIdentifier = (tags: Record<string, unknown> = {}): string | undefined => {
  const identifiers = getPowerUpIdentifiers(tags);
  return identifiers[0];
};

const isPowerUpMessage = (tags: Record<string, unknown> = {}): boolean => {
  const numericAmountKeys = [
    'bits',
    'cheer-amount',
    'msg-param-amount',
    'pinned-chat-paid-amount',
    'pinned-chat-paid-canonical-amount',
  ];

  const hasAmount = numericAmountKeys.some((key) => (getNumberField(tags[key]) || 0) > 0);
  if (hasAmount) {
    return true;
  }

  return getPowerUpIdentifiers(tags).length > 0;
};

const isPowerUpRedemption = (tags: Record<string, unknown> = {}): boolean => {
  const configuredPowerUpType = ((tags.__configuredPowerUpTypeId as string | undefined) || '').trim().toLowerCase();
  const hasPowerUpMessageShape = isPowerUpMessage(tags);
  const powerUpIdentifiers = getPowerUpIdentifiers(tags);
  if (!hasPowerUpMessageShape) {
    return false;
  }

  const matchesConfiguredPowerUp = !configuredPowerUpType || powerUpIdentifiers.some((identifier) => {
    return identifier === configuredPowerUpType || identifier.includes(configuredPowerUpType) || configuredPowerUpType.includes(identifier);
  });
  if (!matchesConfiguredPowerUp) {
    return false;
  }

  return true;
};

const createClient = ({ token, username }: { token: string; username: string }) => {
  const client = new Client({
    options: {
      debug: import.meta.env.VITE_LOG_LEVEL === 'debug',
      messagesLogLevel: 'debug',
      skipUpdatingEmotesets: true,
      skipMembership: true,
    },
    logger: {
      debug: logger.debug.bind(logger),
      error: logger.error.bind(logger),
      info: logger.info.bind(logger),
      warn: logger.warn.bind(logger),
    } as any,
    identity: {
      username: username,
      password: `oauth:${token}`,
    },
    connection: {
      reconnect: true,
      secure: true,
    },
  });

  return client;
};

const handleMessage =
  (storeApi: AppMiddlewareAPI) => (channel: string, chatUserstate: ChatUserstate, message: string, self: boolean) => {
    const tags = chatUserstate as unknown as Record<string, unknown>;
    const { commandPrefix } = storeApi.getState().settings;
    const blockedSubmitters = storeApi.getState().settings.blockedSubmitters || [];
    const blockedSubmittersSet = new Set(blockedSubmitters.map((c: string) => c.toLowerCase()));

    const senderUsername = (chatUserstate.username || '').toLowerCase();
    const senderDisplay = (chatUserstate['display-name'] || '').toLowerCase();
    if (blockedSubmittersSet.has(senderUsername) || (senderDisplay && blockedSubmittersSet.has(senderDisplay))) {
      return;
    }

    const userstate: Userstate = {
      username: chatUserstate['display-name'] ?? chatUserstate.username ?? 'Twitch Chat User',
      mod: chatUserstate.mod,
      subscriber: chatUserstate.subscriber,
      broadcaster: chatUserstate.badges?.broadcaster ? true : undefined,
      vip: chatUserstate.badges?.vip ? true : undefined,
    };

    try {
      storeApi.dispatch({ type: 'chatUsers/chatUserUpdated', payload: { username: userstate.username, flags: { mod: userstate.mod, vip: userstate.vip, broadcaster: userstate.broadcaster } } });
    } catch (e) {
      // ignore
    }

    if (message.startsWith(commandPrefix)) {
      const remainder = message.substring(commandPrefix.length);
      const normalized = remainder.startsWith(' ') ? remainder.trim() : remainder.replace(/^([a-zA-Z]+)(\s?)/, '$1 ');
      const [command, ...args] = normalized.split(' ');
      processCommand(storeApi.dispatch, { command, args, userstate });
      return;
    }

    // count poll votes when poll is active using customizable keywords
    if (storeApi.getState().poll?.active) {
      const { voteYeaKeyword = 'VoteYea', voteNayKeyword = 'VoteNay' } = storeApi.getState().settings || {};
      const yeaKey = (voteYeaKeyword || 'VoteYea').toLowerCase().trim();
      const nayKey = (voteNayKeyword || 'VoteNay').toLowerCase().trim();

      const lowerMsg = message.toLowerCase();
      if (yeaKey && lowerMsg.includes(yeaKey)) {
        storeApi.dispatch(pollVoteRecorded({ username: userstate.username, vote: 'yea' }));
      } else if (nayKey && lowerMsg.includes(nayKey)) {
        storeApi.dispatch(pollVoteRecorded({ username: userstate.username, vote: 'nay' }));
      }
    }

    const configuredTags = withRewardConfig(storeApi, tags);
    const redemptionId = getRedemptionId(configuredTags);
    highlightForRedemption(storeApi, redemptionId, getRedemptionInput(configuredTags) || message);
    const rewardTitle = getAnyRedemptionName('', configuredTags);
    const configuredRewardId = ((configuredTags.__configuredRewardId as string | undefined) || '').trim().toLowerCase();
    const powerUpObservedId = getPowerUpTypeIdentifier(configuredTags);
    const configuredPowerUpType = ((configuredTags.__configuredPowerUpTypeId as string | undefined) || '').trim().toLowerCase();
    const powerUpIdentifiers = getPowerUpIdentifiers(configuredTags);
    const powerUpRedemptionsEnabled = storeApi.getState().settings.allowPowerUpRedemptionUrls === true;
    const looksLikePowerUpMessage = isPowerUpMessage(configuredTags);
    const matchedPowerUpRedemption = powerUpRedemptionsEnabled && isPowerUpRedemption(configuredTags);
    const matchedPowerUpByRewardId = !!redemptionId && !!configuredPowerUpType && redemptionId.toLowerCase() === configuredPowerUpType;
    const allowAnyPowerUpByRewardId = powerUpRedemptionsEnabled && !configuredPowerUpType && !!redemptionId;

    if (shouldObserveRedemptions(storeApi) && (redemptionId || rewardTitle || powerUpObservedId)) {
      storeApi.dispatch(channelPointsRedemptionObserved({
        id: redemptionId || powerUpObservedId,
        title: rewardTitle,
        source: 'message',
      }));
    }

    const url = getUrlFromMessage(message);
    if (url) {
      const matchedTargetReward = redemptionId ? isTargetRedemption('', configuredTags) : false;
      const matchedPendingRedemption = !matchedTargetReward && consumePendingRedemption(senderUsername || userstate.username);
      const hasKnownConfiguredRewardMatch = matchedTargetReward || matchedPowerUpByRewardId;

      // When specific reward IDs are configured, drop unmatched redemption IDs so they cannot fall back to standard URLs.
      if (redemptionId && (configuredRewardId || configuredPowerUpType) && !hasKnownConfiguredRewardMatch && !allowAnyPowerUpByRewardId) {
        return;
      }

      let sourceType: UrlSourceType = 'standard';
      if (matchedTargetReward || matchedPendingRedemption) {
        sourceType = 'channelPoints';
      } else if (matchedPowerUpByRewardId || looksLikePowerUpMessage || allowAnyPowerUpByRewardId) {
        sourceType = 'powerUp';
      }

      if (redemptionId) {
        logger.info('Redeemed reward URL received from chat message', {
          channel,
          redemptionId,
          matchedTargetReward,
          matchedPendingRedemption,
          username: userstate.username,
          url,
        });
      }
      if (matchedPowerUpRedemption) {
        logger.info('Power-up redemption URL received from chat message', {
          channel,
          username: userstate.username,
          url,
        });
      }

      const isPrivilegedSubmitter = !!(userstate.subscriber || userstate.mod || userstate.vip || userstate.broadcaster);
      const note = isPrivilegedSubmitter ? getNoteFromMessage(message, url) : undefined;

      storeApi.dispatch(
        urlReceived({
          url,
          userstate,
          fromRedemption: sourceType !== 'standard',
          rewardId: redemptionId,
          sourceType,
          note,
        })
      );
    }
  };

const handleRawMessage =
  (storeApi: AppMiddlewareAPI) =>
  (...args: any[]) => {
    const raw = (args[1] || args[0]) as { command?: string; tags?: Record<string, unknown> } | undefined;
    if (!raw || typeof raw !== 'object') {
      return;
    }

    const tags = (raw.tags || {}) as Record<string, unknown>;
    const redemptionId = getRedemptionId(tags);
    const rewardTitle = getAnyRedemptionName('', tags);
    const powerUpObservedId = getPowerUpTypeIdentifier(tags);
    if (!shouldObserveRedemptions(storeApi) || (!redemptionId && !rewardTitle && !powerUpObservedId)) {
      return;
    }

    storeApi.dispatch(channelPointsRedemptionObserved({
      id: redemptionId || powerUpObservedId,
      title: rewardTitle,
      source: 'message',
    }));
  };

const handleMessageDeleted =
  (storeApi: AppMiddlewareAPI) => (channel: string, username: string, message: string, userstate: DeleteUserstate) => {
    const url = getUrlFromMessage(message);
    if (url) {
      storeApi.dispatch(urlDeleted(url));
    }
  };

const handleTimeout = (storeApi: AppMiddlewareAPI) => (channel: string, username: string) => {
  storeApi.dispatch(userTimedOut(username));
};

const handleRedeem =
  (storeApi: AppMiddlewareAPI) =>
  (channel: string, username: string, type: string, tags: Record<string, unknown>, message?: string) => {
    const configuredTags = withRewardConfig(storeApi, tags);
    const redemptionId = getRedemptionId(configuredTags);
    const rewardTitle = getAnyRedemptionName(type, configuredTags);
    if (shouldObserveRedemptions(storeApi) && (redemptionId || rewardTitle)) {
      storeApi.dispatch(channelPointsRedemptionObserved({
        id: redemptionId,
        title: rewardTitle,
        source: 'redeem',
      }));
    }

    const rewardName = getRedemptionName(type, configuredTags);
    const matchedTargetReward = isTargetRedemption(type, configuredTags);
    if (!matchedTargetReward) {
      logger.info('Ignoring redemption because reward did not match target', {
        targetReward: DEFAULT_TARGET_REWARD_NAME,
        targetRewardId: configuredTags.__configuredRewardId || undefined,
        type,
        redemptionId: getRedemptionId(configuredTags),
        rewardTitle: configuredTags['msg-param-reward-title'],
        rewardName: configuredTags['reward-name'],
        rewardTitleAlt: configuredTags['reward-title'],
        msgId: configuredTags['msg-id'],
      });
      return;
    }

    const input = getStringField(message) || getRedemptionInput(configuredTags);
    highlightForRedemption(storeApi, redemptionId, input);
    const url = input ? getUrlFromMessage(input) : undefined;
    if (!url) {
      markPendingRedemption(username);
      logger.info('Matched redemption without inline URL; waiting for next URL from user', {
        username,
        windowMs: PENDING_REDEMPTION_WINDOW_MS,
      });
      return;
    }

    const userstate: Userstate = {
      username: getStringField(configuredTags['display-name']) || username || 'Twitch Chat User',
    };
    if (isDuplicateRedemptionLink(userstate.username, url)) {
      return;
    }

    logger.info('Redeemed reward URL received from redeem event', {
      channel,
      redemptionId,
      type,
      matchedReward: rewardName,
      matchedTargetReward,
      username: userstate.username,
      url,
    });

    storeApi.dispatch(
      urlReceived({
        url,
        userstate,
        fromRedemption: true,
        rewardId: redemptionId,
        sourceType: 'channelPoints',
      })
    );
  };

const createTwitchChatMiddleware = (): Middleware<object, RootState> => {
  return (storeApi: AppMiddlewareAPI) => {
    let client: Client | undefined;
    let listenAutoStopHandle: ReturnType<typeof setTimeout> | undefined;

    const clearListenAutoStop = () => {
      if (!listenAutoStopHandle) {
        return;
      }

      clearTimeout(listenAutoStopHandle);
      listenAutoStopHandle = undefined;
    };

    const startListenAutoStop = () => {
      clearListenAutoStop();
      listenAutoStopHandle = setTimeout(() => {
        listenAutoStopHandle = undefined;
        if (storeApi.getState().settings.listenForChannelPointsRewardIds === true) {
          storeApi.dispatch(settingsChanged({ listenForChannelPointsRewardIds: false }));
        }
      }, LISTEN_AUTO_STOP_MS);
    };

    const connect = () =>
      client?.connect().catch((error: Error) => {
        logger.error(error);
        setTimeout(() => connect(), 5000);
      });

    return (next) => (action) => {
      if (settingsChanged.match(action) && action.payload.listenForChannelPointsRewardIds !== undefined) {
        if (action.payload.listenForChannelPointsRewardIds) {
          startListenAutoStop();
        } else {
          clearListenAutoStop();
        }
      }

      if (!client) {
        if (authenticateWithToken.fulfilled.match(action)) {
          const { username } = action.payload;
          client = createClient(action.payload);
          storeApi.dispatch(chatConnectionStatusChanged('connecting'));

          let pruneInterval: ReturnType<typeof setInterval> | undefined;
          client.on('connected', () => {
            storeApi.dispatch(chatConnectionStatusChanged('connected'));
            showNotification({
              id: 'twitch-chat',
              title: 'Twitch Chat',
              message: 'Connected',
              autoClose: true,
              color: 'indigo',
              style: { marginBottom: 82 },
            });
            const channel = storeApi.getState().settings.channel ?? username;
            client?.join(channel.toLowerCase());
            // run prune on startup and schedule daily (for people that leave their tabs open all the time)
            storeApi.dispatch(pruneOldMemory());
            pruneInterval = setInterval(() => storeApi.dispatch(pruneOldMemory()), 24 * 60 * 60 * 1000);
          });
          client.on('disconnected', () => {
            logger.warn('Disconnected.');
            storeApi.dispatch(chatConnectionStatusChanged('disconnected'));
            showNotification({
              id: 'twitch-chat',
              title: 'Twitch Chat',
              message: 'Disconnected from chat.',
              color: 'red',
              style: { marginBottom: 82 },
            });
            if (pruneInterval) {
              clearInterval(pruneInterval);
              pruneInterval = undefined;
            }
          });
          client.on('message', handleMessage(storeApi));
          client.on('raw_message', handleRawMessage(storeApi) as any);
          client.on('redeem', handleRedeem(storeApi) as any);
          client.on('messagedeleted', handleMessageDeleted(storeApi));

          const timeoutHandler = handleTimeout(storeApi);
          client.on('timeout', timeoutHandler);
          client.on('ban', timeoutHandler);
          client.on('reconnect', () => {
            logger.warn('Reconnect.');
            storeApi.dispatch(chatConnectionStatusChanged('connecting'));
            showNotification({
              id: 'twitch-chat',
              title: 'Twitch Chat',
              message: 'Disconnected from chat, trying to reconnect...',
              color: 'red',
              style: { marginBottom: 82 },
            });
          });

          connect();
        }
      } else {
        if (isAnyOf(logout.fulfilled, validateToken.rejected, authenticateWithToken.rejected)(action)) {
          clearListenAutoStop();
          const tempClient = client;
          client = undefined;
          tempClient?.disconnect();
          storeApi.dispatch(chatConnectionStatusChanged('disconnected'));
        } else if (channelChanged.match(action)) {
          client.getChannels().forEach((channel: string) => client?.part(channel));
          client.join(action.payload.toLowerCase());
        } else if (settingsChanged.match(action)) {
          if (action.payload.channel && !client.getChannels().includes(action.payload.channel)) {
            client.getChannels().forEach((channel: string) => client?.part(channel));
            client.join(action.payload.channel);
          }
          if (action.payload.clipMemoryRetentionDays !== undefined) {
            storeApi.dispatch(pruneOldMemory());
          }
        }
      }

      return next(action);
    };
  };
};

export default createTwitchChatMiddleware;
