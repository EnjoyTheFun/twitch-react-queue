import { TextInput, ActionIcon, ScrollArea, Stack } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { useState, useCallback, useMemo } from 'react';
import { useModals } from '@mantine/modals';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectQueueClips, currentClipReplaced } from '../clipQueueSlice';
import type { Clip } from '../clipQueueSlice';
import ClipComponent from '../Clip';

class QueueSearchFilter {
  private static normalizeQuery(query: string): string {
    return query.toLowerCase().trim();
  }

  private static getClipSearchText(clip: Clip): string {
    const parts: string[] = [];

    if (clip.title) parts.push(clip.title);
    if (clip.author) parts.push(clip.author);
    if (clip.submitters) {
      parts.push(...clip.submitters);
    }

    return parts.join(' ').toLowerCase();
  }

  static filterClips(clips: Clip[], query: string): Clip[] {
    const normalizedQuery = this.normalizeQuery(query);

    if (!normalizedQuery) {
      return clips;
    }

    return clips.filter((clip) => {
      const searchText = this.getClipSearchText(clip);
      return searchText.includes(normalizedQuery);
    });
  }
}

function QueueSearchModal({ closeModal }: { closeModal: () => void }) {
  const [query, setQuery] = useState('');
  const dispatch = useAppDispatch();
  const allClips = useAppSelector(selectQueueClips);

  const filteredResults = useMemo(() => {
    return QueueSearchFilter.filterClips(allClips, query);
  }, [allClips, query]);

  const handleClipClick = useCallback(
    (clipId: string) => {
      dispatch(currentClipReplaced(clipId));
      closeModal();
    },
    [dispatch, closeModal]
  );

  return (
    <Stack spacing="md" sx={{ maxHeight: '80vh' }}>
      <TextInput
        placeholder="Search queue by title, author, or submitter..."
        icon={<IconSearch size={16} />}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        autoFocus
        size="md"
        rightSection={
          <ActionIcon
            size="sm"
            variant="transparent"
            onClick={closeModal}
            aria-label="Close search"
          >
            <IconX size={16} />
          </ActionIcon>
        }
      />
      <ScrollArea style={{ height: '60vh', maxHeight: '60vh' }}>
        <Stack spacing="xs">
          {filteredResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
              {query ? 'No matches' : 'Queue is empty'}
            </div>
          ) : (
            filteredResults.map((clip) => (
              <div key={clip.id} onClick={() => handleClipClick(clip.id)} style={{ cursor: 'pointer' }}>
                <ClipComponent
                  platform={clip.Platform || undefined}
                  clipId={clip.id}
                  queueIndex={clip.seq}
                  onClick={() => handleClipClick(clip.id)}
                />
              </div>
            ))
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}

export const useQueueSearchModal = () => {
  const modals = useModals();

  const openQueueSearchModal = () => {
    const id = modals.openModal({
      children: <QueueSearchModal closeModal={() => modals.closeModal(id)} />,
      closeOnClickOutside: true,
      closeOnEscape: true,
      size: 'lg',
      withCloseButton: false,
    });
  };

  return { openQueueSearchModal };
};

export default QueueSearchModal;
