import { Button, Group, NumberInput, Stack, Text } from '@mantine/core';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { memoryPurged, selectHistoryIds } from '../../clips/clipQueueSlice';
import type { SettingsTabProps } from './types';

function MemoryTab({ form }: SettingsTabProps) {
  const dispatch = useAppDispatch();
  const historyIds = useAppSelector(selectHistoryIds);

  return (
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
  );
}

export default MemoryTab;
