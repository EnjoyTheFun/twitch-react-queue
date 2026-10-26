import { afterEach, describe, expect, it, vi } from 'vitest';
import { QUEUE_ADDITION_FEED_DURATION_MS } from '../clipQueueTypes';
import {
  addQueueAdditionFeedItem,
  getQueueAdditionFeedItems,
  removeQueueAdditionFeedItem,
  subscribeToQueueAdditionFeed,
} from './queueAdditionFeedStore';

describe('queue addition feed store', () => {
  afterEach(() => {
    getQueueAdditionFeedItems().forEach(({ id }) => removeQueueAdditionFeedItem(id));
    vi.useRealTimers();
  });

  it('buffers items sequentially in memory and notifies subscribers', () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    const listener = vi.fn();
    const unsubscribe = subscribeToQueueAdditionFeed(listener);

    addQueueAdditionFeedItem({ sequence: 1, title: 'First', submitter: 'forsen' });
    addQueueAdditionFeedItem({ sequence: 2, title: 'Second', submitter: 'xqc' });

    const [first, second] = getQueueAdditionFeedItems();
    expect(first.displayAt).toBe(10_000);
    expect(second.displayAt).toBe(10_000 + QUEUE_ADDITION_FEED_DURATION_MS);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it('applies new durations only to items added after the setting changes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);

    addQueueAdditionFeedItem({ sequence: 1, title: 'First', submitter: 'forsen' });
    addQueueAdditionFeedItem({ sequence: 2, title: 'Second', submitter: 'xqc' });
    addQueueAdditionFeedItem({ sequence: 3, title: 'Third', submitter: 'quin69' }, 1_000);
    addQueueAdditionFeedItem({ sequence: 4, title: 'Fourth', submitter: 'pokelawls' }, 1_000);

    const items = getQueueAdditionFeedItems();
    expect(items[0].durationMs).toBe(QUEUE_ADDITION_FEED_DURATION_MS);
    expect(items[1].displayAt).toBe(items[0].displayAt + items[0].durationMs);
    expect(items[2].displayAt).toBe(items[1].displayAt + items[1].durationMs);
    expect(items[2].durationMs).toBe(1_000);
    expect(items[3].displayAt).toBe(items[2].displayAt + items[2].durationMs);
  });

  it('retains and schedules a large burst of items sequentially', () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);

    for (let sequence = 1; sequence <= 300; sequence += 1) {
      addQueueAdditionFeedItem({ sequence, title: `Media ${sequence}`, submitter: 'viewer' });
    }

    const items = getQueueAdditionFeedItems();
    expect(items).toHaveLength(300);
    expect(items[0].sequence).toBe(1);
    expect(items[299].sequence).toBe(300);
    expect(items[299].displayAt).toBe(10_000 + 299 * QUEUE_ADDITION_FEED_DURATION_MS);
  });
});
