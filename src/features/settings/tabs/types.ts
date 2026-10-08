import type { useForm } from '@mantine/hooks';

export interface SettingsFormValues {
  channel?: string;
  commandPrefix: string;
  clipLimit?: number | null;
  enabledProviders: string[];
  layout: string;
  blockedSubmitters: string;
  blockedCreators: string;
  blurredProviders: string[];
  allowRedditNsfw: boolean;
  skipThreshold?: number;
  clipMemoryRetentionDays?: number | null;
  autoplayDelay?: number;
  subOnlyMode?: boolean;
  allowStandardMessageUrls?: boolean;
  allowChannelPointsRedemptionUrls?: boolean;
  allowPowerUpRedemptionUrls?: boolean;
  powerUpRedemptionTypeId?: string;
  channelPointsRewardId?: string;
  highlightRedemptionId?: string;
  playerPercentDefault?: number;
  showPlayerProgressBar?: boolean;
  voteYeaKeyword?: string;
  voteNayKeyword?: string;
  showSubmitterNotes?: boolean;
}

export type SettingsForm = ReturnType<typeof useForm<SettingsFormValues>>;

export interface SettingsTabProps {
  form: SettingsForm;
}
