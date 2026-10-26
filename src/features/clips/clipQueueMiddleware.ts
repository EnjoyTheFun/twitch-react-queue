import { isAnyOf, Middleware, type UnknownAction } from '@reduxjs/toolkit';
import { formatISO } from 'date-fns';
import { REHYDRATE } from 'redux-persist';
import { RootState, AppMiddlewareAPI } from '../../app/store';
import { createLogger } from '../../common/logging';
import { authenticateWithToken } from '../auth/authSlice';
import { selectQueueAdditionFeedDurationSeconds, settingsChanged } from '../settings/settingsSlice';
import { urlDeleted, urlReceived, urlEnqueue } from '../twitchChat/actions';
import {
  clipStubReceived,
  queueClipRemoved,
  Clip,
  clipDetailsReceived,
  clipDetailsFailed,
  autoplayTimeoutHandleChanged,
  currentClipWatched,
  currentClipReplaced,
  currentClipSkipped,
  queueCleared,
  autoplayUrlFailed,
  autoplayUrlReceived,
} from './clipQueueSlice';
import { addQueueAdditionFeedItem as addFeedItem } from './queue/queueAdditionFeedStore';
import { applyCustomizations } from './customization/customization';
import clipProvider from './providers/providers';

const logger = createLogger('ClipQueueMiddleware');

const announceSuccessfulAddition = (
  storeAPI: AppMiddlewareAPI,
  clipId: string,
  wasAlreadyQueued: boolean
) => {
  const state = storeAPI.getState();
  if (wasAlreadyQueued) return;
  if (state.settings.showQueueAdditionFeed !== true) return;

  const queueState = state.clipQueue;
  const clip = queueState.byId[clipId];
  const submitter = clip?.submitters[0];
  if (!queueState.queueIds.includes(clipId) || typeof clip?.seq !== 'number' || !submitter) return;

  addFeedItem({
    sequence: clip.seq,
    title: clip.title?.trim() || 'Untitled media',
    submitter,
  }, selectQueueAdditionFeedDurationSeconds(state) * 1000);
};

const createClipQueueMiddleware = (): Middleware<object, RootState> => {
  return (storeAPI: AppMiddlewareAPI) => {
    return (next) => (incomingAction: unknown) => {
      const action = incomingAction as UnknownAction & { key?: string };
      if (action.type === REHYDRATE && action.key === 'clipQueue' && action.payload && typeof action.payload === 'object') {
        const payload = action.payload as Record<string, unknown>;
        const providers = Array.isArray(payload.providers)
          ? payload.providers.filter((provider): provider is string => typeof provider === 'string')
          : [];
        clipProvider.setProviders(providers);
        if (payload.byId && typeof payload.byId === 'object') {
          clipProvider.restoreResolvedRedditMap(payload.byId as Record<string, Clip>);
        }
      } else if (action.type === REHYDRATE && action.key === 'settings' && action.payload && typeof action.payload === 'object') {
        const payload = action.payload as Record<string, unknown>;
        if (typeof payload.allowRedditNsfw === 'boolean') {
          clipProvider.setAllowRedditNsfw(payload.allowRedditNsfw);
        }
      } else if (urlReceived.match(action)) {
        const { url, userstate, fromRedemption, sourceType, note } = action.payload;
        const sender = userstate.username;

        const settings = storeAPI.getState().settings;
        const allowStandardMessageUrls = settings.allowStandardMessageUrls !== undefined
          ? settings.allowStandardMessageUrls === true
          : settings.channelPointsLinksOnly !== true;
        const allowChannelPointsRedemptionUrls = settings.allowChannelPointsRedemptionUrls !== undefined
          ? settings.allowChannelPointsRedemptionUrls === true
          : true;
        const allowPowerUpRedemptionUrls = settings.allowPowerUpRedemptionUrls !== undefined
          ? settings.allowPowerUpRedemptionUrls === true
          : settings.powerUpRedemptionsEnabled === true;

        const resolvedSourceType = sourceType || (fromRedemption ? 'channelPoints' : 'standard');
        const isDisallowedBySource =
          (resolvedSourceType === 'standard' && !allowStandardMessageUrls) ||
          (resolvedSourceType === 'channelPoints' && !allowChannelPointsRedemptionUrls) ||
          (resolvedSourceType === 'powerUp' && !allowPowerUpRedemptionUrls);

        if (isDisallowedBySource) {
          return next(action);
        }

        if (!storeAPI.getState().clipQueue.isOpen) {
          return next(action);
        }

        const blockedSubmitters = storeAPI.getState().settings.blockedSubmitters || [];
        const senderNorm = (sender || '').toLowerCase();
        const blockedSubmittersSet = new Set(blockedSubmitters.map((b: string) => b.toLowerCase()));
        if (blockedSubmittersSet.has(senderNorm)) {
          return next(action);
        }

        const subOnlyMode = storeAPI.getState().settings.subOnlyMode === true;
        if (subOnlyMode) {
          const isPrivileged = userstate.subscriber || userstate.mod || userstate.vip || userstate.broadcaster;
          if (!isPrivileged) {
            return next(action);
          }
        }

        const id = clipProvider.getIdFromUrl(url);
        if (id) {
          const clip: Clip | undefined = storeAPI.getState().clipQueue.byId[id];
          const queueState = storeAPI.getState().clipQueue;
          const wasAlreadyQueued = queueState.queueIds.includes(id);
          const isRememberedClip =
            !!clip &&
            !queueState.queueIds.includes(id) &&
            queueState.currentId !== id;
          const shouldRefreshRememberedClip =
            isRememberedClip && (!clip.title || !clip.thumbnailUrl || !clip.author);
          const shouldRefreshExistingRedditClip =
            id.startsWith('reddit:') &&
            (!!clip && (!clip.thumbnailUrl || !clip.author || clip.author === 'reddit' || !clip.title || /^Reddit post\s+/i.test(clip.title)));

          storeAPI.dispatch(clipStubReceived({
            id,
            submitters: [sender],
            url,
            timestamp: formatISO(new Date()),
            submissionSource: resolvedSourceType === 'standard' ? undefined : resolvedSourceType,
            notes: note ? { [sender.toLowerCase()]: note } : undefined,
          }));

          if (!clip || shouldRefreshRememberedClip || shouldRefreshExistingRedditClip) {
            clipProvider
              .getClipById(id)
              .then((clip) => {
                if (clip) {
                  const blockedCreators = storeAPI.getState().settings.blockedCreators || [];
                  const channelNorm = (clip.author || '').toLowerCase();
                  const blockedSet = new Set(blockedCreators.map((c: string) => c.toLowerCase()));
                  if (blockedSet.has(channelNorm)) {
                    storeAPI.dispatch(clipDetailsFailed(id));
                    return;
                  }
                  storeAPI.dispatch(clipDetailsReceived(clip));
                  announceSuccessfulAddition(storeAPI, id, wasAlreadyQueued);
                } else {
                  storeAPI.dispatch(clipDetailsFailed(id));
                }
              })
              .catch((e) => {
                logger.error(e);
                storeAPI.dispatch(clipDetailsFailed(id));
              });
          }
        }
      } else if (urlEnqueue.match(action)) {
        const { url, userstate, replaceAfterEnqueue } = action.payload;
        const sender = userstate.username;
        const blockedSubmitters = storeAPI.getState().settings.blockedSubmitters || [];
        const senderNorm = (sender || '').toLowerCase();
        const blockedSubmittersSet = new Set(blockedSubmitters.map((b: string) => b.toLowerCase()));
        if (blockedSubmittersSet.has(senderNorm)) return next(action);

        const subOnlyMode = storeAPI.getState().settings.subOnlyMode === true;
        if (subOnlyMode) {
          const isPrivileged = userstate.subscriber || userstate.mod || userstate.vip || userstate.broadcaster;
          if (!isPrivileged) return next(action);
        }
        const id = clipProvider.getIdFromUrl(url);
        if (id) {
          const clip: Clip | undefined = storeAPI.getState().clipQueue.byId[id];
          const queueState = storeAPI.getState().clipQueue;
          const wasAlreadyQueued = queueState.queueIds.includes(id);
          const isRememberedClip =
            !!clip &&
            !queueState.queueIds.includes(id) &&
            queueState.currentId !== id;
          const shouldRefreshRememberedClip =
            isRememberedClip && (!clip.title || !clip.thumbnailUrl || !clip.author);
          const shouldRefreshExistingRedditClip =
            id.startsWith('reddit:') &&
            (!!clip && (!clip.thumbnailUrl || !clip.author || clip.author === 'reddit' || !clip.title || /^Reddit post\s+/i.test(clip.title)));

          storeAPI.dispatch(clipStubReceived({ id, submitters: [sender], url, timestamp: formatISO(new Date()) }));

          const wasEnqueued = storeAPI.getState().clipQueue.queueIds.includes(id);
          if (replaceAfterEnqueue && !wasEnqueued) return next(action);

          if (!clip || shouldRefreshRememberedClip || shouldRefreshExistingRedditClip) {
            clipProvider
              .getClipById(id)
              .then((clip) => {
                if (clip) {
                  const blockedCreators = storeAPI.getState().settings.blockedCreators || [];
                  const channelNorm = (clip.author || '').toLowerCase();
                  const blockedSet = new Set(blockedCreators.map((c: string) => c.toLowerCase()));
                  if (blockedSet.has(channelNorm)) {
                    storeAPI.dispatch(clipDetailsFailed(id));
                    return;
                  }
                  storeAPI.dispatch(clipDetailsReceived(clip));
                  announceSuccessfulAddition(storeAPI, id, wasAlreadyQueued);
                  if (replaceAfterEnqueue && storeAPI.getState().clipQueue.queueIds.includes(id)) {
                    storeAPI.dispatch(currentClipReplaced(id));
                  }
                } else {
                  storeAPI.dispatch(clipDetailsFailed(id));
                }
              })
              .catch((e) => {
                logger.error(e);
                storeAPI.dispatch(clipDetailsFailed(id));
              });
          } else if (replaceAfterEnqueue) {
            storeAPI.dispatch(currentClipReplaced(id));
          }
        }
      } else if (urlDeleted.match(action)) {
        const id = clipProvider.getIdFromUrl(action.payload);
        if (id) {
          storeAPI.dispatch(queueClipRemoved(id));
        }
      } else if (settingsChanged.match(action)) {
        const { enabledProviders, allowRedditNsfw } = action.payload;
        if (enabledProviders) {
          clipProvider.setProviders(enabledProviders);
        }
        if (allowRedditNsfw !== undefined) {
          clipProvider.setAllowRedditNsfw(allowRedditNsfw);
        }
      } else if (autoplayTimeoutHandleChanged.match(action)) {
        if (!action.payload.handle) {
          if (action.payload.set) {
            const existingHandle = storeAPI.getState().clipQueue.autoplayTimeoutHandle;
            if (existingHandle) {
              clearTimeout(existingHandle);
            }

            const delay = storeAPI.getState().clipQueue.autoplayDelay;
            if (delay === 0) {
              storeAPI.dispatch(currentClipWatched());
              return next(action);
            }
            const handle = window.setTimeout(() => {
              storeAPI.dispatch(currentClipWatched());
            }, delay);
            action.payload.handle = handle;
          } else {
            const handle = storeAPI.getState().clipQueue.autoplayTimeoutHandle;
            clearTimeout(handle);
          }
        }
      } else if (isAnyOf(currentClipWatched, currentClipReplaced, currentClipSkipped, queueCleared)(action)) {
        const handle = storeAPI.getState().clipQueue.autoplayTimeoutHandle;
        clearTimeout(handle);

        const { autoplay, queueIds } = storeAPI.getState().clipQueue;
        const nextId = queueIds[0];
        if (autoplay && nextId) {
          const nextClipUrl = storeAPI.getState().clipQueue.byId[nextId]?.url;
          clipProvider
            .getAutoplayUrl(nextId)
            .then((url) => {
              const resolvedUrl = url || nextClipUrl;
              if (resolvedUrl) {
                storeAPI.dispatch(autoplayUrlReceived(resolvedUrl));
              } else {
                storeAPI.dispatch(autoplayUrlFailed());
              }
            })
            .catch((e) => {
              logger.error(e);
              storeAPI.dispatch(autoplayUrlFailed());
            });
        }
      } else if (isAnyOf(autoplayUrlFailed)(action)) {
        const handle = storeAPI.getState().clipQueue.autoplayTimeoutHandle;
        clearTimeout(handle);
      } else if (authenticateWithToken.fulfilled.match(action)) {
        applyCustomizations(storeAPI);
      }

      return next(action);
    };
  };
};

export default createClipQueueMiddleware;
