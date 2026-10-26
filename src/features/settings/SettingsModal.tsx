import { Box, Button, Group, Stack, Text, UnstyledButton, useMantineTheme } from '@mantine/core';
import React from 'react';
import { useForm } from '@mantine/hooks';
import {
  IconHistory,
  IconSettings,
  IconList,
  IconBan,
  IconInfoCircle,
  IconMessage2,
  IconUsers,
} from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectClipLimit, selectLayout, selectProviders } from '../clips/clipQueueSlice';
import {
  selectChannel,
  selectCommandPrefix,
  settingsChanged,
  selectClipMemoryRetentionDays,
  selectSkipThreshold,
  selectAutoplayDelay,
  selectSubOnlyMode,
  selectPlayerPercentDefault,
  selectShowPlayerProgressBar,
  selectShowQueueDragHints,
  selectHighlightRedemptionSubmissions,
  selectAllowRedditNsfw,
  selectVoteYeaKeyword,
  selectVoteNayKeyword,
  selectChannelPointsRewardId,
  selectAllowStandardMessageUrls,
  selectAllowChannelPointsRedemptionUrls,
  selectAllowPowerUpRedemptionUrls,
  selectPowerUpRedemptionTypeId,
  selectShowSubmitterNotes,
  selectHighlightRedemptionId,
  selectQueueAdditionFeedDurationSeconds,
} from './settingsSlice';
import type { SettingsFormValues } from './tabs/types';
import GeneralTab from './tabs/GeneralTab';
import QueueTab from './tabs/QueueTab';
import ChatIntakeTab from './tabs/ChatIntakeTab';
import ModerationTab from './tabs/ModerationTab';
import CommunityTab from './tabs/CommunityTab';
import MemoryTab from './tabs/MemoryTab';
import AboutTab from './tabs/AboutTab';
import './SettingsModal.scss';

const CATEGORIES = [
  { key: 'general', label: 'General', icon: IconSettings, Component: GeneralTab },
  { key: 'queue', label: 'Queue & Playback', icon: IconList, Component: QueueTab },
  { key: 'chat', label: 'Chat Intake', icon: IconMessage2, Component: ChatIntakeTab },
  { key: 'moderation', label: 'Moderation', icon: IconBan, Component: ModerationTab },
  { key: 'community', label: 'Community', icon: IconUsers, Component: CommunityTab },
  { key: 'memory', label: 'Memory', icon: IconHistory, Component: MemoryTab },
  { key: 'about', label: 'About', icon: IconInfoCircle, Component: AboutTab },
] as const;

export function SettingsModal({ closeModal }: { closeModal: () => void }) {
  const dispatch = useAppDispatch();
  const channel = useAppSelector(selectChannel);
  const commandPrefix = useAppSelector(selectCommandPrefix);
  const clipLimit = useAppSelector(selectClipLimit);
  const enabledProviders = useAppSelector(selectProviders);
  const layout = useAppSelector(selectLayout);

  const existingBlockedSubmitters = useAppSelector((s) => s.settings.blockedSubmitters) || [];
  const existingBlockedCreators = useAppSelector((s) => s.settings.blockedCreators) || [];
  const existingBlurred = useAppSelector((s) => s.settings.blurredProviders) || [];
  const existingAllowRedditNsfw = useAppSelector(selectAllowRedditNsfw);
  const existingSkipThreshold = useAppSelector(selectSkipThreshold);
  const existingClipMemoryRetentionDays = useAppSelector(selectClipMemoryRetentionDays);
  const existingAutoplayDelay = useAppSelector(selectAutoplayDelay);
  const existingQueueAdditionFeedDurationSeconds = useAppSelector(selectQueueAdditionFeedDurationSeconds);
  const existingSubOnlyMode = useAppSelector(selectSubOnlyMode);
  const existingAllowStandardMessageUrls = useAppSelector(selectAllowStandardMessageUrls);
  const existingAllowChannelPointsRedemptionUrls = useAppSelector(selectAllowChannelPointsRedemptionUrls);
  const existingAllowPowerUpRedemptionUrls = useAppSelector(selectAllowPowerUpRedemptionUrls);
  const existingPowerUpRedemptionTypeId = useAppSelector(selectPowerUpRedemptionTypeId);
  const existingChannelPointsRewardId = useAppSelector(selectChannelPointsRewardId);
  const existingHighlightRedemptionId = useAppSelector(selectHighlightRedemptionId);
  const existingVoteYea = useAppSelector(selectVoteYeaKeyword);
  const existingVoteNay = useAppSelector(selectVoteNayKeyword);
  const existingShowSubmitterNotes = useAppSelector(selectShowSubmitterNotes);
  const existingPlayerPercentDefault = useAppSelector(selectPlayerPercentDefault);
  const existingShowPlayerProgressBar = useAppSelector(selectShowPlayerProgressBar);
  const existingShowQueueDragHints = useAppSelector(selectShowQueueDragHints);
  const existingHighlightRedemptionSubmissions = useAppSelector(selectHighlightRedemptionSubmissions);

  const [activeCategory, setActiveCategory] = React.useState<(typeof CATEGORIES)[number]['key']>('general');
  const theme = useMantineTheme();

  const form = useForm<SettingsFormValues>({
    initialValues: {
      channel,
      commandPrefix,
      clipLimit,
      enabledProviders,
      layout,
      blockedSubmitters: existingBlockedSubmitters.join('\n'),
      blockedCreators: existingBlockedCreators.join('\n'),
      blurredProviders: existingBlurred,
      allowRedditNsfw: existingAllowRedditNsfw,
      skipThreshold: existingSkipThreshold,
      clipMemoryRetentionDays: existingClipMemoryRetentionDays,
      autoplayDelay: existingAutoplayDelay,
      queueAdditionFeedDurationSeconds: existingQueueAdditionFeedDurationSeconds,
      subOnlyMode: existingSubOnlyMode,
      allowStandardMessageUrls: existingAllowStandardMessageUrls,
      allowChannelPointsRedemptionUrls: existingAllowChannelPointsRedemptionUrls,
      allowPowerUpRedemptionUrls: existingAllowPowerUpRedemptionUrls,
      powerUpRedemptionTypeId: existingPowerUpRedemptionTypeId,
      channelPointsRewardId: existingChannelPointsRewardId,
      highlightRedemptionId: existingHighlightRedemptionId,
      playerPercentDefault: existingPlayerPercentDefault,
      showPlayerProgressBar: existingShowPlayerProgressBar,
      showQueueDragHints: existingShowQueueDragHints,
      highlightRedemptionSubmissions: existingHighlightRedemptionSubmissions,
      voteYeaKeyword: existingVoteYea,
      voteNayKeyword: existingVoteNay,
      showSubmitterNotes: existingShowSubmitterNotes,
    },
  });

  const ActiveComponent = CATEGORIES.find((c) => c.key === activeCategory)?.Component ?? GeneralTab;

  return (
    <form
      className="settings-form"
      onSubmit={form.onSubmit((settings) => {
        const blockedSubmittersArr = (settings.blockedSubmitters || '')
          .split('\n')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);

        const blockedCreatorsArr = (settings.blockedCreators || '')
          .split('\n')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);

        dispatch(settingsChanged({
          ...settings,
          blockedSubmitters: blockedSubmittersArr,
          blockedCreators: blockedCreatorsArr,
          blurredProviders: settings.blurredProviders || [],
          allowRedditNsfw: settings.allowRedditNsfw,
          voteYeaKeyword: settings.voteYeaKeyword?.trim() || 'VoteYea',
          voteNayKeyword: settings.voteNayKeyword?.trim() || 'VoteNay',
        }));
        closeModal();
      })}
    >
      <Stack spacing="md">
        <Box className="settings-layout">
          <Stack className="settings-nav" spacing={2}>
            {CATEGORIES.map(({ key, label, icon: Icon }) => {
              const isActive = activeCategory === key;
              return (
                <UnstyledButton
                  key={key}
                  className="settings-nav-item"
                  onClick={() => setActiveCategory(key)}
                  sx={{
                    background: isActive
                      ? theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1]
                      : 'transparent',
                    color: isActive
                      ? theme.colorScheme === 'dark' ? theme.colors.gray[0] : theme.colors.dark[7]
                      : undefined,
                    fontWeight: isActive ? 600 : 400,
                    '&:hover': {
                      background: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                      color: theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 4 : 6],
                    },
                  }}
                >
                  <Icon size={16} />
                  <Text size="sm" inherit>{label}</Text>
                </UnstyledButton>
              );
            })}
          </Stack>
          <Box className="settings-content settings-scroll">
            <ActiveComponent form={form} />
          </Box>
        </Box>
        <Group position="right" mt="md">
          <Button className="settings-cancel-button" onClick={() => closeModal()} variant="outline">
            Cancel
          </Button>
          <Button className="settings-save-button" type="submit">Save</Button>
        </Group>
      </Stack>
    </form>
  );
}
