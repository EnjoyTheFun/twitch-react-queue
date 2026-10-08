import { Box, Button, Code, Divider, Group, Stack, Switch, Text, TextInput, useMantineTheme } from '@mantine/core';
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  clearObservedChannelPointsRedemptions,
  selectListenForChannelPointsRewardIds,
  selectObservedChannelPointsRedemptions,
  settingsChanged,
} from '../settingsSlice';
import type { SettingsTabProps } from './types';

const LISTEN_WINDOW_SECONDS = 30;

function ChatIntakeTab({ form }: SettingsTabProps) {
  const theme = useMantineTheme();
  const dispatch = useAppDispatch();
  const listenForChannelPointsRewardIds = useAppSelector(selectListenForChannelPointsRewardIds);
  const observedRedemptions = useAppSelector(selectObservedChannelPointsRedemptions);
  const [listenDeadlineMs, setListenDeadlineMs] = React.useState<number | null>(null);
  const [listenSecondsRemaining, setListenSecondsRemaining] = React.useState<number>(LISTEN_WINDOW_SECONDS);

  React.useEffect(() => {
    if (!listenForChannelPointsRewardIds) {
      setListenDeadlineMs(null);
      setListenSecondsRemaining(LISTEN_WINDOW_SECONDS);
      return;
    }

    const deadline = listenDeadlineMs ?? (Date.now() + LISTEN_WINDOW_SECONDS * 1000);
    if (!listenDeadlineMs) {
      setListenDeadlineMs(deadline);
    }

    const updateRemaining = () => {
      const nextRemaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setListenSecondsRemaining(nextRemaining);
    };

    updateRemaining();
    const interval = window.setInterval(updateRemaining, 250);
    return () => window.clearInterval(interval);
  }, [listenForChannelPointsRewardIds, listenDeadlineMs]);

  const handleListenToggle = () => {
    if (listenForChannelPointsRewardIds) {
      dispatch(settingsChanged({ listenForChannelPointsRewardIds: false }));
      setListenDeadlineMs(null);
      setListenSecondsRemaining(LISTEN_WINDOW_SECONDS);
      return;
    }

    setListenDeadlineMs(Date.now() + LISTEN_WINDOW_SECONDS * 1000);
    setListenSecondsRemaining(LISTEN_WINDOW_SECONDS);
    dispatch(settingsChanged({ listenForChannelPointsRewardIds: true }));
  };

  return (
    <Stack>
      <Text size="sm" weight={600}>Link sources</Text>
      <Stack spacing={4}>
        <Switch
          label="Subscriber-only mode"
          {...form.getInputProps('subOnlyMode', { type: 'checkbox' })}
        />
        <Text size="xs" color="dimmed">
          Restricts submissions to subscribers, VIPs, moderators, and the broadcaster.
        </Text>
      </Stack>
      <Stack spacing={4}>
        <Switch
          label="Allow standard chat URL messages"
          {...form.getInputProps('allowStandardMessageUrls', { type: 'checkbox' })}
        />
        <Text size="xs" color="dimmed">
          Accepts normal chat messages that contain links.
        </Text>
      </Stack>
      <Stack spacing={4}>
        <Switch
          label="Allow channel points redemption URL messages"
          {...form.getInputProps('allowChannelPointsRedemptionUrls', { type: 'checkbox' })}
        />
        <Text size="xs" color="dimmed">
          Accepts links from the configured channel points reward flow.
        </Text>
      </Stack>
      <Stack spacing={4}>
        <Switch
          label="Allow integrated power-up URL messages (bits)"
          {...form.getInputProps('allowPowerUpRedemptionUrls', { type: 'checkbox' })}
        />
        <Text size="xs" color="dimmed">
          Accepts paid Twitch power-up/cheer-style link messages.
        </Text>
      </Stack>

      <Divider label="Channel points & power-ups" labelPosition="center" mt="xs" />

      <TextInput
        label="Channel points reward ID"
        description="Only this reward ID is treated as a valid channel points URL redemption"
        placeholder="90e5b7c5-d222-4589-82ad-10c92e8ee7be"
        value={form.values.channelPointsRewardId}
        onChange={(e) => form.setFieldValue('channelPointsRewardId', e.currentTarget.value)}
      />
      <TextInput
        label="Power-up ID"
        description="Set to require a specific power-up type (matches msg-id/level markers). Leave empty to allow any paid power-up."
        placeholder=""
        value={form.values.powerUpRedemptionTypeId}
        onChange={(e) => form.setFieldValue('powerUpRedemptionTypeId', e.currentTarget.value)}
      />
      <TextInput
        label="Highlight redemption ID"
        description="When this channel points or power-up redemption contains a number, highlights the queue item with that number. Disabled when empty."
        value={form.values.highlightRedemptionId || ''}
        onChange={(e) => form.setFieldValue('highlightRedemptionId', e.currentTarget.value)}
      />
      <Box>
        <Group position="apart" mb={6}>
          <Text size="sm" weight={500}>Observed redemptions from chat</Text>
          <Group spacing="xs">
            <Button
              size="xs"
              variant={listenForChannelPointsRewardIds ? 'outline' : 'filled'}
              color={listenForChannelPointsRewardIds ? 'gray' : 'blue'}
              onClick={handleListenToggle}
            >
              {listenForChannelPointsRewardIds ? `Stop listening (${listenSecondsRemaining}s)` : 'Listen'}
            </Button>
            {observedRedemptions.length > 0 && (
              <Button
                size="xs"
                variant="subtle"
                color="red"
                onClick={() => dispatch(clearObservedChannelPointsRedemptions())}
              >
                Clear list
              </Button>
            )}
          </Group>
        </Group>
        <Text size="xs" color="dimmed" mb={8}>
          Use Listen only when you need to discover channel points or power-up identifiers manually. This keeps normal chat processing quiet and captures IDs only during your test events.
        </Text>
        <Box
          sx={{
            maxHeight: '10rem',
            overflowY: 'auto',
            border: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[4]}`,
            borderRadius: 8,
            padding: 8,
          }}
        >
          {observedRedemptions.length > 0 ? (
            <Stack spacing={8}>
              {observedRedemptions.map((reward) => {
                const normalizedTitle = (reward.title || '').trim().toLowerCase();
                const normalizedId = (reward.id || '').trim().toLowerCase();
                const hasDistinctTitle = !!normalizedTitle && normalizedTitle !== normalizedId;

                return (
                  <Group key={`${reward.id || reward.title || 'unknown'}-${reward.lastSeenAt}`} position="apart" noWrap>
                    <Stack spacing={2} sx={{ minWidth: 0, flex: 1 }}>
                      {hasDistinctTitle && (
                        <Text size="xs" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {reward.title}
                        </Text>
                      )}
                      <Code sx={{ display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {reward.id || 'No ID captured'}
                      </Code>
                      <Text size="xs" color="dimmed">
                        {reward.source} event • {new Date(reward.lastSeenAt).toLocaleTimeString()}
                      </Text>
                    </Stack>
                    <Button
                      size="xs"
                      disabled={!reward.id && !reward.title}
                      onClick={() => {
                        const textToCopy = (reward.id || reward.title || '').trim();
                        if (!textToCopy || !navigator.clipboard) {
                          return;
                        }

                        void navigator.clipboard.writeText(textToCopy);
                      }}
                    >
                      Copy
                    </Button>
                  </Group>
                );
              })}
            </Stack>
          ) : (
            <Text size="xs" color="dimmed" italic>
              {listenForChannelPointsRewardIds ? 'Listening for IDs. Trigger a manual channel points or power-up event now.' : 'Click Listen, then trigger a manual channel points or power-up event to capture its ID.'}
            </Text>
          )}
        </Box>
      </Box>
    </Stack>
  );
}

export default ChatIntakeTab;
