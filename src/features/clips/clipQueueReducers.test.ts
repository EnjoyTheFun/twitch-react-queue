import { describe, expect, it } from 'vitest';
import { addClipToQueue, createReducers } from './clipQueueReducers';
import type { Clip, ClipQueueState } from './clipQueueTypes';

const createState = (byId: Record<string, Clip>, currentId?: string): ClipQueueState => ({
  byId,
  currentId,
  queueIds: currentId ? ['queued'] : [],
  historyIds: [],
  highlightedClipId: null,
  watchedClipCount: 0,
  totalMediaWatched: 0,
  watchedCounts: {},
  isOpen: true,
  autoplay: false,
  autoplayDelay: 5000,
  providers: [],
  layout: 'classic',
  watchedHistory: [],
  nextSeq: 500,
});

describe('clip queue sequence numbers', () => {
  it('assigns new queue submissions after active items, not old remembered sequences', () => {
    const state = createState({
      current: { id: 'current', seq: 1, submitters: ['forsen'] },
      queued: { id: 'queued', seq: 2, submitters: ['xqc'] },
      remembered: { id: 'remembered', seq: 2, submitters: ['quin69'] },
    }, 'current');

    addClipToQueue(state, { id: 'remembered', seq: 2, submitters: ['quin69'] });

    expect(state.byId.remembered.seq).toBe(3);
    expect(state.nextSeq).toBe(4);
    expect(new Set([...state.queueIds, state.currentId].map((id) => state.byId[id!].seq)).size).toBe(3);
  });

  describe('history clearing', () => {
    it('clears history and previous navigation without removing remembered clips', () => {
      const state = createState({
        current: { id: 'current', seq: 1, submitters: ['forsen'] },
        previous: { id: 'previous', seq: 2, submitters: ['xqc'] },
      }, 'current');
      state.historyIds = ['current', 'previous'];
      state.watchedHistory = ['previous', 'current'];

      createReducers().historyCleared(state);

      expect(state.historyIds).toEqual([]);
      expect(state.watchedHistory).toEqual(['current']);
      expect(state.byId).toHaveProperty('current');
      expect(state.byId).toHaveProperty('previous');
    });
  });

  it('gives a clip restored from History a fresh active sequence number', () => {
    const state = createState({
      current: { id: 'current', seq: 1, submitters: ['forsen'] },
      queued: { id: 'queued', seq: 2, submitters: ['xqc'] },
      history: { id: 'history', seq: 2, submitters: ['quin69'] },
    }, 'current');
    const restoreFromHistory = createReducers().loadClipFromHistory;

    restoreFromHistory(state, { type: 'test/loadFromHistory', payload: 'history' });

    expect(state.currentId).toBe('history');
    expect(state.byId.history.seq).toBe(3);
    expect(state.nextSeq).toBe(4);
    const activeSequences = [...state.queueIds, state.currentId!].map((id) => state.byId[id].seq);
    expect(new Set(activeSequences).size).toBe(activeSequences.length);
  });

  it('moves a restored clip to the most recent position in history', () => {
    const state = createState({
      current: { id: 'current', seq: 1, submitters: ['forsen'] },
      queued: { id: 'queued', seq: 2, submitters: ['xqc'] },
      older: { id: 'older', seq: 3, submitters: ['quin69'] },
      recent: { id: 'recent', seq: 4, submitters: ['lirik'] },
    }, 'current');
    state.historyIds = ['recent', 'older', 'current'];

    createReducers().loadClipFromHistory(state, { type: 'test/loadFromHistory', payload: 'older' });

    expect(state.historyIds).toEqual(['older', 'recent', 'current']);
    expect(state.watchedHistory.at(-1)).toBe('older');
  });

  it('keeps the next number above all active clips after replacing the current clip', () => {
    const state = createState({
      current: { id: 'current', seq: 1, submitters: ['forsen'] },
      queued: { id: 'queued', seq: 2, submitters: ['xqc'] },
      replacement: { id: 'replacement', seq: 2, submitters: ['quin69'] },
    }, 'current');
    const forceReplace = createReducers().currentClipForceReplaced;

    forceReplace(state, {
      type: 'test/forceReplace',
      payload: { id: 'replacement', seq: 2, submitters: ['quin69'] },
    });

    expect(state.currentId).toBe('replacement');
    const activeSequences = [...state.queueIds, state.currentId!].map((id) => state.byId[id].seq);
    expect(new Set(activeSequences).size).toBe(activeSequences.length);
    expect(state.nextSeq).toBe(4);
  });

  it('plays a queued replacement with its existing properties and sequence', () => {
    const state = createState({
      current: { id: 'current', seq: 1, submitters: ['forsen'] },
      queued: { id: 'queued', seq: 3, submitters: ['original'], title: 'Queued title' },
      other: { id: 'other', seq: 4, submitters: ['xqc'] },
    }, 'current');
    state.queueIds = ['queued', 'other'];

    createReducers().currentClipForceReplaced(state, {
      type: 'test/forceReplace',
      payload: { id: 'queued', seq: 20, submitters: ['replacement'], title: 'Replacement title' },
    });

    expect(state.currentId).toBe('queued');
    expect(state.byId.queued).toMatchObject({
      seq: 3,
      submitters: ['original'],
      title: 'Queued title',
    });
    expect(state.queueIds).toEqual(['other']);
    const activeSequences = [...state.queueIds, state.currentId!].map((id) => state.byId[id].seq);
    expect(new Set(activeSequences).size).toBe(activeSequences.length);
    expect(state.nextSeq).toBe(5);
  });

  it('plays a selected queued clip without changing its sequence or the remaining queue order', () => {
    const state = createState({
      current: { id: 'current', seq: 1, submitters: ['forsen'] },
      first: { id: 'first', seq: 2, submitters: ['xqc'] },
      selected: { id: 'selected', seq: 4, submitters: ['quin69'] },
      last: { id: 'last', seq: 5, submitters: ['lirik'] },
    }, 'current');
    state.queueIds = ['first', 'selected', 'last'];

    createReducers().currentClipReplaced(state, {
      type: 'test/replace',
      payload: 'selected',
    });

    expect(state.currentId).toBe('selected');
    expect(state.byId.selected.seq).toBe(4);
    expect(state.queueIds).toEqual(['first', 'last']);
    expect(state.watchedHistory.at(-1)).toBe('selected');
    expect(state.nextSeq).toBe(6);
  });

  it('assigns a fresh sequence to a replacement that was not queued', () => {
    const state = createState({
      current: { id: 'current', seq: 3, submitters: ['forsen'] },
      queued: { id: 'queued', seq: 7, submitters: ['xqc'] },
      replacement: { id: 'replacement', seq: 2, submitters: ['quin69'] },
    }, 'current');

    createReducers().currentClipForceReplaced(state, {
      type: 'test/forceReplace',
      payload: { id: 'replacement', seq: 2, submitters: ['quin69'] },
    });

    expect(state.currentId).toBe('replacement');
    expect(state.byId.replacement.seq).toBe(8);
    expect(state.queueIds).toEqual(['queued']);
    const activeSequences = [...state.queueIds, state.currentId!].map((id) => state.byId[id].seq);
    expect(new Set(activeSequences).size).toBe(activeSequences.length);
    expect(state.nextSeq).toBe(9);
  });
});
