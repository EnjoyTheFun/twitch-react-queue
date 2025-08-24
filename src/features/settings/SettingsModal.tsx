import { Button, Group, Stack, TextInput, Text, NumberInput, Tabs, Select, Code, Textarea, Switch, Box, useMantineTheme } from '@mantine/core';
import React from 'react';
import { useForm } from '@mantine/hooks';
import { useModals } from '@mantine/modals';
import { History, Settings, Slideshow, Ban } from 'tabler-icons-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  memoryPurged,
  selectHistoryIds,
  selectClipLimit,
  selectLayout,
  selectProviders,
} from '../clips/clipQueueSlice';
import { selectChannel, selectCommandPrefix, settingsChanged, selectClipMemoryRetentionDays } from './settingsSlice';
import { selectSkipThreshold } from './settingsSlice';

function SettingsModal({ closeModal }: { closeModal: () => void }) {
  const dispatch = useAppDispatch();
  const channel = useAppSelector(selectChannel);
  const commandPrefix = useAppSelector(selectCommandPrefix);
  const clipLimit = useAppSelector(selectClipLimit);
  const enabledProviders = useAppSelector(selectProviders);
  const layout = useAppSelector(selectLayout);
  const historyIds = useAppSelector(selectHistoryIds);

  const existingBlacklist = useAppSelector((s) => s.settings.blacklist) || [];
  const existingBlurred = useAppSelector((s) => s.settings.blurredProviders) || [];
  const existingSkipThreshold = useAppSelector(selectSkipThreshold);
  const existingClipMemoryRetentionDays = useAppSelector(selectClipMemoryRetentionDays);
  const theme = useMantineTheme();
  const form = useForm({
    initialValues: { channel, commandPrefix, clipLimit, enabledProviders, layout, blacklist: existingBlacklist.join(', '), blurredProviders: existingBlurred, skipThreshold: existingSkipThreshold, clipMemoryRetentionDays: existingClipMemoryRetentionDays },
  });

  return (
    <form
      onSubmit={form.onSubmit((settings) => {
        const blacklistArr = (settings.blacklist || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);

        dispatch(settingsChanged({ ...settings, blacklist: blacklistArr, blurredProviders: settings.blurredProviders || [] }));
        closeModal();
      })}
    >
      <Stack spacing="md">
        <Tabs>
          <Tabs.Tab label="General" icon={<Settings size={16} />}>
            <Stack>
              <TextInput
                label="Twitch channel"
                description="Twitch chat channel to join"
                required
                {...form.getInputProps('channel')}
              />
              <Stack spacing={4}>
                <TextInput
                  label="Command prefix"
                  description="Prefix for chat commands, which can be used by moderators"
                  required
                  {...form.getInputProps('commandPrefix')}
                />
                <Text size="xs" color="gray">
                  Example commands: <Code>{form.values.commandPrefix}open</Code>,{' '}
                  <Code>{form.values.commandPrefix}next</Code>
                </Text>
              </Stack>
            </Stack>
          </Tabs.Tab>

          <Tabs.Tab label="Clip queue" icon={<Slideshow size={16} />}>
            <Stack>
              <Select
                required
                label="Queue layout"
                data={[
                  { value: 'classic', label: 'Classic' },
                  { value: 'spotlight', label: 'Spotlight (Updated)' },
                  { value: 'fullscreen', label: 'Fullscreen with popup (Experimental)' },
                ]}
                {...form.getInputProps('layout')}
              />
              <Stack spacing="sm">
                <Text size="sm">Clip providers</Text>
                {[
                  { key: 'twitch-clip', label: 'Twitch Clips' },
                  { key: 'twitch-vod', label: 'Twitch Videos / VODs' },
                  { key: 'kick-clip', label: 'Kick Clips' },
                  { key: 'youtube', label: 'YouTube' },
                  { key: 'streamable', label: 'Streamable' },
                  { key: 'afreeca-clip', label: 'SOOP (Experimental)' },
                  { key: 'tiktok', label: 'TikToks' },
                  { key: 'twitter', label: 'X / Twitter (Third-party API)' },
                  { key: 'instagram', label: 'Instagram (Experimental)' },
                ].map((p) => {
                  const enabled = form.values.enabledProviders?.includes(p.key);
                  const blurred = form.values.blurredProviders?.includes(p.key);
                  return (
                    <Box
                      key={p.key}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px',
                        borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3]}`,
                      }}
                    >
                      <Text size="xs" style={{ flex: 1 }}>{p.label}</Text>
                      <Group spacing="sm" noWrap>
                        <Text size="xs" color="dimmed">
                          Blur
                        </Text>
                        <Switch
                          checked={!!blurred}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const next = new Set(form.values.blurredProviders || []);
                            if (e.currentTarget.checked) next.add(p.key);
                            else next.delete(p.key);
                            form.setFieldValue('blurredProviders', Array.from(next));
                          }}
                        />
                        <Text size="xs" color="dimmed">
                          Enabled
                        </Text>
                        <Switch
                          checked={!!enabled}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const next = new Set(form.values.enabledProviders || []);
                            if (e.currentTarget.checked) next.add(p.key);
                            else next.delete(p.key);
                            form.setFieldValue('enabledProviders', Array.from(next));
                          }}
                        />
                      </Group>
                    </Box>
                  );
                })}
              </Stack>
              <NumberInput
                label="Clip limit"
                description={
                  <>
                    Max number of clips in the queue. Afterwards new clips will not be accepted, current clips can be
                    boosted to the top of the queue. You can <em>Skip</em> a clip instead of <em>Next</em>-ing it to
                    free a spot.
                    <br />
                    Leave empty or 0 to disable.
                  </>
                }
                min={0}
                step={1}
                value={form.values.clipLimit ?? undefined}
                onChange={(event) => form.setFieldValue('clipLimit', event ?? null)}
              />
            </Stack>
          </Tabs.Tab>

          <Tabs.Tab label="Clip memory" icon={<History size={16} />}>
            <Stack>
              <Text size="sm">
                Configure how long watched clips should be remembered before they can be added to the queue again.
                Setting to <em>Permanent</em> will keep clips indefinitely (current default).
              </Text>
              <Group>
                <Text size="sm">You have {historyIds.length} clips in memory</Text>
                <Button color="red" size="xs" onClick={() => dispatch(memoryPurged())}>
                  Purge memory
                </Button>
              </Group>
              <NumberInput
                label="Clip memory retention (days)"
                description="Number of days to remember watched clips before allowing them to be re-added. Leave empty for permanent memory."
                min={1}
                step={1}
                placeholder="Permanent"
                value={form.values.clipMemoryRetentionDays ?? undefined}
                onChange={(v) => form.setFieldValue('clipMemoryRetentionDays', v ?? null)}
              />
            </Stack>
          </Tabs.Tab>
          <Tabs.Tab label="Moderation" icon={<Ban size={16} />}>
            <Stack>
              <Text size="sm">User blacklist (comma-separated). Submissions from these usernames will be ignored.</Text>
              <Textarea
                autosize
                minRows={2}
                placeholder="nightbot, streamelements"
                {...form.getInputProps('blacklist')}
              />
              <NumberInput
                label="Skip votes required"
                description="Number of unique chatters required to trigger a skip"
                min={1}
                step={1}
                value={form.values.skipThreshold}
                onChange={(v) => form.setFieldValue('skipThreshold', v ?? 20)}
              />
            </Stack>
          </Tabs.Tab>
        </Tabs>
        <Group position="right" mt="md">
          <Button onClick={() => closeModal()} variant="outline">
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </Group>
      </Stack>
    </form>
  );
}

const useSettingsModal = () => {
  const modals = useModals();
  const openSettingsModal = () => {
    const id = modals.openModal({
      title: 'Settings',
      children: <SettingsModal closeModal={() => modals.closeModal(id)} />,
      closeOnClickOutside: false,
      closeOnEscape: false,
      size: 'lg',
    });
  };

  return { openSettingsModal };
};

export default useSettingsModal;
