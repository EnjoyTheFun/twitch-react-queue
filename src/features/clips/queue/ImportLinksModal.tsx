import React from 'react';
import { Stack, Textarea, Button, Group, Text } from '@mantine/core';
import { useModals } from '@mantine/modals';
import { useAppDispatch } from '../../../app/hooks';
import { urlEnqueue, Userstate } from '../../twitchChat/actions';

function ImportLinksModal() {
  const modals = useModals();
  const dispatch = useAppDispatch();
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const close = () => modals.closeAll();

  const onConfirm = () => {
    let items: Array<{ url: string; submitter?: string }> = [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === 'string') items.push({ url: item });
          else if (item && typeof item.url === 'string') items.push({ url: item.url, submitter: item.submitter });
        }
      } else if (typeof parsed === 'string') {
        items.push({ url: parsed });
      } else if (parsed && typeof parsed.url === 'string') {
        items.push({ url: parsed.url, submitter: parsed.submitter });
      }
    } catch (e) {
      const parts = value.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
      for (const p of parts) {
        items.push({ url: p });
      }
    }

    if (items.length === 0) {
      setError('No URLs found in the provided input');
      return;
    }

    for (const item of items) {
      const user: Userstate = { username: item.submitter ?? 'import*' };
      dispatch(urlEnqueue({ url: item.url, userstate: user }));
    }

    close();
  };

  return (
    <Stack>
      <Text size="sm">Paste JSON array of strings or objects with a <code>url</code> property.</Text>
      <Textarea
        placeholder='[
  { "url": "https://youtu.be/dQw4w9WgXcQ", "submitter": "alice" },
  { "url": "https://www.tiktok.com/@user/video/987654321", "submitter": "charlie" }
]'
        autosize
        minRows={6}
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
      />
      {error && <Text color="red" size="sm">{error}</Text>}
      <Group position="right">
        <Button variant="outline" onClick={close}>Cancel</Button>
        <Button onClick={onConfirm}>Import</Button>
      </Group>
    </Stack>
  );
}

export default ImportLinksModal;
