export type ColorScheme = 'light' | 'dark';


export interface AllSettings {
  channel?: string;
  colorScheme?: ColorScheme;
  commandPrefix?: string;
  blacklist?: string[];
  blockedChannels?: string[];

  enabledProviders?: string[];
  blurredProviders?: string[];

  showTopSubmitters?: boolean;
  subOnlyMode?: boolean;

  clipLimit?: number | null;
  layout?: string;
  skipThreshold?: number;
  clipMemoryRetentionDays?: number | null;
  reorderOnDuplicate?: boolean;
  autoplayDelay?: number;
  playerPercentDefault?: number;
}
