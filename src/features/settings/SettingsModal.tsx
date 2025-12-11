import { Button, Group, Stack, TextInput, Text, NumberInput, Tabs, Select, Code, Textarea, Switch, Box, useMantineTheme, ScrollArea, Chip, Badge } from '@mantine/core';
import React from 'react';
import { useForm } from '@mantine/hooks';
import { useModals } from '@mantine/modals';
import { IconHistory, IconSettings, IconList, IconBan, IconInfoCircle } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  memoryPurged,
  selectHistoryIds,
  selectClipLimit,
  selectLayout,
  selectProviders,
} from '../clips/clipQueueSlice';
import { getProviders } from '../../common/utils';
import { selectChannel, selectCommandPrefix, settingsChanged, selectClipMemoryRetentionDays, selectSkipThreshold, selectAutoplayDelay, selectSubOnlyMode, selectPlayerPercentDefault, selectFavoriteSubmitters, removeFavoriteSubmitter, selectAllowRedditNsfw } from './settingsSlice';

function SettingsModal({ closeModal }: { closeModal: () => void }) {
  const dispatch = useAppDispatch();
  const channel = useAppSelector(selectChannel);
  const commandPrefix = useAppSelector(selectCommandPrefix);
  const clipLimit = useAppSelector(selectClipLimit);
  const enabledProviders = useAppSelector(selectProviders);
  const layout = useAppSelector(selectLayout);
  const historyIds = useAppSelector(selectHistoryIds);

  const existingBlockedSubmitters = useAppSelector((s) => s.settings.blockedSubmitters) || [];
  const existingBlockedCreators = useAppSelector((s) => s.settings.blockedCreators) || [];
  const existingFavoriteSubmitters = useAppSelector(selectFavoriteSubmitters);
  const existingBlurred = useAppSelector((s) => s.settings.blurredProviders) || [];
  const existingAllowRedditNsfw = useAppSelector(selectAllowRedditNsfw);
  const existingSkipThreshold = useAppSelector(selectSkipThreshold);
  const existingClipMemoryRetentionDays = useAppSelector(selectClipMemoryRetentionDays);
  const existingAutoplayDelay = useAppSelector(selectAutoplayDelay);
  const existingSubOnlyMode = useAppSelector(selectSubOnlyMode);
  const theme = useMantineTheme();
  const form = useForm({
    initialValues: { channel, commandPrefix, clipLimit, enabledProviders, layout, blockedSubmitters: existingBlockedSubmitters.join('\n'), blockedCreators: existingBlockedCreators.join('\n'), blurredProviders: existingBlurred, allowRedditNsfw: existingAllowRedditNsfw, skipThreshold: existingSkipThreshold, clipMemoryRetentionDays: existingClipMemoryRetentionDays, autoplayDelay: existingAutoplayDelay, subOnlyMode: existingSubOnlyMode, playerPercentDefault: useAppSelector(selectPlayerPercentDefault) },
  });

  return (
    <form
      onSubmit={form.onSubmit((settings) => {
        const blockedSubmittersArr = (settings.blockedSubmitters || '')
          .split('\n')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);

        const blockedCreatorsArr = (settings.blockedCreators || '')
          .split('\n')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);

        dispatch(settingsChanged({ ...settings, blockedSubmitters: blockedSubmittersArr, blockedCreators: blockedCreatorsArr, blurredProviders: settings.blurredProviders || [], allowRedditNsfw: settings.allowRedditNsfw }));
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Text weight={500} size="sm" sx={{ whiteSpace: 'nowrap' }}>
                  Player width: <Text component="span" color="red" weight={500} size="sm">*</Text>
                </Text>
                <NumberInput
                  required
                  min={30}
                  max={85}
                  step={1}
                  value={form.values.playerPercentDefault}
                  onChange={(v) => form.setFieldValue('playerPercentDefault', v ?? 79)}
                  styles={{ root: { display: 'inline-block' }, input: { width: 70 } }}
                />
                <Button size="xs" onClick={() => {
                  dispatch(settingsChanged({ playerPercentDefault: 79 }));
                  form.setFieldValue('playerPercentDefault', 79);
                }}>Reset</Button>
              </Box>
              <Text size="xs" color="dimmed">Tip: you can also drag the vertical divider between the player and the queue to resize the player.</Text>
            </Stack>
          </Tabs.Tab>

          <Tabs.Tab label="Queue" icon={<IconList size={16} />} {...({} as any)}>
            <div className="settings-scroll" style={{ height: '60vh', overflowY: 'auto', paddingRight: 12 }}>
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
                  <Text size="sm">Media providers</Text>
                  {getProviders().map((p) => {
                    const enabled = form.values.enabledProviders?.includes(p.key);
                    const blurred = form.values.blurredProviders?.includes(p.key);
                    const isReddit = p.key === 'reddit';
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
                          {isReddit && (
                            <>
                              <Text size="xs" color="dimmed">
                                NSFW
                              </Text>
                              <Switch
                                checked={!!form.values.allowRedditNsfw}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  form.setFieldValue('allowRedditNsfw', e.currentTarget.checked);
                                }}
                              />
                            </>
                          )}
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
                  label="Media limit"
                  description={
                    <>
                      Maximum number of media in the queue. Once the limit is reached, new submissions are blocked; you can skip items to free space.
                      <br />
                      Set to 0 or leave empty to disable.
                    </>
                  }
                  min={0}
                  step={1}
                  value={form.values.clipLimit ?? undefined}
                  onChange={(event) => form.setFieldValue('clipLimit', event ?? null)}
                />
                <NumberInput
                  label="Autoplay delay"
                  description="Seconds to wait before moving to the next item (0 = instant). At ≥1s, an overlay with a countdown is shown."
                  min={0}
                  max={5}
                  step={0.1}
                  precision={1}
                  value={form.values.autoplayDelay}
                  onChange={(v) => form.setFieldValue('autoplayDelay', v ?? 5)}
                />
              </Stack>
            </div>
          </Tabs.Tab>

          <Tabs.Tab label="Memory" icon={<IconHistory size={16} />} {...({} as any)}>
            <Stack>
              <Text size="sm">
                Choose how long watched media are remembered before they can be queued again. Leave retention empty for permanent memory (default).
              </Text>
              <Group>
                <Text size="sm">Memory contains <b>{historyIds.length}</b> media</Text>
                <Button color="red" size="xs" onClick={() => dispatch(memoryPurged())}>
                  Purge memory
                </Button>
              </Group>
              <NumberInput
                label="Memory retention (days)"
                description="Days to remember watched media before allowing re-queue. Leave empty for permanent memory."
                min={1}
                step={1}
                placeholder="Permanent"
                value={form.values.clipMemoryRetentionDays ?? undefined}
                onChange={(v) => form.setFieldValue('clipMemoryRetentionDays', v ?? null)}
              />
            </Stack>
          </Tabs.Tab>
          <Tabs.Tab label="Moderation" icon={<IconBan size={16} />} {...({} as any)}>
            <div className="settings-scroll" style={{ height: '60vh', overflowY: 'auto', paddingRight: 12 }}>
              <Stack>
                <Text size="sm">Blocked Submitters (one per line). Prevents these Twitch users from submitting media or using chat commands.</Text>
                <Textarea
                  minRows={6}
                  placeholder={"nightbot\nstreamelements"}
                  {...form.getInputProps('blockedSubmitters')}
                  style={{ maxHeight: '12rem', overflow: 'auto', resize: 'none' }}
                />
                <Text size="sm">Blocked Creators (one per line). Blocks media created by or originating from these channels/creators.</Text>
                <Textarea
                  minRows={6}
                  placeholder={"asmongold\nxqc\nhasanabi"}
                  {...form.getInputProps('blockedCreators')}
                  style={{ maxHeight: '12rem', overflow: 'auto', resize: 'none' }}
                />
                <Stack spacing={4}>
                  <Switch
                    label="Subscriber-only mode"
                    {...form.getInputProps('subOnlyMode', { type: 'checkbox' })}
                  />
                  <Text size="xs" color="dimmed">
                    Restricts submissions to subscribers, VIPs, moderators, and the broadcaster.
                  </Text>
                </Stack>
                <NumberInput
                  label="Skip votes required"
                  description="Unique chatters required to trigger a skip"
                  min={1}
                  step={1}
                  value={form.values.skipThreshold}
                  onChange={(v) => form.setFieldValue('skipThreshold', v ?? 20)}
                />
                <Box>
                  <Group spacing="sm" mb={8}>
                    <Text size="sm">Favorite Submitters</Text>
                    {existingFavoriteSubmitters.length > 0 && (
                      <Button
                        size="xs"
                        color="red"
                        variant="subtle"
                        onClick={() => dispatch(settingsChanged({ favoriteSubmitters: [] }))}
                      >
                        Clear All
                      </Button>
                    )}
                  </Group>
                  {existingFavoriteSubmitters.length > 0 ? (
                    <Group spacing="xs">
                      {existingFavoriteSubmitters.map((username) => (
                        <Box
                          key={username}
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            position: 'relative',
                            paddingRight: 6,
                            '&:hover .fav-overlay, &:focus-within .fav-overlay': { opacity: 1, pointerEvents: 'auto' },
                            '&:hover .fav-badge-text, &:focus-within .fav-badge-text': { opacity: 0 },
                          }}
                        >
                          <Badge
                            size="lg"
                            variant="filled"
                            color="yellow"
                            sx={{
                              cursor: 'default',
                              paddingRight: 8,
                              textTransform: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              position: 'relative',
                            }}
                          >
                            <span className="fav-badge-text" style={{ transition: 'opacity 120ms' }}>{username}</span>
                          </Badge>

                          <Box
                            component="button"
                            className="fav-overlay"
                            aria-label={`Remove favorite ${username}`}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              dispatch(removeFavoriteSubmitter(username));
                            }}
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(0,0,0,0.12)',
                              color: 'black',
                              border: 0,
                              padding: 0,
                              margin: 0,
                              cursor: 'pointer',
                              opacity: 0,
                              pointerEvents: 'none',
                              transition: 'opacity 120ms',
                              zIndex: 5,
                              '&:hover': { background: 'rgba(0,0,0,0.18)' },
                            }}
                          >
                            ×
                          </Box>
                        </Box>
                      ))}
                    </Group>
                  ) : (
                    <Text size="xs" color="dimmed" italic>
                      No favorites yet. Use the star button under the player to add favorites.
                    </Text>
                  )}
                </Box>
              </Stack>
            </div>
          </Tabs.Tab>
          <Tabs.Tab label="About" icon={<IconInfoCircle size={16} />} {...({} as any)}>
            <Stack spacing="md" p="md">
              <Box>
                <Text size="lg" weight={600} mb="xs">React Queue v1.1.5</Text>
                <Text size="sm" color="dimmed">
                  A Twitch-integrated media queue for streamers and content creators
                </Text>
              </Box>

              <Box>
                <Text size="sm" weight={500} mb={4}>Built by</Text>
                <Text size="sm" color="dimmed">
                  <a href="https://github.com/EnjoyTheFun" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                    EnjoyTheFun
                  </a>
                </Text>
              </Box>

              <Box>
                <Text size="sm" weight={500} mb={4}>Based on</Text>
                <Text size="sm" color="dimmed">
                  <a href="https://jakemiki.me/twitch-clip-queue/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                    Clip Queue
                  </a>
                  {' '}by{' '}
                  <a href="https://github.com/jakemiki/twitch-clip-queue" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                    jakemiki
                  </a>
                </Text>
                <Text size="xs" color="dimmed" mt="xs">
                  React Queue is a custom fork that extends the original Clip Queue project with support for multiple media platforms,
                  enhanced moderation features, and additional customization options.
                </Text>
              </Box>

              <Box>
                <Text size="sm" weight={500} mb={4}>Source Code</Text>
                <Text size="sm" color="dimmed">
                  <a href="https://github.com/EnjoyTheFun/twitch-react-queue" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                    View on GitHub
                  </a>
                </Text>
              </Box>

              <Box>
                <Text size="sm" weight={500} mb={4}>License</Text>
                <Text size="xs" color="dimmed">
                  This project is open source and available under the MIT License.
                </Text>
              </Box>
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
