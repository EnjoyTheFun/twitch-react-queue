import { Box, Button, Code, NumberInput, Stack, Switch, Text, TextInput } from '@mantine/core';
import { useAppDispatch } from '../../../app/hooks';
import { settingsChanged } from '../settingsSlice';
import type { SettingsTabProps } from './types';

function GeneralTab({ form }: SettingsTabProps) {
  const dispatch = useAppDispatch();

  return (
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
      <Switch
        label="Show progress bar when player controls are hidden"
        checked={form.values.showPlayerProgressBar !== false}
        onChange={(event) => form.setFieldValue('showPlayerProgressBar', event.currentTarget.checked)}
      />
    </Stack>
  );
}

export default GeneralTab;
