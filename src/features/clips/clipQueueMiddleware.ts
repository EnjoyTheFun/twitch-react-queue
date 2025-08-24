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

const pendingClipFetches = new Set<string>();

const fetchClipDetails = async (id: string, storeAPI: AppMiddlewareAPI): Promise<void> => {
  if (pendingClipFetches.has(id)) {
    logger.debug(`Clip fetch already in progress for ID: ${id}`);
    return;
  }

  pendingClipFetches.add(id);

  try {
    const clip = await clipProvider.getClipById(id);
    if (clip) {
      storeAPI.dispatch(clipDetailsReceived(clip));
      logger.debug(`Successfully fetched clip details for ID: ${id}`);
    } else {
      storeAPI.dispatch(clipDetailsFailed(id));
      logger.warn(`No clip data found for ID: ${id}`);
    }
  } catch (error) {
    logger.error(`Failed to fetch clip details for ID: ${id}`, error);
    storeAPI.dispatch(clipDetailsFailed(id));
  } finally {
    pendingClipFetches.delete(id);
  }
};

const fetchAutoplayUrl = async (nextId: string, storeAPI: AppMiddlewareAPI): Promise<void> => {
  try {
    const url = await clipProvider.getAutoplayUrl(nextId);
    if (url) {
      storeAPI.dispatch(autoplayUrlReceived(url));
      logger.debug(`Successfully fetched autoplay URL for ID: ${nextId}`);
    } else {
      storeAPI.dispatch(autoplayUrlFailed());
      logger.warn(`No autoplay URL found for ID: ${nextId}`);
    }
  } catch (error) {
    logger.error(`Failed to fetch autoplay URL for ID: ${nextId}`, error);
    storeAPI.dispatch(autoplayUrlFailed());
  }
};

const processUrl = (url: string, sender: string | undefined, storeAPI: AppMiddlewareAPI): string | null => {
  const state = storeAPI.getState();

  if (!state.clipQueue.isOpen) {
    logger.debug('Queue is closed, ignoring URL');
    return null;
  }

  const blacklist = state.settings.blacklist || [];
  if (blacklist.map((b: string) => b.toLowerCase()).includes((sender || '').toLowerCase())) {
    logger.debug(`User ${sender} is blacklisted, ignoring URL`);
    return null;
  }

  const id = clipProvider.getIdFromUrl(url);
  if (!id) {
    logger.warn(`Could not extract ID from URL: ${url}`);
    return null;
  }

  return id;
};

const createClipQueueMiddleware = (): Middleware<{}, RootState> => {
  return (storeAPI: AppMiddlewareAPI) => {
    return (next) => (action) => {
      if (action.type === REHYDRATE && action.key === 'clipQueue' && action.payload) {
        try {
          clipProvider.setProviders(action.payload.providers);
          logger.debug('Restored clip providers from persisted state');
        } catch (error) {
          logger.error('Failed to restore clip providers', error);
        }
      } else if (urlReceived.match(action)) {
        const { url, userstate } = action.payload;
        const sender = userstate.username;

        const id = processUrl(url, sender, storeAPI);
        if (!id) {
          return next(action);
        }

        const existingClip: Clip | undefined = storeAPI.getState().clipQueue.byId[id];

        storeAPI.dispatch(clipStubReceived({
          id,
          submitters: [sender],
          timestamp: formatISO(new Date())
        }));

        if (!existingClip) {
          fetchClipDetails(id, storeAPI);
        }
      } else if (urlEnqueue.match(action)) {
        const { url, userstate } = action.payload;
        const sender = userstate.username;

        const id = clipProvider.getIdFromUrl(url);
        if (!id) {
          logger.warn(`Could not extract ID from enqueue URL: ${url}`);
          return next(action);
        }

        const existingClip: Clip | undefined = storeAPI.getState().clipQueue.byId[id];

        storeAPI.dispatch(clipStubReceived({
          id,
          submitters: [sender],
          timestamp: formatISO(new Date())
        }));

        if (!existingClip) {
          fetchClipDetails(id, storeAPI);
        }
      } else if (urlDeleted.match(action)) {
        const id = clipProvider.getIdFromUrl(action.payload);
        if (id) {
          storeAPI.dispatch(queueClipRemoved(id));
          logger.debug(`Removed clip from queue: ${id}`);
        }
      } else if (settingsChanged.match(action)) {
        const { enabledProviders } = action.payload;
        if (enabledProviders) {
          try {
            clipProvider.setProviders(enabledProviders);
            logger.debug('Updated enabled providers');
          } catch (error) {
            logger.error('Failed to update providers', error);
          }
        }
      } else if (autoplayTimeoutHandleChanged.match(action)) {
        if (!action.payload.handle) {
          const currentHandle = storeAPI.getState().clipQueue.autoplayTimeoutHandle;

          if (action.payload.set) {
            if (currentHandle) {
              clearTimeout(currentHandle);
            }

            const delay = storeAPI.getState().clipQueue.autoplayDelay;
            const handle = setTimeout(() => {
              storeAPI.dispatch(currentClipWatched());
            }, delay);
            action.payload.handle = handle as any;
            logger.debug(`Set autoplay timeout for ${delay}ms`);
          } else {
            if (currentHandle) {
              clearTimeout(currentHandle);
              logger.debug('Cleared autoplay timeout');
            }
          }
        }
      } else if (isAnyOf(currentClipWatched, currentClipReplaced, currentClipSkipped, queueCleared)(action)) {
        const currentHandle = storeAPI.getState().clipQueue.autoplayTimeoutHandle;
        if (currentHandle) {
          clearTimeout(currentHandle);
        }

        const { autoplay, queueIds } = storeAPI.getState().clipQueue;
        const nextId = queueIds[0];

        if (autoplay && nextId) {
          fetchAutoplayUrl(nextId, storeAPI);
        }
      } else if (isAnyOf(autoplayUrlFailed)(action)) {
        const currentHandle = storeAPI.getState().clipQueue.autoplayTimeoutHandle;
        if (currentHandle) {
          clearTimeout(currentHandle);
        }
      } else if (authenticateWithToken.fulfilled.match(action)) {
        try {
          applyCustomizations(storeAPI);
          logger.debug('Applied customizations after authentication');
        } catch (error) {
          logger.error('Failed to apply customizations', error);
        }
      }

      return next(action);
    };
  };
};

export default createClipQueueMiddleware;
