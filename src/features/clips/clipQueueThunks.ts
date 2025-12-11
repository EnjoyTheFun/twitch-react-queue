import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import {
  highlightClip,
  clearHighlight,
  bumpClipToTop,
  providersSet,
  autoplayTimeoutHandleChanged,
  memoryClipRemoved,
} from './clipQueueSlice';

export const highlightClipFrame = createAsyncThunk<void, void, { state: RootState }>(
  'clipQueue/highlightClipFrame',
  async (_, { dispatch, getState }) => {
    const queueIds = getState().clipQueue.queueIds;
    const topClipId = queueIds[0];
    if (topClipId) {
      dispatch(highlightClip(topClipId));
      setTimeout(() => {
        dispatch(clearHighlight());
      }, 3000);
    }
  }
);

export const highlightClipByIndex = createAsyncThunk<void, string, { state: RootState }>(
  'clipQueue/highlightClipByIndex',
  async (seqStr, { dispatch, getState }) => {
    const seq = Number.parseInt(seqStr, 10);
    if (!isNaN(seq) && seq > 0) {
      const state = getState();
      const queueIds = state.clipQueue.queueIds;
      const clipId = queueIds.find((id) => state.clipQueue.byId[id]?.seq === seq);
      if (clipId) {
        dispatch(highlightClip(clipId));
        setTimeout(() => {
          dispatch(clearHighlight());
        }, 3000);
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
