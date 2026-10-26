import { Anchor, Center, Container, Grid, Pagination, Text, Button, Group } from '@mantine/core';
import { useState, useMemo, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { historyCleared, memoryClipRemoved, memoryPurged, selectCurrentId, selectHistoryIds, makeSelectHistoryPageClips, loadClipFromHistory } from '../clipQueueSlice';
import Clip from '../Clip';
import clipProvider from '../providers/providers';

const HISTORY_PAGE_SIZE = 18;

function MemoryPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [activePage, setPage] = useState(1);
  const selectHistoryPageClips = useMemo(() => makeSelectHistoryPageClips(), []);

  const clipObjects = useAppSelector((state) => selectHistoryPageClips(state, activePage, HISTORY_PAGE_SIZE));

  const totalClips = useAppSelector(selectHistoryIds).length;
  const currentClipId = useAppSelector(selectCurrentId);
  const totalPages = Math.ceil(totalClips / HISTORY_PAGE_SIZE);

  const handleClipClick = (clipId: string, e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    dispatch(loadClipFromHistory(clipId));
    navigate('/queue');
  };

  const handleOpenClick = (clipId: string, e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const href = clipProvider.getUrl(clipId);
    if (href) window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <Container size="xl" py="md">
      <Group sx={{ position: 'fixed', top: 75, right: 16, zIndex: 10, gap: 8 }}>
        <Button
          size="xs"
          onClick={() => dispatch(memoryPurged())}
          sx={{
            height: 32,
            borderRadius: 10,
            border: '1px solid rgba(145, 70, 255, 0.4)',
            background: 'linear-gradient(115deg, rgba(145, 70, 255, 0.2), rgba(100, 65, 165, 0.12))',
            color: 'var(--mantine-color-text)',
            transition: 'background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
            '&:hover': {
              background: 'linear-gradient(115deg, rgba(145, 70, 255, 0.3), rgba(100, 65, 165, 0.2))',
              borderColor: 'rgba(145, 70, 255, 0.62)',
              boxShadow: '0 2px 10px rgba(145, 70, 255, 0.16)',
            },
          }}
        >
          Purge memory
        </Button>
        <Button
          size="xs"
          onClick={() => dispatch(historyCleared())}
          sx={{
            height: 32,
            borderRadius: 10,
            border: '1px solid rgba(250, 82, 82, 0.42)',
            background: 'linear-gradient(115deg, rgba(250, 82, 82, 0.2), rgba(190, 45, 75, 0.12))',
            color: 'var(--mantine-color-text)',
            transition: 'background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
            '&:hover': {
              background: 'linear-gradient(115deg, rgba(250, 82, 82, 0.3), rgba(190, 45, 75, 0.2))',
              borderColor: 'rgba(250, 82, 82, 0.64)',
              boxShadow: '0 2px 10px rgba(250, 82, 82, 0.14)',
            },
          }}
        >
          Clear history
        </Button>
      </Group>

      {totalPages > 0 ? (
        <>
          <Center>
            <Pagination
              page={activePage}
              onChange={setPage}
              total={totalPages}
              styles={{
                item: {
                  borderRadius: 9,
                  border: '1px solid rgba(54, 79, 199, 0.28)',
                  background: 'linear-gradient(115deg, rgba(54, 79, 199, 0.12), rgba(145, 110, 230, 0.07))',
                  color: 'var(--mantine-color-text)',
                  transition: 'background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
                  '&:hover': {
                    borderColor: 'rgba(54, 79, 199, 0.48)',
                    background: 'linear-gradient(115deg, rgba(54, 79, 199, 0.2), rgba(145, 110, 230, 0.12))',
                  },
                },
                active: {
                  borderColor: 'rgba(54, 79, 199, 0.45)',
                  background: 'linear-gradient(115deg, rgba(54, 79, 199, 0.3), rgba(145, 110, 230, 0.18))',
                  boxShadow: '0 2px 10px rgba(54, 79, 199, 0.14)',
                },
              }}
            />
          </Center>
          <Grid py="sm">
            {clipObjects.map((clip) => (
              <Grid.Col span={2} key={clip!.id}>
                <Anchor
                  href={clipProvider.getUrl(clip!.id)}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  underline={false}
                  onClick={(e: MouseEvent<HTMLAnchorElement>) => handleClipClick(clip!.id, e)}
                >
                  <Clip
                    platform={clip!.Platform || undefined}
                    card
                    clipId={clip!.id}
                    isCurrent={clip!.id === currentClipId}
                    showHistoryBadges
                    onClick={() => { }}
                    onOpenClick={(e) => handleOpenClick(clip!.id, e)}
                    onCrossClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      dispatch(memoryClipRemoved(clip!.id));
                    }}
                  />
                </Anchor>
              </Grid.Col>
            ))}
          </Grid>
        </>
      ) : (
        <Text>Clip history is empty.</Text>
      )}
    </Container>
  );
}

export default MemoryPage;
