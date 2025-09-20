import { Anchor, Center, Container, Grid, Pagination, Text } from '@mantine/core';
import { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { memoryClipRemoved, selectHistoryIds, makeSelectHistoryPageClips } from '../clipQueueSlice';
import Clip from '../Clip';
import clipProvider from '../providers/providers';

function MemoryPage() {
  const dispatch = useAppDispatch();
  const [activePage, setPage] = useState(1);
  const selectHistoryPageClips = useMemo(() => makeSelectHistoryPageClips(), []);

  const clipObjects = useAppSelector((state) => selectHistoryPageClips(state, activePage, 24));

  const totalClips = useAppSelector(selectHistoryIds).length;
  const totalPages = Math.ceil(totalClips / 24);
  return (
    <Container size="xl" py="md">
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
                >
                  <Clip
                    platform={clip!.Platform || undefined}
                    card
                    clipId={clip!.id}
                    onClick={() => { }}
                    onCrossClick={(e) => {
                      e.preventDefault();
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
