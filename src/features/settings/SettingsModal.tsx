import { Button, Group, Stack, TextInput, Text, NumberInput, Tabs, Select, Code, Textarea, Switch, Box, useMantineTheme } from '@mantine/core';
import React from 'react';
import { useForm } from '@mantine/hooks';
import { useModals } from '@mantine/modals';
import { IconHistory, IconSettings, IconSlideshow, IconBan } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  memoryPurged,
  selectHistoryIds,
  selectClipLimit,
  selectLayout,
  selectProviders,
} from '../clips/clipQueueSlice';
import { getProviders } from '../../common/utils';
import { selectChannel, selectCommandPrefix, settingsChanged, selectClipMemoryRetentionDays, selectSkipThreshold, selectAutoplayDelay } from './settingsSlice';

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
  const existingAutoplayDelay = useAppSelector(selectAutoplayDelay);
  const theme = useMantineTheme();
  const form = useForm({
    initialValues: { channel, commandPrefix, clipLimit, enabledProviders, layout, blacklist: existingBlacklist.join('\n'), blurredProviders: existingBlurred, skipThreshold: existingSkipThreshold, clipMemoryRetentionDays: existingClipMemoryRetentionDays, autoplayDelay: existingAutoplayDelay },
  });

  return (
    <form
      onSubmit={form.onSubmit((settings) => {
        const blacklistArr = (settings.blacklist || '')
          .split('\n')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);

        dispatch(settingsChanged({ ...settings, blacklist: blacklistArr, blurredProviders: settings.blurredProviders || [] }));
        closeModal();
      })}
    >
      <Stack spacing="md">
        <Tabs>
          <Tabs.Tab label="General" icon={<IconSettings size={16} />} {...({} as any)}>
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

          <Tabs.Tab label="Clip queue" icon={<IconSlideshow size={16} />} {...({} as any)}>
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
                {getProviders().map((p) => {
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

          <Tabs.Tab label="Clip memory" icon={<IconHistory size={16} />} {...({} as any)}>
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
          <Tabs.Tab label="Moderation" icon={<IconBan size={16} />} {...({} as any)}>
            <Stack>
              <Text size="sm">User blacklist (one per line). These users will be prevented from submitting clips and using chat commands.</Text>
              <Textarea
                minRows={6}
                placeholder={"nightbot\nstreamelements"}
                {...form.getInputProps('blacklist')}
                style={{ maxHeight: '12rem', overflow: 'auto', resize: 'none' }}
              />
              <NumberInput
                label="Skip votes required"
                description="Number of unique chatters required to trigger a skip"
                min={1}
                step={1}
                value={form.values.skipThreshold}
                onChange={(v) => form.setFieldValue('skipThreshold', v ?? 20)}
              />
              <NumberInput
                label="Autoplay delay"
                description="Delay in seconds before auto-switching to next video (0 = instant, 5 = 5 seconds with overlay and timer)"
                min={0}
                max={5}
                step={0.1}
                precision={1}
                value={form.values.autoplayDelay}
                onChange={(v) => form.setFieldValue('autoplayDelay', v ?? 5)}
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
