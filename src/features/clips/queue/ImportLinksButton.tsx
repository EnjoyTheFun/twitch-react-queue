import { useState } from 'react';
import { Button } from '@mantine/core';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { clipStubReceived } from '../clipQueueSlice';
import clipProvider from '../providers/providers';
import { IconBrandDiscord } from '@tabler/icons-react';
import { selectUsername } from '../../auth/authSlice';
import axios from 'axios';

async function fetchLinks(): Promise<{ url: string; username: string }[]> {
  try {
    const apiUrl = process.env.REACT_APP_DC_LINKS_API_URL;
    if (!apiUrl) return [];
    const res = await axios.get(apiUrl);
    if (res.status !== 200) throw new Error(`HTTP error: ${res.status}`);
    return res.data.links || [];
  } catch (error) {
    console.error('Failed to fetch links:', error);
    return [];
  }
}

function ImportLinksButton() {
  const dispatch = useAppDispatch();
  const apiUrl = process.env.REACT_APP_DC_LINKS_API_URL;
  const username = useAppSelector(selectUsername);

  const [disabled, setDisabled] = useState(false);

  const whitelist = (process.env.REACT_APP_IMPORT_WHITELIST || "")
    .split(",")
    .map(u => u.trim())
    .filter(Boolean);

  if (!apiUrl || !username || !whitelist.includes(username)) return null;

  const handleImport = async () => {
    setDisabled(true);
    setTimeout(() => setDisabled(false), 10000);

    const links = await fetchLinks();

    for (const entry of links) {
      if (!entry?.url) {
        console.warn('Unsupported link:', entry?.url);
        continue;
      }
      const { url, username: discordUsername } = entry;
      const id = clipProvider.getIdFromUrl(url);
      if (id) {
        const clip = await clipProvider.getClipById(id);
        if (clip) {
          dispatch(clipStubReceived({ ...clip, submitters: [discordUsername + "*"], url }));
        } else {
          dispatch(clipStubReceived({ id, submitters: [discordUsername + "*"], url }));
        }
      } else {
        console.warn('Unsupported link:', url);
      }
    }
  };

  return (
    <Button size="xs" onClick={handleImport} disabled={disabled}>
      <IconBrandDiscord />
    </Button>
  );
}

export default ImportLinksButton;
