import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist-indexeddb-storage';
import type { RootState } from '../../app/store';
import { legacyDataMigrated } from '../migration/legacyMigration';
import { settingsChanged } from '../settings/settingsSlice';
import { userTimedOut } from '../twitchChat/actions';
import type { PlatformType } from '../../common/utils';
import { createAsyncThunk } from '@reduxjs/toolkit';

export interface Clip {
  id: string;
  submitters: string[];

  status?: 'watched' | 'removed';
  timestamp?: string;
  rememberedAt?: string;

  title?: string;
  author?: string;
  createdAt?: string;
  category?: string;
  url?: string;
  Platform?: PlatformType;

  thumbnailUrl?: string;
}

interface ClipQueueState {
  byId: Record<string, Clip>;

  currentId?: string;
  queueIds: string[];
  historyIds: string[];
  highlightedClipId: string | null;
  watchedClipCount: number;
  watchedCounts: Record<string, number>;
  coloredSubmitterNames?: boolean;
  skipVotingEnabled?: boolean;
  currentSkipVoters?: string[];

  isOpen: boolean;

  autoplay: boolean;
  autoplayDelay: number;
  clipLimit?: number | null;
  providers: string[];
  layout: string;

  autoplayTimeoutHandle?: number;
  autoplayUrl?: string;
  watchedHistory: string[];
  reorderOnDuplicate?: boolean;
}

const initialState: ClipQueueState = {
  byId: {},
  queueIds: [],
  historyIds: [],
  watchedClipCount: 0,
  watchedCounts: {},
  providers: ['twitch-clip', 'twitch-vod', 'youtube', 'tiktok', 'twitter'],
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
};

const addClipToQueue = (state: ClipQueueState, clip: Clip) => {
  const id = clip.id;
  const submitter = clip.submitters[0];

  if (state.byId[id]) {
    let rememberedClip = state.byId[id];
    if (state.queueIds.includes(id)) {
      if (!rememberedClip.submitters.includes(submitter)) {
        rememberedClip = {
          ...rememberedClip,
          submitters: [...rememberedClip.submitters, submitter],
        };
        state.byId[id] = rememberedClip;
        if (state.reorderOnDuplicate !== false) {
          const index = state.queueIds.indexOf(id);
          state.queueIds.splice(index, 1);

          const newIndex = state.queueIds.findIndex(
            (otherId) => state.byId[otherId].submitters.length < rememberedClip.submitters.length
          );
          if (newIndex > -1) {
            state.queueIds.splice(newIndex, 0, id);
          } else {
            state.queueIds.push(id);
          }
        }
      }

      return;
    }
    if (rememberedClip.status) {
      return;
    }
  }

  if (!state.clipLimit || calculateTotalQueueLength(state.watchedClipCount, state.queueIds) < state.clipLimit) {
    state.queueIds.push(id);
    state.byId[id] = clip;
  }
};

const removeClipFromQueue = (state: ClipQueueState, id: string) => {
  if (state.currentId === id) {
    state.currentId = undefined;
  } else {
    const index = state.queueIds.indexOf(id);
    if (index > -1) {
      state.queueIds.splice(index, 1);
    }
  }
};

const addClipToHistory = (state: ClipQueueState, id?: string) => {
  if (!id) {
    return;
  }

  const clip = state.byId[id];

  if (clip) {
    state.historyIds.unshift(id);
  }
};

const advanceQueue = (state: ClipQueueState) => {
  state.currentId = state.queueIds.shift();
  if (state.currentId) {
    addClipToHistory(state, state.currentId);
  }
};

const updateClip = (state: ClipQueueState, id: string | undefined, clipUpdate: Partial<Clip>) => {
  if (!id) {
    return;
  }

  const clip = state.byId[id];
  if (clip) {
    state.byId[id] = {
      ...clip,
      ...clipUpdate,
    };
  }
};

const clipQueueSlice = createSlice({
  name: 'clipQueue',
  initialState,
  reducers: {
    queueCleared: (state) => {
      state.queueIds.forEach((id) => {
        delete state.byId[id];
      });
      state.currentId = undefined;
      state.autoplayTimeoutHandle = undefined;
      state.currentSkipVoters = [];
      state.queueIds = [];
      state.watchedClipCount = 0;
      state.watchedHistory = [];
    },
    memoryPurged: (state) => {
      const memory = state.byId;
      state.byId = {};
      state.historyIds = [];

      if (state.currentId) {
        state.byId[state.currentId] = memory[state.currentId];
      }
      state.queueIds.forEach((id) => {
        state.byId[id] = memory[id];
      });
    },
    currentClipWatched: (state) => {
      advanceQueue(state);
      if (state.currentId) {
        state.watchedClipCount += 1;
        state.watchedHistory.push(state.currentId);

        const clip = state.byId[state.currentId];
        const submitter = clip?.submitters?.[0];
        if (submitter) {
          const key = submitter.toLowerCase();
          state.watchedCounts[key] = (state.watchedCounts[key] || 0) + 1;
        }
      }
      updateClip(state, state.currentId, { status: 'watched', rememberedAt: new Date().toISOString() });
      state.autoplayTimeoutHandle = undefined;
      state.currentSkipVoters = [];
    },
    previousClipWatched: (state) => {
      const currentId = state.currentId;
      if (currentId) {
        state.watchedHistory.pop();
      }
      const previousId = state.watchedHistory[state.watchedHistory.length - 1];
      if (previousId) {
        state.currentId = previousId;
        if (currentId) {
          state.queueIds.unshift(currentId);
          state.watchedClipCount -= 1;
          state.historyIds = state.historyIds.filter((id) => id !== currentId);
        }
        state.watchedHistory = state.watchedHistory.filter((id) => state.historyIds.includes(id));
      }
    },

    currentClipSkipped: (state) => {
      advanceQueue(state);
      updateClip(state, state.currentId, { status: 'watched', rememberedAt: new Date().toISOString() });
      state.autoplayTimeoutHandle = undefined;
      state.currentSkipVoters = [];
      if (state.currentId) {
        state.watchedHistory.push(state.currentId);
        const clip = state.byId[state.currentId];
        const submitter = clip?.submitters?.[0];
        if (submitter) {
          const key = submitter.toLowerCase();
          state.watchedCounts[key] = (state.watchedCounts[key] || 0) + 1;
        }
      }
    },
    clipStubReceived: (state, { payload: clip }: PayloadAction<Clip>) => addClipToQueue(state, clip),
    clipDetailsReceived: (state, { payload: clip }: PayloadAction<Clip>) => {
      if (state.byId[clip.id]) {
        const submitters = state.byId[clip.id].submitters;
        updateClip(state, clip.id, {
          ...clip,
          submitters,
        });
      }
    },
    clipDetailsFailed: (state, { payload }: PayloadAction<string>) => {
      removeClipFromQueue(state, payload);
      if (state.byId[payload]) {
        delete state.byId[payload];
      }
    },
    queueClipRemoved: (state, { payload }: PayloadAction<string>) => {
      removeClipFromQueue(state, payload);
      addClipToHistory(state, payload);
      updateClip(state, payload, { status: 'removed' });
    },
    queueClipRemoveByIndex: (state, { payload }: PayloadAction<string>) => {
      const idx = Number.parseInt(payload, 10);
      if (!isNaN(idx) && idx > 0) {
        const clipId = state.queueIds[idx - 1];
        if (clipId) {
          removeClipFromQueue(state, clipId);
          addClipToHistory(state, clipId);
          updateClip(state, clipId, { status: 'removed' });
        }
      }
    },
    memoryClipRemoved: (state, { payload }: PayloadAction<string>) => {
      removeClipFromQueue(state, payload);
      state.historyIds = state.historyIds.filter((id) => id !== payload);
      delete state.byId[payload];
    },
    currentClipReplaced: (state, { payload }: PayloadAction<string>) => {
      const index = state.queueIds.indexOf(payload);
      if (index > -1) {
        state.queueIds.splice(index, 1);

        if (payload) {
          addClipToHistory(state, payload);
          state.watchedHistory.push(payload);
        }

        state.currentId = payload;
        state.watchedClipCount += 1;
        updateClip(state, state.currentId, { status: 'watched', rememberedAt: new Date().toISOString() });
        state.autoplayTimeoutHandle = undefined;
        state.currentSkipVoters = [];

        const clip = state.byId[state.currentId as string];
        const submitter = clip?.submitters?.[0];
        if (submitter) {
          const key = submitter.toLowerCase();
          state.watchedCounts[key] = (state.watchedCounts[key] || 0) + 1;
        }
      }
    },
    currentClipForceReplaced: (state, { payload }: PayloadAction<Clip>) => {
      const previousCurrent = state.currentId;

      state.byId[payload.id] = payload;

      const existingReplacementIndex = state.queueIds.indexOf(payload.id);
      if (existingReplacementIndex > -1) state.queueIds.splice(existingReplacementIndex, 1);

      if (state.historyIds[0] !== payload.id) {
        addClipToHistory(state, payload.id);
      }
      if (state.watchedHistory[state.watchedHistory.length - 1] !== payload.id) {
        state.watchedHistory.push(payload.id);
      }
      state.watchedClipCount += 1;
      updateClip(state, payload.id, { status: 'watched', rememberedAt: new Date().toISOString() });

      const replacedClip = state.byId[payload.id];
      const submitter = replacedClip?.submitters?.[0];
      if (submitter) {
        const key = submitter.toLowerCase();
        state.watchedCounts[key] = (state.watchedCounts[key] || 0) + 1;
      }

      if (previousCurrent && previousCurrent !== payload.id) {
        const existingIndex = state.queueIds.indexOf(previousCurrent);
        if (existingIndex > -1) {
          state.queueIds.splice(existingIndex, 1);
        }
        state.queueIds.unshift(previousCurrent);
      }

      state.currentId = payload.id;
      state.autoplayTimeoutHandle = undefined;
      state.currentSkipVoters = [];
    },
    isOpenChanged: (state, { payload }: PayloadAction<boolean>) => {
      state.isOpen = payload;
      if (payload) {
        state.watchedClipCount = 0;
        if (state.queueIds.length === 0) {
          state.watchedHistory = [];
        }
      }
    },
    submitterColorsToggled: (state) => {
      state.coloredSubmitterNames = !state.coloredSubmitterNames;
    },
    addSkipVote: (state, { payload }: PayloadAction<string>) => {
      if (!state.currentId) return;
      const username = payload.toLowerCase();
      const voters = new Set(state.currentSkipVoters || []);
      voters.add(username);
      state.currentSkipVoters = Array.from(voters);
    },
    clearSkipVotes: (state) => {
      state.currentSkipVoters = [];
    },
    skipVotingToggled: (state) => {
      const willEnable = !state.skipVotingEnabled;
      state.skipVotingEnabled = willEnable;
      if (!willEnable) {
        state.currentSkipVoters = [];
      }
    },
    autoplayChanged: (state, { payload }: PayloadAction<boolean>) => {
      state.autoplay = payload;
    },
    autoplayTimeoutHandleChanged: (
      state,
      { payload }: PayloadAction<{ set: boolean; handle?: number | undefined }>
    ) => {
      state.autoplayTimeoutHandle = payload.handle;
    },
    autoplayUrlReceived: (state, { payload }: PayloadAction<string | undefined>) => {
      state.autoplayUrl = payload;
    },
    autoplayUrlFailed: (state) => {
      state.autoplay = false;
      state.autoplayUrl = undefined;
      state.autoplayTimeoutHandle = undefined;
      state.currentSkipVoters = [];
    },
    bumpClipToTop: (state, { payload }: PayloadAction<string>) => {
      const idx = Number.parseInt(payload, 10);
      if (!isNaN(idx) && idx > 0 && idx <= state.queueIds.length) {
        const clipId = state.queueIds[idx - 1];
        if (clipId) {
          state.queueIds.splice(idx - 1, 1);
          state.queueIds.unshift(clipId);
        }
      }
    },
    resetWatchedCounts: (state) => {
      state.watchedCounts = {};
    },
    highlightClip: (state, { payload }: PayloadAction<string>) => {
      state.highlightedClipId = payload;
    },
    clearHighlight: (state) => {
      state.highlightedClipId = null;
    },
  },
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

const selectByIds = (state: RootState) => state.clipQueue.byId;

export const selectQueueIds = (state: RootState) => state.clipQueue.queueIds;
export const selectCurrentId = (state: RootState) => state.clipQueue.currentId;
export const selectHistoryIds = (state: RootState) => state.clipQueue.historyIds;
export const selectWatchedCount = (state: RootState) => state.clipQueue.watchedClipCount;
export const selectIsOpen = (state: RootState) => state.clipQueue.isOpen;
export const selectAutoplayEnabled = (state: RootState) => state.clipQueue.autoplay;
export const selectClipLimit = (state: RootState) => state.clipQueue.clipLimit;
export const selectProviders = (state: RootState) => state.clipQueue.providers;
export const selectLayout = (state: RootState) => state.clipQueue.layout;
export const selectAutoplayTimeoutHandle = (state: RootState) => state.clipQueue.autoplayTimeoutHandle;
export const selectAutoplayDelay = (state: RootState) => state.clipQueue.autoplayDelay;
export const selectAutoplayUrl = (state: RootState) => state.clipQueue.autoplayUrl;
export const selectClipById = (id: string) => (state: RootState) => state.clipQueue.byId[id];
export const selectHighlightedClipId = (state: RootState) => state.clipQueue.highlightedClipId;
export const selectNextId = createSelector([selectQueueIds], (queueIds) => queueIds[0]);
export const selectCurrentClip = createSelector([selectByIds, selectCurrentId], (byIds, id) =>
  id ? byIds[id] : undefined
);
export const selectNextClip = createSelector([selectByIds, selectNextId], (byIds, id) => byIds[id]);

const calculateTotalQueueLength = (watchedCount: number, queueIds: string[]) => {
  return watchedCount + queueIds.length;
};
export const selectTotalQueueLength = createSelector([selectWatchedCount, selectQueueIds], calculateTotalQueueLength);

export const selectClipHistoryIdsPage = createSelector(
  [selectHistoryIds, (_, page: number, perPage: number) => ({ page, perPage })],
  (historyIds, { page, perPage }) => ({
    clips: historyIds.slice((page - 1) * perPage, page * perPage),
    totalPages: Math.ceil(historyIds.length / perPage),
  })
);
export const selectHasPrevious = (state: RootState) => {
  const { watchedHistory, currentId, historyIds } = state.clipQueue;
  return currentId && historyIds && watchedHistory.length > 1;
};

export const selectWatchedCounts = (state: RootState) => state.clipQueue.watchedCounts || {};

export const selectColoredSubmitterNames = (state: RootState) => state.clipQueue.coloredSubmitterNames !== false;

export const selectSkipVotingEnabled = (state: RootState) => state.clipQueue.skipVotingEnabled === true;

export const selectSkipVoteCount = (state: RootState) => (state.clipQueue.currentSkipVoters || []).length;

export const selectTopSubmitter = createSelector([selectWatchedCounts], (counts) => {
  let top: { username: string | null; count: number } = { username: null, count: 0 };
  for (const [user, cnt] of Object.entries(counts || {})) {
    if (cnt > (top.count || 0)) {
      top = { username: user, count: cnt };
    }
  }
  return top;
});

export const selectTopNSubmitters = (n: number) =>
  createSelector([selectWatchedCounts], (counts) => {
    const arr = Object.entries(counts || {})
      .filter(([username]) => username !== 'import*')
      .map(([username, count]) => ({ username, count }));
    arr.sort((a, b) => b.count - a.count);
    return arr.slice(0, n);
  });

export const highlightClipFrame = createAsyncThunk<void, void, { state: RootState }>(
  'clipQueue/highlightClipFrame',
  async (_, { dispatch, getState }) => {
    const queueIds = selectQueueIds(getState());
    const topClipId = queueIds[0];
    if (topClipId) {
      dispatch(highlightClip(topClipId));
      setTimeout(() => dispatch(clearHighlight()), 3000);
    }
  }
);

export const checkSkipVotes = createAsyncThunk<void, void, { state: RootState }>(
  'clipQueue/checkSkipVotes',
  async (_, { dispatch, getState }) => {
    const threshold = getState().settings.skipThreshold ?? 20;
    const voters = getState().clipQueue.currentSkipVoters || [];
    const currentOverlayHandle = getState().clipQueue.autoplayTimeoutHandle;
    if (voters.length >= threshold) {
      if (!currentOverlayHandle) {
        dispatch(autoplayTimeoutHandleChanged({ set: true }));
      }
    }
  }
);

export const pruneOldMemory = createAsyncThunk<void, void, { state: RootState }>(
  'clipQueue/pruneOldMemory',
  async (_, { dispatch, getState }) => {
    const retentionDays = getState().settings.clipMemoryRetentionDays;
    if (!retentionDays) return; // permanent

    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const state = getState().clipQueue;
    const byId = state.byId;
    const queuedIds = new Set(state.queueIds || []);
    const currentId = state.currentId;

    for (const [id, clip] of Object.entries(byId)) {
      if (queuedIds.has(id) || (currentId && currentId === id)) continue;

      const rememberedAt = clip.rememberedAt ? Date.parse(clip.rememberedAt) : null;

      if (!rememberedAt) continue;

      if (rememberedAt < cutoff) {
        dispatch(memoryClipRemoved(id));
      }
    }
  }
);

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
  submitterColorsToggled,
  addSkipVote,
  clearSkipVotes,
  skipVotingToggled
} = clipQueueSlice.actions;

const clipQueueReducer = persistReducer(
  {
    key: 'clipQueue',
    storage: storage('twitch-react-queue'),
    version: 1,
    blacklist: ['isOpen'],
  },
  clipQueueSlice.reducer
);
export default clipQueueReducer;
