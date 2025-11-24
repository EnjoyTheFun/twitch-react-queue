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
  seq?: number;

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
  duration?: number;
  views?: number;
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
  nextSeq: number;
}

const initialState: ClipQueueState = {
  byId: {},
  queueIds: [],
  historyIds: [],
  watchedClipCount: 0,
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
    const clipWithSeq = { ...clip };
    if (!clipWithSeq.seq) {
      clipWithSeq.seq = state.nextSeq;
      state.nextSeq += 1;
    }
    state.byId[id] = clipWithSeq;
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
  if ((!state.currentId || state.currentId === undefined) && state.queueIds.length === 0) {
    state.nextSeq = 1;
  }
};

const addClipToHistory = (state: ClipQueueState, id?: string) => {
  if (!id) {
    return;
  }

  const clip = state.byId[id];

  if (clip) {
    const existingIndex = state.historyIds.indexOf(id);
    if (existingIndex !== -1) {
      state.historyIds.splice(existingIndex, 1);
    }
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
      state.nextSeq = 1;
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

      if (!state.currentId && state.queueIds.length === 0) {
        state.nextSeq = 1;
      }
    },
    previousClipWatched: (state) => {
      const currentId = state.currentId;
      if (!currentId || state.watchedHistory.length < 2) return;

      const previousId = state.watchedHistory[state.watchedHistory.length - 2];
      if (!previousId) return;

      state.queueIds.unshift(currentId);
      state.watchedClipCount = Math.max(0, state.watchedClipCount - 1);

      state.watchedHistory.pop();
      state.historyIds = state.historyIds.filter((id) => id !== currentId);

      state.currentId = previousId;
      state.currentSkipVoters = [];
      state.autoplayTimeoutHandle = undefined;
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

      if (!state.currentId && state.queueIds.length === 0) {
        state.nextSeq = 1;
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
      const seq = Number.parseInt(payload, 10);
      if (!isNaN(seq) && seq > 0) {
        const clipId = state.queueIds.find(id => state.byId[id]?.seq === seq);
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
      const incomingId = payload.id;
      if (!incomingId) return;

      const previousCurrent = state.currentId;

      const clipWithSeq: Clip = { ...payload };
      if (!clipWithSeq.seq) {
        clipWithSeq.seq = state.nextSeq;
        state.nextSeq += 1;
      }

      state.byId[incomingId] = clipWithSeq;

      state.queueIds = state.queueIds.filter((id) => id !== incomingId);

      if (previousCurrent && previousCurrent !== incomingId) {
        const previousClip = state.byId[previousCurrent];
        if (previousClip) {
          previousClip.status = undefined;
          previousClip.rememberedAt = undefined;
        }

        state.queueIds = state.queueIds.filter((id) => id !== previousCurrent);
        state.historyIds = state.historyIds.filter((id) => id !== previousCurrent);
        state.watchedHistory = state.watchedHistory.filter((id) => id !== previousCurrent);

        if (previousClip) {
          if (!previousClip.seq) {
            previousClip.seq = state.nextSeq;
            state.nextSeq += 1;
          }
          state.queueIds.unshift(previousCurrent);
        }
      }

      state.historyIds = state.historyIds.filter((id) => id !== incomingId);
      addClipToHistory(state, incomingId);

      state.watchedHistory = state.watchedHistory.filter((id) => id !== incomingId);
      state.watchedHistory.push(incomingId);

      state.watchedClipCount += 1;
      updateClip(state, incomingId, { status: 'watched', rememberedAt: new Date().toISOString() });

      const submitter = state.byId[incomingId]?.submitters?.[0];
      if (submitter) {
        const key = submitter.toLowerCase();
        state.watchedCounts[key] = (state.watchedCounts[key] || 0) + 1;
      }

      state.currentId = incomingId;
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
      state.currentSkipVoters = [];
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
      const seq = Number.parseInt(payload, 10);
      if (!isNaN(seq) && seq > 0) {
        const clipId = state.queueIds.find(id => state.byId[id]?.seq === seq);
        if (clipId) {
          const idx = state.queueIds.indexOf(clipId);
          state.queueIds.splice(idx, 1);
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
    providersChanged: (state, { payload }: PayloadAction<string[]>) => {
      state.providers = payload;
    },
    providersSet: (state, { payload }: PayloadAction<string[]>) => {
      const validProviders = [
        'twitch-clip',
        'twitch-vod',
        'kick-clip',
        'youtube',
        'streamable',
        'tiktok',
        'twitter',
        'instagram'
      ];

      const providersInput = payload.join(' ').toLowerCase();

      if (providersInput.includes('all')) {
        state.providers = validProviders;
        return;
      }

      if (providersInput.includes('none')) {
        state.providers = [];
        return;
      }

      const requestedProviders = providersInput
        .split(/[,\s]+/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const enabledProviders = requestedProviders.filter(p => validProviders.includes(p));

      if (enabledProviders.length > 0) {
        state.providers = enabledProviders;
      }
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

export const makeSelectClipHistoryIdsPage = () =>
  createSelector(
    [
      selectHistoryIds,
      (_, page: number) => page,
      (_, page: number, perPage: number) => perPage
    ],
    (historyIds, page, perPage) => ({
      clips: historyIds.slice((page - 1) * perPage, page * perPage),
      totalPages: Math.ceil(historyIds.length / perPage),
    })
  );

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
    const uname = (user || '').toLowerCase();
    if (uname === 'import*' || uname.includes('(r/lsf)')) continue;
    if (cnt > (top.count || 0)) {
      top = { username: user, count: cnt };
    }
  }
  return top;
});

export const selectTopNSubmitters = (n: number) =>
  createSelector([selectWatchedCounts], (counts) => {
    const arr = Object.entries(counts || {})
      .filter(([username]) => {
        const uname = (username || '').toLowerCase();
        return uname !== 'import*' && !uname.includes('(r/lsf)');
      })
      .map(([username, count]) => ({ username, count }));
    arr.sort((a, b) => b.count - a.count);
    return arr.slice(0, n);
  });

export const selectQueueClips = createSelector(
  [selectByIds, selectQueueIds],
  (byIds, queueIds) => queueIds.map((id) => byIds[id]).filter((clip) => clip !== undefined)
);

export const selectQueueClipsForAutoplay = createSelector(
  [selectByIds, selectQueueIds],
  (byIds, queueIds) => queueIds.map((id) => byIds[id]).filter((clip) => clip !== undefined)
);

export const makeSelectHistoryPageClips = () =>
  createSelector(
    [
      selectByIds,
      selectHistoryIds,
      (_, page: number) => page,
      (_, page: number, perPage: number) => perPage
    ],
    (byIds, historyIds, page, perPage) => {
      const startIndex = (page - 1) * perPage;
      const endIndex = page * perPage;
      const pageClipIds = historyIds.slice(startIndex, endIndex);
      return pageClipIds.map((id) => byIds[id]).filter((clip) => clip !== undefined);
    }
  );

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

export const highlightClipByIndex = createAsyncThunk<void, string, { state: RootState }>(
  'clipQueue/highlightClipByIndex',
  async (seqStr, { dispatch, getState }) => {
    const seq = Number.parseInt(seqStr, 10);
    if (!isNaN(seq) && seq > 0) {
      const state = getState();
      const queueIds = selectQueueIds(state);
      const clipId = queueIds.find(id => state.clipQueue.byId[id]?.seq === seq);
      if (clipId) {
        dispatch(highlightClip(clipId));
        setTimeout(() => dispatch(clearHighlight()), 3000);
      }
    }
  }
);

export const bumpClipByIndex = createAsyncThunk<void, string, { state: RootState }>(
  'clipQueue/bumpClipByIndex',
  async (idxStr, { dispatch }) => {
    dispatch(bumpClipToTop(idxStr));
    dispatch(highlightClipFrame());
  }
);

export const setProviders = createAsyncThunk<void, string[], { state: RootState }>(
  'clipQueue/setProviders',
  async (args, { dispatch }) => {
    dispatch(providersSet(args));
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

      return Promise.resolve(state);
    },
  },
  clipQueueSlice.reducer
);
export default clipQueueReducer;
