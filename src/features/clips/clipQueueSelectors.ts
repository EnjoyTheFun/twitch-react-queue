import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

const selectByIds = (state: RootState) => state.clipQueue.byId;

export const selectQueueIds = (state: RootState) => state.clipQueue.queueIds;
export const selectCurrentId = (state: RootState) => state.clipQueue.currentId;
export const selectHistoryIds = (state: RootState) => state.clipQueue.historyIds;
export const selectWatchedCount = (state: RootState) => state.clipQueue.watchedClipCount;
export const selectTotalMediaWatched = (state: RootState) => state.clipQueue.totalMediaWatched;
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

export const selectTotalQueueLength = createSelector(
  [selectWatchedCount, selectQueueIds],
  calculateTotalQueueLength
);

export const makeSelectClipHistoryIdsPage = () =>
  createSelector(
    [
      selectHistoryIds,
      (_, page: number) => page,
      (_, page: number, perPage: number) => perPage,
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

export const selectColoredSubmitterNames = (state: RootState) =>
  state.clipQueue.coloredSubmitterNames !== false;

export const selectSkipVotingEnabled = (state: RootState) =>
  state.clipQueue.skipVotingEnabled === true;

export const selectSkipVoteCount = (state: RootState) =>
  (state.clipQueue.currentSkipVoters || []).length;

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
      (_, page: number, perPage: number) => perPage,
    ],
    (byIds, historyIds, page, perPage) => {
      const startIndex = (page - 1) * perPage;
      const endIndex = page * perPage;
      const pageClipIds = historyIds.slice(startIndex, endIndex);
      return pageClipIds.map((id) => byIds[id]).filter((clip) => clip !== undefined);
    }
  );
