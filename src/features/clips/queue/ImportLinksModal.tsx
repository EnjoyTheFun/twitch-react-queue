import React from 'react';
import { Stack, Textarea, Button, Group, Text } from '@mantine/core';
import { useModals } from '@mantine/modals';
import { useAppDispatch } from '../../../app/hooks';
import { createLogger } from '../../../common/logging';
import { urlEnqueue, Userstate } from '../../twitchChat/actions';

const logger = createLogger('ImportLinksModal');

function ImportLinksModal() {
  const modals = useModals();
  const dispatch = useAppDispatch();
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [importProgress, setImportProgress] = React.useState<{ completed: number; total: number } | null>(null);

  const close = () => modals.closeAll();

  const onConfirm = async () => {
    if (importProgress) return;
    const items: Array<{ url: string; submitter?: string }> = [];
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
    } catch {
      const parts = value.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
      for (const p of parts) {
        items.push({ url: p });
      }
    }

    if (items.length === 0) {
      setError('No URLs found in the provided input');
      return;
    }

    setError(null);
    setImportProgress({ completed: 0, total: items.length });

    const batchSize = 5;
    for (let index = 0; index < items.length; index += batchSize) {
      const batch = items.slice(index, index + batchSize);
      for (const item of batch) {
        const user: Userstate = { username: item.submitter ?? 'import*' };
        dispatch(urlEnqueue({ url: item.url, userstate: user }));
      }
      const completed = Math.min(index + batch.length, items.length);
      setImportProgress({ completed, total: items.length });
      if (completed < items.length) {
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      }
    }

    logger.debug(`Import completed: ${items.length} link(s) queued`);
    close();
  };

  return (
    <Stack>
      <Text size="sm">Paste JSON array of strings or objects with a <code>url</code> property. You can also paste a list of urls separated by commas or new lines.</Text>
      <Textarea
        placeholder='[
  { "url": "https://youtu.be/dQw4w9WgXcQ", "submitter": "alice" },
  { "url": "https://www.tiktok.com/@user/video/987654321", "submitter": "charlie" }
]'
        autosize={false}
        minRows={18}
        maxRows={12}
        value={value}
        disabled={importProgress !== null}
        onChange={(e) => setValue(e.currentTarget.value)}
      />
      {error && <Text color="red" size="sm">{error}</Text>}
      {importProgress && <Text size="sm">Importing {importProgress.completed} of {importProgress.total} links...</Text>}
      <Group position="right">
        <Button className="modal-cancel-button" variant="outline" onClick={close} disabled={importProgress !== null}>Cancel</Button>
        <Button className="modal-primary-button" onClick={onConfirm} disabled={importProgress !== null}>Import</Button>
      </Group>
    </Stack>
  );
}

export default ImportLinksModal;
