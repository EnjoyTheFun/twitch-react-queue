export type ColorScheme = 'light' | 'dark';


export interface AllSettings {
  channel?: string;
  colorScheme?: ColorScheme;
  commandPrefix?: string;
  blacklist?: string[];

  enabledProviders?: string[];
  blurredProviders?: string[];

  clipLimit?: number | null;
  layout?: string;
}
