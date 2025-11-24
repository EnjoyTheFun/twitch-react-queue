import { useState, useCallback, useRef, useEffect } from 'react';
import { ActionIcon, Menu, Box, NumberInput, Divider } from '@mantine/core';
import { IconPlus, IconX, IconBulb, IconBrandReddit, IconBrandDiscord } from '@tabler/icons-react';
import { useModals } from '@mantine/modals';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { clipStubReceived } from '../clipQueueSlice';
import clipProvider from '../providers/providers';
import { selectUsername } from '../../auth/authSlice';
import redditApi from '../../../common/apis/redditApi';
import type { RedditSort } from '../../../common/models/reddit';
import axios from 'axios';
import ImportLinksModal from './ImportLinksModal';

async function fetchDiscordLinks(): Promise<{ url: string; username: string }[]> {
  try {
    const apiUrl = import.meta.env.VITE_DC_LINKS_API_URL;
    if (!apiUrl) {
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

function FloatingImportMenu() {
  const dispatch = useAppDispatch();
  const username = useAppSelector(selectUsername);
  const apiUrl = import.meta.env.VITE_DC_LINKS_API_URL;
  const modals = useModals();

  const [isOpen, setIsOpen] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [redditLoading, setRedditLoading] = useState(false);
  const [redditMenuOpen, setRedditMenuOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState<RedditSort>('top');
  const [postLimit, setPostLimit] = useState(20);

  const whitelist = (import.meta.env.VITE_IMPORT_WHITELIST || "")
    .split(",")
    .map(u => u.trim())
    .filter(Boolean);

  const hasDiscordAccess = apiUrl && username && whitelist.includes(username);

  const openBulkImportModal = () => {
    modals.openModal({
      title: 'Import links',
      children: <ImportLinksModal />,
      size: 'lg',
    });
    setIsOpen(false);
  };

  const handleDiscordImport = useCallback(async () => {
    if (discordLoading) return;

    setDiscordLoading(true);

    const timeout = setTimeout(() => {
      setDiscordLoading(false);
    }, 10000);

    try {
      const links = await fetchDiscordLinks();
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
              dispatch(clipStubReceived({ ...clip, submitters: [discordUsername + "*"], url: clip.url || url }));
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
      setDiscordLoading(false);
      setIsOpen(false);
    }
  }, [dispatch, discordLoading]);

  const handleRedditImport = useCallback(async (sort: RedditSort) => {
    if (redditLoading) return;

    setIsOpen(true);
    setRedditMenuOpen(false);
    setRedditLoading(true);
    setSelectedSort(sort);

    const timeout = setTimeout(() => {
      setRedditLoading(false);
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
      setRedditLoading(false);
      setTimeout(() => {
        setRedditMenuOpen(false);
        setIsOpen(false);
      }, 600);
    }
  }, [dispatch, redditLoading, postLimit]);

  if (!username) return null;

  const sortLabels: Record<RedditSort, string> = {
    top: 'Top',
    hot: 'Hot',
    best: 'Best',
    new: 'New'
  };

  const handleFabToggle = () => {
    setIsOpen((prev) => {
      if (prev) {
        setRedditMenuOpen(false);
      }
      return !prev;
    });
  };

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (ev: PointerEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;

      const path = (ev as any).composedPath ? (ev as any).composedPath() as EventTarget[] : (ev as any).path as EventTarget[] | undefined;

      if (path && path.length) {
        for (const node of path) {
          if (!(node instanceof HTMLElement)) continue;
          if (containerRef.current && containerRef.current.contains(node)) return;
          if (
            node.closest && (
              node.closest('.mantine-Menu-dropdown') ||
              node.closest('.mantine-Popover-dropdown') ||
              node.closest('.mantine-Popover-root') ||
              node.closest('.mantine-Popper-root') ||
              node.closest('[data-mantine-dropdown]') ||
              node.closest('[data-mantine-popover]')
            )
          ) return;
        }
      }

      if (containerRef.current && containerRef.current.contains(target)) return;

      try {
        const cx = (ev as any).clientX;
        const cy = (ev as any).clientY;
        if (typeof cx === 'number' && typeof cy === 'number') {
          const dropdownSelectors = [
            '.etf-reddit-dropdown',
            '.mantine-Menu-dropdown',
            '.mantine-Popover-dropdown',
            '.mantine-Popover-root',
            '.mantine-Popper-root',
            '[data-mantine-dropdown]',
            '[data-mantine-popover]'
          ];
          for (const sel of dropdownSelectors) {
            const nodes = document.querySelectorAll(sel);
            for (const n of Array.from(nodes)) {
              if (!(n instanceof HTMLElement)) continue;
              const r = n.getBoundingClientRect();
              if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
                return;
              }
            }
          }
        }
      } catch (err) { }

      setIsOpen(false);
      setRedditMenuOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  return (
    <Box className="floating-import-menu" ref={containerRef}>
      <ActionIcon
        className={`fab-main ${isOpen ? 'open' : ''}`}
        size="xl"
        radius="xl"
        variant="filled"
        color="indigo"
        aria-label={isOpen ? 'Close import options' : 'Open import options'}
        onClick={handleFabToggle}
        sx={{
          transition: 'transform 220ms ease',
          '&:hover': {
            transform: 'scale(1.08)',
          },
        }}
      >
        <IconPlus size={24} />
      </ActionIcon>

      <Box className={`fab-items ${isOpen ? 'open' : ''}`}>
        <ActionIcon
          className="fab-item fab-item-1"
          size="xl"
          radius="xl"
          variant="filled"
          color="violet"
          aria-label="Import in bulk"
          onClick={openBulkImportModal}
        >
          <IconBulb size={20} />
        </ActionIcon>

        <Menu
          withinPortal
          position="left"
          withArrow
          closeOnItemClick={false}
          opened={redditMenuOpen}
          onOpen={() => setRedditMenuOpen(true)}
          onClose={() => setRedditMenuOpen(false)}
          control={
            <ActionIcon
              className="fab-item fab-item-2"
              size="xl"
              radius="xl"
              variant="filled"
              color="orange"
              aria-label="Import from r/LSF"
              loading={redditLoading}
            >
              <IconBrandReddit size={20} />
            </ActionIcon>
          }
        >
          <div className="etf-reddit-dropdown">
            <Menu.Label>
              <div className="reddit-menu-header">
                <span>Sort by</span>
                <ActionIcon
                  size="xs"
                  variant="light"
                  aria-label="Close Reddit import menu"
                  onClick={() => setRedditMenuOpen(false)}
                >
                  <IconX size={12} />
                </ActionIcon>
              </div>
            </Menu.Label>
            {(['top', 'hot', 'best', 'new'] as RedditSort[]).map((sort) => (
              <Menu.Item
                key={sort}
                onClick={() => handleRedditImport(sort)}
                sx={sort === selectedSort ? { fontWeight: 600 } : undefined}
              >
                {sortLabels[sort]}
              </Menu.Item>
            ))}
            <Divider />
            <Menu.Label>Number of posts</Menu.Label>
            <div
              style={{ padding: '8px 12px' }}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
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
          </div>
        </Menu>

        {hasDiscordAccess && (
          <ActionIcon
            className="fab-item fab-item-3"
            size="xl"
            radius="xl"
            variant="filled"
            color="indigo"
            aria-label="Import from Discord"
            loading={discordLoading}
            onClick={handleDiscordImport}
          >
            <IconBrandDiscord size={20} />
          </ActionIcon>
        )}
      </Box>
    </Box>
  );
}

export default FloatingImportMenu;
