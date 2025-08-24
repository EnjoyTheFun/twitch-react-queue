import { useState, useCallback } from 'react';
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
    if (!apiUrl) {
      console.warn('Discord links API URL not configured');
      return [];
    }

    const res = await axios.get(apiUrl, { timeout: 10000 });
    if (res.status !== 200) throw new Error(`HTTP error: ${res.status}`);

    const data = res.data;
    if (!data || !Array.isArray(data.links)) {
      console.warn('Invalid response format from Discord links API');
      return [];
    }

    return data.links;
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
  const [isLoading, setIsLoading] = useState(false);

  const whitelist = (process.env.REACT_APP_IMPORT_WHITELIST || "")
    .split(",")
    .map(u => u.trim())
    .filter(Boolean);

  const handleImport = useCallback(async () => {
    if (isLoading) return;

    setDisabled(true);
    setIsLoading(true);

    const timeout = setTimeout(() => {
      setDisabled(false);
      setIsLoading(false);
    }, 10000);

    try {
      const links = await fetchLinks();
      let successCount = 0;
      let failureCount = 0;

      for (const entry of links) {
        if (!entry?.url || typeof entry.url !== 'string') {
          console.warn('Invalid link entry:', entry);
          failureCount++;
          continue;
        }

        const { url, username: discordUsername } = entry;
        const id = clipProvider.getIdFromUrl(url);

        if (id) {
          try {
            const clip = await clipProvider.getClipById(id);
            if (clip) {
              dispatch(clipStubReceived({ ...clip, submitters: [discordUsername + "*"], url }));
              successCount++;
            } else {
              dispatch(clipStubReceived({ id, submitters: [discordUsername + "*"], url }));
              successCount++;
            }
          } catch (error) {
            console.error('Failed to process clip:', url, error);
            failureCount++;
          }
        } else {
          console.warn('Unsupported link format:', url);
          failureCount++;
        }
      }

      console.log(`Import completed: ${successCount} successful, ${failureCount} failed`);
    } catch (error) {
      console.error('Import process failed:', error);
    } finally {
      clearTimeout(timeout);
      setDisabled(false);
      setIsLoading(false);
    }
  }, [dispatch, isLoading]);

  if (!apiUrl || !username || !whitelist.includes(username)) return null;

  return (
    <Button
      size="xs"
      onClick={handleImport}
      disabled={disabled}
      loading={isLoading}
      title={disabled ? 'Import in progress...' : 'Import Discord links'}
    >
      <IconBrandDiscord />
    </Button>
  );
}

export default ImportLinksButton;
