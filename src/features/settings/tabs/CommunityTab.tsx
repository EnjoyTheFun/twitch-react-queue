import { Badge, Box, Button, Group, NumberInput, Stack, Switch, Text, TextInput } from '@mantine/core';
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { removeFavoriteSubmitter, selectFavoriteSubmitters, settingsChanged } from '../settingsSlice';
import type { SettingsTabProps } from './types';

function CommunityTab({ form }: SettingsTabProps) {
  const dispatch = useAppDispatch();
  const favoriteSubmitters = useAppSelector(selectFavoriteSubmitters);

  return (
    <Stack>
      <NumberInput
        label="Skip votes required"
        description="Unique chatters required to trigger a skip"
        min={1}
        step={1}
        value={form.values.skipThreshold}
        onChange={(v) => form.setFieldValue('skipThreshold', v ?? 20)}
      />
      <Stack spacing={4}>
        <TextInput
          label="Poll vote keyword (yea)"
          description="Chat message that counts as a Yea vote"
          required
          value={form.values.voteYeaKeyword}
          onChange={(e) => form.setFieldValue('voteYeaKeyword', e.currentTarget.value)}
        />
        <TextInput
          label="Poll vote keyword (nay)"
          description="Chat message that counts as a Nay vote"
          required
          value={form.values.voteNayKeyword}
          onChange={(e) => form.setFieldValue('voteNayKeyword', e.currentTarget.value)}
        />
        <Text size="xs" color="dimmed">Defaults: VoteYea / VoteNay</Text>
      </Stack>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Text size="sm">Submitter notes</Text>
          <Text size="xs" color="dimmed">
            Show the extra text alongside the URL subs/VIPs/mods attach to their link submission.
          </Text>
        </div>
        <Switch
          checked={form.values.showSubmitterNotes}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            form.setFieldValue('showSubmitterNotes', e.currentTarget.checked);
          }}
        />
      </Box>
      <Box>
        <Group spacing="sm" mb={8}>
          <Text size="sm" weight={500}>Favorite Submitters</Text>
          {favoriteSubmitters.length > 0 && (
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
        {favoriteSubmitters.length > 0 ? (
          <Group spacing="xs">
            {favoriteSubmitters.map((username) => (
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
  );
}

export default CommunityTab;
