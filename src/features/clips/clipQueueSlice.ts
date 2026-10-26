import { createSlice } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import type { PersistedState, PersistState } from 'redux-persist';
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
  selectTop3Submitters,
  selectQueueClips,
  selectQueueClipsForAutoplay,
  makeSelectHistoryPageClips,
} from './clipQueueSelectors';

export {
  highlightClipFrame,
  highlightClipByIndex,
  highlightClipByUrl,
  bumpClipByIndex,
  bumpClipByUrl,
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
  historyCleared,
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
  queueItemsReordered,
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
  loadClipFromHistory,
} = clipQueueSlice.actions;

const clipQueueReducer = persistReducer(
  {
    key: 'clipQueue',
    storage: storage('twitch-react-queue'),
    version: 3,
    blacklist: ['isOpen'],
    migrate: (state: PersistedState) => {
      if (!state) return Promise.resolve(undefined);

      const persistedState = state as unknown as Record<string, unknown> & { _persist: PersistState };
      if (persistedState._persist.version < 3 || typeof persistedState.nextSeq !== 'number') {
        const byId = persistedState.byId && typeof persistedState.byId === 'object'
          ? persistedState.byId as Record<string, unknown>
          : undefined;
        const activeClips = byId
          ? [
            ...(Array.isArray(persistedState.queueIds)
              ? persistedState.queueIds.map((id) => typeof id === 'string' ? byId[id] : undefined)
              : []),
            typeof persistedState.currentId === 'string' ? byId[persistedState.currentId] : undefined,
          ]
          : [];
        const sortableActiveClips = activeClips
          .filter((clip): clip is Record<string, unknown> => !!clip && typeof clip === 'object')
          .sort((left, right) => {
            const leftSeq = typeof left.seq === 'number' && Number.isFinite(left.seq) && left.seq > 0
              ? left.seq
              : Number.MAX_SAFE_INTEGER;
            const rightSeq = typeof right.seq === 'number' && Number.isFinite(right.seq) && right.seq > 0
              ? right.seq
              : Number.MAX_SAFE_INTEGER;
            return leftSeq - rightSeq;
          });
        sortableActiveClips.forEach((clip, index) => {
          clip.seq = index + 1;
        });
        persistedState.nextSeq = sortableActiveClips.length + 1;
      }

      if (typeof persistedState.totalMediaWatched !== 'number') {
        persistedState.totalMediaWatched = 0;
      }

      return Promise.resolve(persistedState);
    },
  },
  clipQueueSlice.reducer
);

export default clipQueueReducer;
