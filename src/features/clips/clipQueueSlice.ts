import { createSlice } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist-indexeddb-storage';
import { legacyDataMigrated } from '../migration/legacyMigration';
import { settingsChanged } from '../settings/settingsSlice';
import { userTimedOut } from '../twitchChat/actions';
import type { ClipQueueState } from './clipQueueTypes';
import { createReducers } from './clipQueueReducers';

export type { Clip, ClipQueueState } from './clipQueueTypes';

export {
  selectQueueIds,
  selectCurrentId,
  selectHistoryIds,
  selectWatchedCount,
  selectTotalMediaWatched,
  selectIsOpen,
  selectAutoplayEnabled,
  selectClipLimit,
  selectProviders,
  selectLayout,
  selectAutoplayTimeoutHandle,
  selectAutoplayDelay,
  selectAutoplayUrl,
  selectClipById,
  selectHighlightedClipId,
  selectNextId,
  selectCurrentClip,
  selectNextClip,
  selectTotalQueueLength,
  makeSelectClipHistoryIdsPage,
  selectClipHistoryIdsPage,
  selectHasPrevious,
  selectWatchedCounts,
  selectColoredSubmitterNames,
  selectSkipVotingEnabled,
  selectSkipVoteCount,
  selectTopSubmitter,
  selectTopNSubmitters,
  selectQueueClips,
  selectQueueClipsForAutoplay,
  makeSelectHistoryPageClips,
} from './clipQueueSelectors';

export {
  highlightClipFrame,
  highlightClipByIndex,
  bumpClipByIndex,
  setProviders,
  checkSkipVotes,
  pruneOldMemory,
} from './clipQueueThunks';

const initialState: ClipQueueState = {
  byId: {},
  queueIds: [],
  historyIds: [],
  watchedClipCount: 0,
  totalMediaWatched: 0,
  watchedCounts: {},
  providers: ['twitch-clip', 'twitch-vod', 'youtube', 'tiktok', 'twitter', 'reddit'],
  layout: 'classic',
  isOpen: false,
  autoplay: false,
  autoplayDelay: 5000,
  watchedHistory: [],
  highlightedClipId: null,
  coloredSubmitterNames: true,
  skipVotingEnabled: false,
  currentSkipVoters: [],
  reorderOnDuplicate: true,
  nextSeq: 1,
};

const clipQueueSlice = createSlice({
  name: 'clipQueue',
  initialState,
  reducers: createReducers(),
  extraReducers: (builder) => {
    builder.addCase(userTimedOut, (state, { payload }) => {
      for (const id of state.queueIds) {
        const clip = state.byId[id];
        state.byId[id] = {
          ...clip,
          submitters: clip.submitters.filter((submitter) => submitter.toLowerCase() !== payload),
        };
      }

      state.queueIds = state.queueIds.filter((id) => state.byId[id].submitters.length > 0);
    });
    builder.addCase(settingsChanged, (state, { payload }) => {
      if (payload.clipLimit !== undefined) {
        state.clipLimit = payload.clipLimit;
      }
      if (payload.enabledProviders) {
        state.providers = payload.enabledProviders;
      }
      if (payload.layout) {
        state.layout = payload.layout;
      }
      if (payload.reorderOnDuplicate !== undefined) {
        state.reorderOnDuplicate = payload.reorderOnDuplicate;
      }
      if (payload.autoplayDelay !== undefined) {
        state.autoplayDelay = payload.autoplayDelay * 1000;
      }
    });
    builder.addCase(legacyDataMigrated, (state, { payload }) => {
      state.watchedClipCount = 0;
      state.autoplay = payload.autoplay;
      state.byId = payload.byIds;
      state.historyIds = payload.historyIds;
      state.queueIds = payload.queueIds;

      state.watchedCounts = {};

      if (payload.providers) {
        state.providers = payload.providers;
      }
      if (payload.clipLimit) {
        state.clipLimit = payload.clipLimit;
      }
    });
  },
});

export const {
  queueCleared,
  memoryPurged,
  currentClipWatched,
  currentClipSkipped,
  currentClipReplaced,
  currentClipForceReplaced,
  clipStubReceived,
  clipDetailsReceived,
  clipDetailsFailed,
  clipUpvoted,
  queueClipRemoved,
  queueClipRemoveByIndex,
  memoryClipRemoved,
  isOpenChanged,
  autoplayChanged,
  autoplayTimeoutHandleChanged,
  autoplayUrlReceived,
  autoplayUrlFailed,
  previousClipWatched,
  bumpClipToTop,
  highlightClip,
  clearHighlight,
  resetWatchedCounts,
  setWatchedCounts,
  submitterColorsToggled,
  addSkipVote,
  clearSkipVotes,
  skipVotingToggled,
  providersChanged,
  providersSet,
} = clipQueueSlice.actions;

const clipQueueReducer = persistReducer(
  {
    key: 'clipQueue',
    storage: storage('twitch-react-queue'),
    version: 2,
    blacklist: ['isOpen'],
    migrate: (state: any) => {
      if (!state) return Promise.resolve(initialState);

      if (state._persist?.version === 1 || !state.nextSeq) {
        let maxSeq = 0;

        if (state.byId) {
          for (const clip of Object.values(state.byId)) {
            if ((clip as any).seq && (clip as any).seq > maxSeq) {
              maxSeq = (clip as any).seq;
            }
          }
        }

        let nextSeq = maxSeq + 1;

        if (state.queueIds && Array.isArray(state.queueIds)) {
          state.queueIds.forEach((id: string) => {
            if (state.byId[id] && !state.byId[id].seq) {
              state.byId[id].seq = nextSeq;
              nextSeq += 1;
            }
          });
        }

        if (state.currentId && state.byId[state.currentId] && !state.byId[state.currentId].seq) {
          state.byId[state.currentId].seq = nextSeq;
          nextSeq += 1;
        }

        state.nextSeq = nextSeq;
      }

      if (typeof state.totalMediaWatched !== 'number') {
        state.totalMediaWatched = 0;
      }

      return Promise.resolve(state);
    },
  },
  clipQueueSlice.reducer
);

export default clipQueueReducer;
