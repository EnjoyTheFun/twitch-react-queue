export type ColorScheme = 'light' | 'dark';

export interface ObservedChannelPointsRedemption {
  id: string;
  title?: string;
  source: 'redeem' | 'message';
  lastSeenAt: number;
}

export interface AllSettings {
  channel?: string;
  colorScheme?: ColorScheme;
  commandPrefix?: string;
  blockedSubmitters?: string[];
  blockedCreators?: string[];
  favoriteSubmitters?: string[];

  enabledProviders?: string[];
  blurredProviders?: string[];
  allowRedditNsfw?: boolean;

  showTopSubmitters?: boolean;
  subOnlyMode?: boolean;
  channelPointsLinksOnly?: boolean;
  showSubmitterNotes?: boolean;
  allowStandardMessageUrls?: boolean;
  allowChannelPointsRedemptionUrls?: boolean;
  allowPowerUpRedemptionUrls?: boolean;
  channelPointsRewardId?: string;
  listenForChannelPointsRewardIds?: boolean;
  powerUpRedemptionTypeId?: string;
  powerUpRedemptionsEnabled?: boolean;
  highlightRedemptionId?: string;

  clipLimit?: number | null;
  layout?: string;
  skipThreshold?: number;
  clipMemoryRetentionDays?: number | null;
  reorderOnDuplicate?: boolean;
  autoplayDelay?: number;
  playerPercentDefault?: number;
  showPlayerProgressBar?: boolean;
  voteYeaKeyword?: string;
  voteNayKeyword?: string;
}
