import { Stack, Text, Textarea } from '@mantine/core';
import type { SettingsTabProps } from './types';

function ModerationTab({ form }: SettingsTabProps) {
  return (
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
    </Stack>
  );
}

export default ModerationTab;
