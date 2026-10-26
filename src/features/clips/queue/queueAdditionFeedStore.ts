import { QUEUE_ADDITION_FEED_DURATION_MS, type QueueAdditionFeedItem } from '../clipQueueTypes';

type QueueAdditionFeedDetails = Omit<QueueAdditionFeedItem, 'id' | 'displayAt' | 'durationMs'>;

let queueAdditionFeedItems: QueueAdditionFeedItem[] = [];
let nextFeedItemId = 0;
let nextDisplayAt = 0;

const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

export const subscribeToQueueAdditionFeed = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getQueueAdditionFeedItems = () => queueAdditionFeedItems;

export const addQueueAdditionFeedItem = (
  details: QueueAdditionFeedDetails,
  durationMs = QUEUE_ADDITION_FEED_DURATION_MS
) => {
  const now = Date.now();
  const displayAt = Math.max(now, nextDisplayAt);

  queueAdditionFeedItems = [
    ...queueAdditionFeedItems,
    {
      ...details,
      id: String(++nextFeedItemId),
      displayAt,
      durationMs,
    },
  ];
  nextDisplayAt = displayAt + durationMs;
  notifyListeners();
};

export const removeQueueAdditionFeedItem = (id: string) => {
  const remainingItems = queueAdditionFeedItems.filter((item) => item.id !== id);
  if (remainingItems.length === queueAdditionFeedItems.length) return;

  queueAdditionFeedItems = remainingItems;
  if (remainingItems.length === 0) {
    nextDisplayAt = 0;
  }
  notifyListeners();
};
