import { isAnyOf, Middleware } from '@reduxjs/toolkit';
import { formatISO } from 'date-fns';
import { REHYDRATE } from 'redux-persist';
import { RootState, AppMiddlewareAPI } from '../../app/store';
import { createLogger } from '../../common/logging';
import { authenticateWithToken } from '../auth/authSlice';
import { settingsChanged } from '../settings/settingsSlice';
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
import { applyCustomizations } from './customization/customization';
import clipProvider from './providers/providers';

const logger = createLogger('ClipQueueMiddleware');

const createClipQueueMiddleware = (): Middleware<{}, RootState> => {
  return (storeAPI: AppMiddlewareAPI) => {
    return (next) => (action: any) => {
      if (action.type === REHYDRATE && action.key === 'clipQueue' && action.payload) {
        clipProvider.setProviders(action.payload.providers);
      } else if (urlReceived.match(action)) {
        const { url, userstate } = action.payload;
        const sender = userstate.username;

        if (!storeAPI.getState().clipQueue.isOpen) {
          return next(action);
        }

        const blacklisted = storeAPI.getState().settings.blacklist || [];
        const senderNorm = (sender || '').toLowerCase();
        const blacklistedSet = new Set(blacklisted.map((b: string) => b.toLowerCase()));
        if (blacklistedSet.has(senderNorm)) {
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

          storeAPI.dispatch(clipStubReceived({ id, submitters: [sender], timestamp: formatISO(new Date()) }));

          if (!clip) {
            clipProvider
              .getClipById(id)
              .then((clip) => {
                if (clip) {
                  const blockedChannels = storeAPI.getState().settings.blockedChannels || [];
                  const channelNorm = (clip.author || '').toLowerCase();
                  const blockedSet = new Set(blockedChannels.map((c: string) => c.toLowerCase()));
                  if (blockedSet.has(channelNorm)) {
                    storeAPI.dispatch(clipDetailsFailed(id));
                    return;
                  }
                  storeAPI.dispatch(clipDetailsReceived(clip));
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
        const { url, userstate } = action.payload;
        const sender = userstate.username;
        const blacklisted = storeAPI.getState().settings.blacklist || [];
        const senderNorm = (sender || '').toLowerCase();
        const blacklistedSet = new Set(blacklisted.map((b: string) => b.toLowerCase()));
        if (blacklistedSet.has(senderNorm)) return next(action);

        const subOnlyMode = storeAPI.getState().settings.subOnlyMode === true;
        if (subOnlyMode) {
          const isPrivileged = userstate.subscriber || userstate.mod || userstate.vip || userstate.broadcaster;
          if (!isPrivileged) return next(action);
        }
        const id = clipProvider.getIdFromUrl(url);
        if (id) {
          const clip: Clip | undefined = storeAPI.getState().clipQueue.byId[id];

          storeAPI.dispatch(clipStubReceived({ id, submitters: [sender], timestamp: formatISO(new Date()) }));

          if (!clip) {
            clipProvider
              .getClipById(id)
              .then((clip) => {
                if (clip) {
                  const blockedChannels = storeAPI.getState().settings.blockedChannels || [];
                  const channelNorm = (clip.author || '').toLowerCase();
                  const blockedSet = new Set(blockedChannels.map((c: string) => c.toLowerCase()));
                  if (blockedSet.has(channelNorm)) {
                    storeAPI.dispatch(clipDetailsFailed(id));
                    return;
                  }
                  storeAPI.dispatch(clipDetailsReceived(clip));
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
      } else if (urlDeleted.match(action)) {
        const id = clipProvider.getIdFromUrl(action.payload);
        if (id) {
          storeAPI.dispatch(queueClipRemoved(id));
        }
      } else if (settingsChanged.match(action)) {
        const { enabledProviders } = action.payload;
        if (enabledProviders) {
          clipProvider.setProviders(enabledProviders);
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
            const handle = setTimeout(() => {
              storeAPI.dispatch(currentClipWatched());
            }, delay);
            action.payload.handle = handle as any;
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
          clipProvider
            .getAutoplayUrl(nextId)
            .then((url) => {
              if (url) {
                storeAPI.dispatch(autoplayUrlReceived(url));
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
