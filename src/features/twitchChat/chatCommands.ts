import type { AppMiddlewareAPI } from '../../app/store';
import {
  autoplayChanged,
  currentClipSkipped,
  currentClipWatched,
  isOpenChanged,
  memoryPurged,
  queueCleared,
  queueClipRemoveByIndex,
  highlightClipByIndex,
  bumpClipByIndex,
  addSkipVote,
  checkSkipVotes,
  selectSkipVotingEnabled,
  clipStubReceived,
  clipDetailsFailed,
  currentClipForceReplaced,
  setProviders,
} from '../clips/clipQueueSlice';
import type { Clip } from '../clips/clipQueueSlice';
import clipProvider from '../clips/providers/providers';
import { settingsChanged } from '../settings/settingsSlice';
import { createLogger } from '../../common/logging';
import { urlDeleted, Userstate, urlEnqueue } from './actions';

const logger = createLogger('Chat Command');

type Dispatch = AppMiddlewareAPI['dispatch'];

interface ChatCommandPayload {
  command: string;
  args: string[];
  userstate: Userstate;
}

type CommmandFunction = (dispatch: Dispatch, args: string[], userstate?: Userstate) => void;

export const voteskipCommand = (username?: string) => (dispatch: Dispatch, getState: AppMiddlewareAPI['getState']) => {
  if (!username) return;
  const enabled = selectSkipVotingEnabled(getState() as any);
  if (!enabled) return;
  dispatch(addSkipVote(username));
  dispatch(checkSkipVotes());
};

const commands: Record<string, CommmandFunction> = {
  open: (dispatch) => dispatch(isOpenChanged(true)),
  close: (dispatch) => dispatch(isOpenChanged(false)),
  next: (dispatch) => dispatch(currentClipWatched()),
  skip: (dispatch) => dispatch(currentClipSkipped()),
  voteskip: (dispatch, args, userstate) => dispatch(voteskipCommand(userstate?.username)),
  remove: (dispatch, [url]) => url && dispatch(urlDeleted(url)),
  removeidx: (dispatch, [idx]) => idx && dispatch(queueClipRemoveByIndex(idx)),
  add: (dispatch, args, userstate) => {
    const url = args && args[0];
    if (!url) return;
    dispatch(urlEnqueue({ url, userstate: userstate as Userstate }));
  },
  bump: (dispatch, [idxStr]) => {
    if (idxStr) {
      dispatch(bumpClipByIndex(idxStr));
    }
  },
  ht: (dispatch, [idxStr]) => {
    if (idxStr) {
      dispatch(highlightClipByIndex(idxStr));
    }
  },
  clear: (dispatch) => dispatch(queueCleared()),
  purgememory: (dispatch) => dispatch(memoryPurged()),
  autoplay: (dispatch, [enabled]) => {
    if (['on', 'true', '1'].includes(enabled)) {
      dispatch(autoplayChanged(true));
    } else if (['off', 'false', '0'].includes(enabled)) {
      dispatch(autoplayChanged(false));
    }
  },
  limit: (dispatch, [limit]) => {
    if (!limit) {
      return;
    }

    if (limit === 'off' || limit === '0') {
      dispatch(settingsChanged({ clipLimit: null }));
    }

    const parsedLimit = Number.parseInt(limit);

    if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
      dispatch(settingsChanged({ clipLimit: parsedLimit }));
    }
  },
  replace: (dispatch, args, userstate) => {
    const url = args && args[0];
    if (!url) return;

    const sender = userstate?.username || 'mods';

    const id = clipProvider.getIdFromUrl(url);
    if (!id) return;

    dispatch(clipStubReceived({ id, submitters: [sender], timestamp: new Date().toISOString() } as any));

    (async () => {
      const TIMEOUT_MS = 5000;
      const fetchPromise = clipProvider.getClipById(id) as Promise<Clip | undefined>;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<undefined>((resolve) => {
        timer = setTimeout(() => resolve(undefined), TIMEOUT_MS);
      });

      try {
        const clip = (await Promise.race([fetchPromise, timeoutPromise])) as Clip | undefined;
        if (timer) clearTimeout(timer);
        if (clip) {
          clip.submitters = [sender];
          dispatch(currentClipForceReplaced(clip as any));
        } else {
          dispatch(clipDetailsFailed(id));
        }
      } catch (err) {
        if (timer) clearTimeout(timer);
        dispatch(clipDetailsFailed(id));
      }
    })();
  },
  providers: (dispatch, args) => {
    if (!args || args.length === 0) return;
    dispatch(setProviders(args));
  },
};

export function processCommand(dispatch: Dispatch, { command, args, userstate }: ChatCommandPayload) {
  if (command !== 'voteskip' && !userstate.mod && !userstate.broadcaster) return;

  logger.info(`Received '${command}' command`, args);

  const commandFunc = commands[command];

  if (commandFunc) {
    commandFunc(dispatch, args, userstate);
  }
}
