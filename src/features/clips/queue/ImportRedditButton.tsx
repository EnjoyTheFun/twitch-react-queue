import { useState, useCallback } from 'react';
import { Button, Popover, Group, NumberInput, Divider, Text } from '@mantine/core';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { clipStubReceived } from '../clipQueueSlice';
import clipProvider from '../providers/providers';
import { IconBrandReddit } from '@tabler/icons-react';
import { selectUsername } from '../../auth/authSlice';
import redditApi from '../../../common/apis/redditApi';
import type { RedditSort } from '../../../common/models/reddit';

function ImportRedditButton() {
  const dispatch = useAppDispatch();
  const username = useAppSelector(selectUsername);

  const [disabled, setDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSort, setSelectedSort] = useState<RedditSort>('top');
  const [postLimit, setPostLimit] = useState(20);

  const handleImport = useCallback(async (sort: RedditSort) => {
    if (isLoading) return;

    setDisabled(true);
    setIsLoading(true);
    setSelectedSort(sort);

    const timeout = setTimeout(() => {
      setDisabled(false);
      setIsLoading(false);
    }, 15000);

    try {
      const links = await redditApi.getSubredditPosts('LivestreamFail', sort, postLimit, 'day');
      let successCount = 0;
      let failureCount = 0;

      console.log(`Found ${links.length} potential clips from Reddit (${sort})`);

      for (const entry of links) {
        if (!entry?.url || typeof entry.url !== 'string') {
          console.warn('Invalid link entry:', entry);
          failureCount++;
          continue;
        }

        const { url, username: redditUsername, title } = entry;
        const id = clipProvider.getIdFromUrl(url);

        if (id) {
          try {
            const clip = await clipProvider.getClipById(id);
            if (clip) {
              dispatch(clipStubReceived({
                ...clip,
                submitters: [`${redditUsername} (r/LSF)`],
                url: clip.url || url,
                title: title || clip.title
              }));
              successCount++;
            } else {
              dispatch(clipStubReceived({
                id,
                submitters: [`${redditUsername} (r/LSF)`],
                url,
                title
              }));
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

      console.log(`Reddit import (${sort}) completed: ${successCount} successful, ${failureCount} failed`);
    } catch (error) {
      console.error('Reddit import process failed:', error);
    } finally {
      clearTimeout(timeout);
      setDisabled(false);
      setIsLoading(false);
    }
  }, [dispatch, isLoading, postLimit]);

  if (!username) return null;

  const sortLabels: Record<RedditSort, string> = {
    top: 'Top',
    hot: 'Hot',
    best: 'Best',
    new: 'New'
  };

  const [open, setOpen] = useState(false);

  return (
    <Popover
      target={
        <Button
          size="xs"
          color="orange"
          title={disabled ? 'Importing Reddit clips...' : `Import clips from r/LivestreamFail`}
          onClick={() => setOpen((o) => !o)}
        >
          <IconBrandReddit />
        </Button>
      }
      opened={open}
      onClose={() => setOpen(false)}
      position="bottom"
      placement="end"
    >
      <Text size="xs" weight={600} style={{ marginBottom: 6 }}>Sort by</Text>
      <Group direction="column" spacing={2} style={{ marginBottom: 8 }}>
        {(['top', 'hot', 'best', 'new'] as RedditSort[]).map((sort) => (
          <Button
            key={sort}
            variant={sort === selectedSort ? 'light' : 'subtle'}
            size="xs"
            onPointerDown={(e: React.PointerEvent) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedSort(sort);
              handleImport(sort);
              setOpen(false);
            }}
            compact
          >
            {sortLabels[sort]}
          </Button>
        ))}
      </Group>

      <Divider />
      <Text size="xs" weight={600} style={{ margin: '8px 0' }}>Number of posts</Text>
      <div style={{ padding: '8px 12px' }} onClick={(e) => e.stopPropagation()}>
        <NumberInput
          value={postLimit}
          onChange={(value) => setPostLimit(typeof value === 'number' ? value : 20)}
          min={1}
          max={100}
          step={5}
          size="xs"
          placeholder="20"
          styles={{
            input: { textAlign: 'center' }
          }}
        />
      </div>
    </Popover>
  );
}

export default ImportRedditButton;
