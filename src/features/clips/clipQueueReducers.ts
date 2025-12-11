import { PayloadAction } from '@reduxjs/toolkit';
import type { Clip, ClipQueueState } from './clipQueueTypes';

const calculateTotalQueueLength = (watchedCount: number, queueIds: string[]) => {
  return watchedCount + queueIds.length;
};

export const addClipToQueue = (state: ClipQueueState, clip: Clip) => {
  const id = clip.id;
  const submitter = clip.submitters[0];

  if ((!state.currentId || state.currentId === undefined) && state.queueIds.length === 0) {
    state.nextSeq = 1;
  }

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

  if (
    !state.clipLimit ||
    calculateTotalQueueLength(state.watchedClipCount, state.queueIds) < state.clipLimit
  ) {
    state.queueIds.push(id);
    const clipWithSeq = { ...clip };
    if (!clipWithSeq.seq) {
      clipWithSeq.seq = state.nextSeq;
      state.nextSeq += 1;
    }
    state.byId[id] = clipWithSeq;
  }
};

export const removeClipFromQueue = (state: ClipQueueState, id: string) => {
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
    state.watchedClipCount = 0;
    state.watchedHistory = [];
  }
};

export const addClipToHistory = (state: ClipQueueState, id?: string) => {
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

    const MAX_HISTORY_ENTRIES = 300;
    if (state.historyIds.length > MAX_HISTORY_ENTRIES) {
      const removed = state.historyIds.splice(MAX_HISTORY_ENTRIES);

      for (const remId of removed) {
        if (remId === state.currentId) continue;
        if (state.queueIds.includes(remId)) continue;
        if ((state.watchedHistory || []).includes(remId)) continue;
        if (state.byId && state.byId[remId]) {
          delete state.byId[remId];
        }
      }
    }
  }
};

export const advanceQueue = (state: ClipQueueState) => {
  state.currentId = state.queueIds.shift();
  if (state.currentId) {
    addClipToHistory(state, state.currentId);
  }
};

export const updateClip = (state: ClipQueueState, id: string | undefined, clipUpdate: Partial<Clip>) => {
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

export const createReducers = () => ({
  queueCleared: (state: ClipQueueState) => {
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
  memoryPurged: (state: ClipQueueState) => {
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
  currentClipWatched: (state: ClipQueueState) => {
    advanceQueue(state);
    if (state.currentId) {
      const clip = state.byId[state.currentId];

      if (!clip?.isWatched) {
        state.watchedClipCount += 1;
        state.totalMediaWatched += 1;
        state.watchedHistory.push(state.currentId);

        if (clip?.submitters && Array.isArray(clip.submitters)) {
          clip.submitters.forEach((submitter) => {
            const key = submitter.toLowerCase();
            state.watchedCounts[key] = (state.watchedCounts[key] || 0) + 1;
          });
        }
        updateClip(state, state.currentId, { isWatched: true });
      }
    }
    updateClip(state, state.currentId, { status: 'watched', rememberedAt: new Date().toISOString() });
    state.autoplayTimeoutHandle = undefined;
    state.currentSkipVoters = [];

    if (!state.currentId && state.queueIds.length === 0) {
      state.nextSeq = 1;
      state.watchedClipCount = 0;
      state.watchedHistory = [];
    }
  },
  previousClipWatched: (state: ClipQueueState) => {
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

  currentClipSkipped: (state: ClipQueueState) => {
    advanceQueue(state);
    if (state.currentId) {
      const clip = state.byId[state.currentId];

      if (!clip?.isWatched) {
        state.totalMediaWatched += 1;
        state.watchedHistory.push(state.currentId);

        if (clip?.submitters && Array.isArray(clip.submitters)) {
          clip.submitters.forEach((submitter) => {
            const key = submitter.toLowerCase();
            state.watchedCounts[key] = (state.watchedCounts[key] || 0) + 1;
          });
        }
        updateClip(state, state.currentId, { isWatched: true });
      }
    }
    updateClip(state, state.currentId, { status: 'watched', rememberedAt: new Date().toISOString() });
    state.autoplayTimeoutHandle = undefined;
    state.currentSkipVoters = [];

    if (!state.currentId && state.queueIds.length === 0) {
      state.nextSeq = 1;
      state.watchedClipCount = 0;
      state.watchedHistory = [];
    }
  },
  clipStubReceived: (state: ClipQueueState, { payload: clip }: PayloadAction<Clip>) =>
    addClipToQueue(state, clip),
  clipDetailsReceived: (state: ClipQueueState, { payload: clip }: PayloadAction<Clip>) => {
    if (state.byId[clip.id]) {
      const submitters = state.byId[clip.id].submitters;
      updateClip(state, clip.id, {
        ...clip,
        submitters,
      });
    }
  },
  clipDetailsFailed: (state: ClipQueueState, { payload }: PayloadAction<string>) => {
    removeClipFromQueue(state, payload);
    if (state.byId[payload]) {
      delete state.byId[payload];
    }
  },
  clipUpvoted: (
    state: ClipQueueState,
    { payload }: PayloadAction<{ clipId: string; username: string }>
  ) => {
    const { clipId, username } = payload;
    const clip = state.byId[clipId];
    if (!clip) return;

    const voter = (username || '').trim();
    if (!voter) return;
    const voterLower = voter.toLowerCase();

    const submitters = clip.submitters || [];
    const alreadySubmitter = submitters.some((name) => name.toLowerCase() === voterLower);
    if (alreadySubmitter) return;

    clip.submitters = [...submitters, voter];

    if (state.reorderOnDuplicate !== false) {
      const index = state.queueIds.indexOf(clipId);
      if (index > -1) {
        state.queueIds.splice(index, 1);
        const newIndex = state.queueIds.findIndex(
          (otherId) => state.byId[otherId].submitters.length < clip.submitters.length
        );
        if (newIndex > -1) {
          state.queueIds.splice(newIndex, 0, clipId);
        } else {
          state.queueIds.push(clipId);
        }
      }
    }
  },
  queueClipRemoved: (state: ClipQueueState, { payload }: PayloadAction<string>) => {
    removeClipFromQueue(state, payload);
    addClipToHistory(state, payload);
    if (!state.queueIds.includes(payload) && state.currentId !== payload) {
      updateClip(state, payload, { status: 'removed' });
    }
  },
  queueClipRemoveByIndex: (state: ClipQueueState, { payload }: PayloadAction<string>) => {
    const seq = Number.parseInt(payload, 10);
    if (!isNaN(seq) && seq > 0) {
      const clipId = state.queueIds.find((id) => state.byId[id]?.seq === seq);
      if (clipId) {
        removeClipFromQueue(state, clipId);
        addClipToHistory(state, clipId);
        updateClip(state, clipId, { status: 'removed' });
      }
    }
  },
  memoryClipRemoved: (state: ClipQueueState, { payload }: PayloadAction<string>) => {
    removeClipFromQueue(state, payload);
    state.historyIds = state.historyIds.filter((id) => id !== payload);
    delete state.byId[payload];
  },
  currentClipReplaced: (state: ClipQueueState, { payload }: PayloadAction<string>) => {
    const index = state.queueIds.indexOf(payload);
    if (index > -1) {
      state.queueIds.splice(index, 1);

      if (payload) {
        addClipToHistory(state, payload);
        state.watchedHistory.push(payload);
      }

      state.currentId = payload;
      const clip = state.byId[state.currentId as string];

      if (!clip?.isWatched) {
        state.watchedClipCount += 1;
        state.totalMediaWatched += 1;

        if (clip?.submitters && Array.isArray(clip.submitters)) {
          clip.submitters.forEach((submitter) => {
            const key = submitter.toLowerCase();
            state.watchedCounts[key] = (state.watchedCounts[key] || 0) + 1;
          });
        }
        updateClip(state, state.currentId, { isWatched: true });
      }
      updateClip(state, state.currentId, { status: 'watched', rememberedAt: new Date().toISOString() });
      state.autoplayTimeoutHandle = undefined;
      state.currentSkipVoters = [];
    }
  },
  currentClipForceReplaced: (state: ClipQueueState, { payload }: PayloadAction<Clip>) => {
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

    const clip = state.byId[incomingId];

    if (!clip?.isWatched) {
      state.watchedClipCount += 1;
      state.totalMediaWatched += 1;

      if (clip?.submitters && Array.isArray(clip.submitters)) {
        clip.submitters.forEach((submitter) => {
          const key = submitter.toLowerCase();
          state.watchedCounts[key] = (state.watchedCounts[key] || 0) + 1;
        });
      }

      updateClip(state, incomingId, { isWatched: true });
    }
    updateClip(state, incomingId, { status: 'watched', rememberedAt: new Date().toISOString() });

    state.currentId = incomingId;
    state.autoplayTimeoutHandle = undefined;
    state.currentSkipVoters = [];
  },
  isOpenChanged: (state: ClipQueueState, { payload }: PayloadAction<boolean>) => {
    state.isOpen = payload;
    if (payload) {
      state.watchedClipCount = 0;
      if (state.queueIds.length === 0) {
        state.watchedHistory = [];
      }
    }
  },
  submitterColorsToggled: (state: ClipQueueState) => {
    state.coloredSubmitterNames = !state.coloredSubmitterNames;
  },
  addSkipVote: (state: ClipQueueState, { payload }: PayloadAction<string>) => {
    if (!state.currentId) return;
    const username = payload.toLowerCase();
    const voters = new Set(state.currentSkipVoters || []);
    voters.add(username);
    state.currentSkipVoters = Array.from(voters);
  },
  clearSkipVotes: (state: ClipQueueState) => {
    state.currentSkipVoters = [];
  },
  skipVotingToggled: (state: ClipQueueState) => {
    const willEnable = !state.skipVotingEnabled;
    state.skipVotingEnabled = willEnable;
    if (!willEnable) {
      state.currentSkipVoters = [];
    }
  },
  autoplayChanged: (state: ClipQueueState, { payload }: PayloadAction<boolean>) => {
    state.autoplay = payload;
    state.currentSkipVoters = [];
  },
  autoplayTimeoutHandleChanged: (
    state: ClipQueueState,
    { payload }: PayloadAction<{ set: boolean; handle?: number | undefined }>
  ) => {
    state.autoplayTimeoutHandle = payload.handle;
  },
  autoplayUrlReceived: (state: ClipQueueState, { payload }: PayloadAction<string | undefined>) => {
    state.autoplayUrl = payload;
  },
  autoplayUrlFailed: (state: ClipQueueState) => {
    state.autoplay = false;
    state.autoplayUrl = undefined;
    state.autoplayTimeoutHandle = undefined;
    state.currentSkipVoters = [];
  },
  bumpClipToTop: (state: ClipQueueState, { payload }: PayloadAction<string>) => {
    const seq = Number.parseInt(payload, 10);
    if (!isNaN(seq) && seq > 0) {
      const clipId = state.queueIds.find((id) => state.byId[id]?.seq === seq);
      if (clipId) {
        const idx = state.queueIds.indexOf(clipId);
        state.queueIds.splice(idx, 1);
        state.queueIds.unshift(clipId);
      }
    }
  },
  resetWatchedCounts: (state: ClipQueueState) => {
    state.watchedCounts = {};
  },
  setWatchedCounts: (state: ClipQueueState, { payload }: PayloadAction<Record<string, number>>) => {
    state.watchedCounts = payload;
  },
  highlightClip: (state: ClipQueueState, { payload }: PayloadAction<string>) => {
    state.highlightedClipId = payload;
  },
  clearHighlight: (state: ClipQueueState) => {
    state.highlightedClipId = null;
  },
  providersChanged: (state: ClipQueueState, { payload }: PayloadAction<string[]>) => {
    state.providers = payload;
  },
  providersSet: (state: ClipQueueState, { payload }: PayloadAction<string[]>) => {
    const validProviders = [
      'twitch-clip',
      'twitch-vod',
      'kick-clip',
      'youtube',
      'streamable',
      'tiktok',
      'twitter',
      'instagram',
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
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const enabledProviders = requestedProviders.filter((p) => validProviders.includes(p));

    if (enabledProviders.length > 0) {
      state.providers = enabledProviders;
    }
  },
});
