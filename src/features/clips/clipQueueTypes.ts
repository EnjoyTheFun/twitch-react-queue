import type { PlatformType } from '../../common/utils';

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

  thumbnailUrl?: string;
  duration?: number;
  views?: number;
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
