import { Anchor, Center, Container, Grid, Pagination, Text, Group, Button, Box } from '@mantine/core';
import { useState, useMemo, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { memoryClipRemoved, memoryPurged, selectHistoryIds, makeSelectHistoryPageClips, loadClipFromHistory } from '../clipQueueSlice';
import Clip from '../Clip';
import clipProvider from '../providers/providers';

function MemoryPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [activePage, setPage] = useState(1);
  const selectHistoryPageClips = useMemo(() => makeSelectHistoryPageClips(), []);

  const clipObjects = useAppSelector((state) => selectHistoryPageClips(state, activePage, 24));

  const totalClips = useAppSelector(selectHistoryIds).length;
  const totalPages = Math.ceil(totalClips / 24);

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
      <Button
        color="red"
        size="xs"
        onClick={() => dispatch(memoryPurged())}
        sx={{ position: 'fixed', top: 75, right: 16 }}
      >
        Clear
      </Button>

      {totalPages > 0 ? (
        <>
          <Center>
            <Pagination page={activePage} onChange={setPage} total={totalPages} />
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
