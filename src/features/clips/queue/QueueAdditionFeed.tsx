import { useEffect, useState, useSyncExternalStore } from 'react';
import { useMantineTheme } from '@mantine/core';
import {
  getQueueAdditionFeedItems,
  removeQueueAdditionFeedItem,
  subscribeToQueueAdditionFeed,
} from './queueAdditionFeedStore';

interface QueueAdditionFeedProps {
  enabled: boolean;
}

function QueueAdditionFeed({ enabled }: QueueAdditionFeedProps) {
  const theme = useMantineTheme();
  const feedItems = useSyncExternalStore(
    subscribeToQueueAdditionFeed,
    getQueueAdditionFeedItems,
    getQueueAdditionFeedItems
  );
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    setCurrentTime(Date.now());
  }, [feedItems]);

  useEffect(() => {
    const nextItem = feedItems.find((item) => item.displayAt > currentTime);
    if (!nextItem) return;

    const timeout = window.setTimeout(
      () => setCurrentTime(Date.now()),
      Math.max(0, nextItem.displayAt - currentTime)
    );
    return () => window.clearTimeout(timeout);
  }, [currentTime, feedItems]);

  useEffect(() => {
    const timeouts = feedItems.map((item) => window.setTimeout(
      () => removeQueueAdditionFeedItem(item.id),
      Math.max(0, item.displayAt + item.durationMs - Date.now())
    ));
    return () => timeouts.forEach((timeout) => window.clearTimeout(timeout));
  }, [feedItems]);

  const visibleItem = feedItems.find(
    (item) => item.displayAt <= currentTime && item.displayAt + item.durationMs > currentTime
  );

  if (!enabled) return null;

  return (
    <div
      className={`queue-addition-feed queue-addition-feed-${theme.colorScheme}`}
      role="log"
      aria-label="Recently added media"
    >
      {!visibleItem ? (
        <div className="queue-addition-feed-empty">Waiting for new media</div>
      ) : (
        <div key={visibleItem.id} className="queue-addition-feed-item">
          <span className="queue-addition-feed-index">#{visibleItem.sequence}</span>
          <div className="queue-addition-feed-copy">
            <span className="queue-addition-feed-title" title={visibleItem.title}>{visibleItem.title}</span>
            <span className="queue-addition-feed-submitter">{visibleItem.submitter}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default QueueAdditionFeed;
