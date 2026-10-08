import { Button, Group, Stack, Text, Textarea } from '@mantine/core';
import { useModals } from '@mantine/modals';
import { useAppSelector } from '../../../app/hooks';
import { selectQueueClips } from '../clipQueueSlice';

function ExportQueueModal() {
  const modals = useModals();
  const clips = useAppSelector(selectQueueClips);
  const exportItems = clips.flatMap((clip) => {
    if (!clip.url) return [];
    const submitters = clip.submitters.length > 0 ? clip.submitters : [undefined];
    return submitters.map((submitter) => ({
      url: clip.url,
      ...(submitter ? { submitter } : {}),
    }));
  });
  const value = JSON.stringify(exportItems, null, 2);

  return (
    <Stack>
      <Text size="sm">Copy this JSON to save the current queue. It can be pasted into Import links to restore the URLs and submitters.</Text>
      <Textarea
        aria-label="Exported queue data"
        autosize
        minRows={6}
        maxRows={16}
        readOnly
        value={value}
        onFocus={(event) => event.currentTarget.select()}
      />
      <Group position="right">
        <Button onClick={() => modals.closeAll()}>Close</Button>
      </Group>
    </Stack>
  );
}

export default ExportQueueModal;
