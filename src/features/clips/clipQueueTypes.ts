import type { PlatformType } from '../../common/utils';

export const QUEUE_ADDITION_FEED_DURATION_MS = 5000;

export interface Clip {
  id: string;
  submitters: string[];
  seq?: number;

  status?: 'watched' | 'removed';
  timestamp?: string;
  rememberedAt?: string;
  isWatched?: boolean;

  title?: string;
  author?: string;
  createdAt?: string;
  category?: string;
  url?: string;
  Platform?: PlatformType;
  submissionSource?: 'channelPoints' | 'powerUp';

  thumbnailUrl?: string;
  duration?: number;
  views?: number;

  notes?: Record<string, string>;
}

export interface QueueAdditionFeedItem {
  id: string;
  sequence: number;
  title: string;
  submitter: string;
  displayAt: number;
  durationMs: number;
}

export interface ClipQueueState {
  byId: Record<string, Clip>;

  currentId?: string;
  queueIds: string[];
  historyIds: string[];
  highlightedClipId: string | null;
  watchedClipCount: number;
  totalMediaWatched: number;
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
