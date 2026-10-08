import { Box, Group, NumberInput, Select, Stack, Switch, Text, useMantineTheme } from '@mantine/core';
import React from 'react';
import { getProviders } from '../../../common/utils';
import type { SettingsTabProps } from './types';

function QueueTab({ form }: SettingsTabProps) {
  const theme = useMantineTheme();

  return (
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
        <Text size="sm" weight={500}>Media providers</Text>
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
  );
}

export default QueueTab;
