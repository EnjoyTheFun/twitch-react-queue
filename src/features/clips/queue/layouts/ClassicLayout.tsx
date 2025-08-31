import { useRef, useEffect, useState } from 'react';
import { Container, Grid, Group, Stack, ScrollArea, Box } from '@mantine/core';
import PlayerButtons from '../PlayerButtons';
import PlayerTitle from '../PlayerTitle';
import Queue from '../Queue';
import QueueControlPanel from '../QueueControlPanel';
import Player from '../Player';

function ClassicLayout() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const rectRef = useRef({ left: 0, width: 0 });
  const [playerPercent, setPlayerPercent] = useState(79);

  const MIN_PLAYER = 50;
  const MAX_PLAYER = 85;

  useEffect(() => {
    const pendingRef = { pct: playerPercent } as { pct: number };
    const rafId = { id: 0 } as { id: number };
    const flush = () => {
      rafId.id = 0;
      setPlayerPercent((_) => pendingRef.pct);
    };

    const onPointerMove = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      if (!rectRef.current.width) return;
      const clientX = ev.clientX;
      const x = clientX - rectRef.current.left;
      const pct = Math.max(MIN_PLAYER, Math.min(MAX_PLAYER, Math.round((x / rectRef.current.width) * 100)));
      pendingRef.pct = pct;
      if (!rafId.id) rafId.id = requestAnimationFrame(flush);
    };

    const onPointerUp = () => {
      draggingRef.current = false;
      if (rafId.id) {
        cancelAnimationFrame(rafId.id);
        rafId.id = 0;
      }
    };

    window.addEventListener('pointermove', onPointerMove as any);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove as any);
      window.removeEventListener('pointerup', onPointerUp);
      if (rafId.id) cancelAnimationFrame(rafId.id);
    };
  }, [MIN_PLAYER, MAX_PLAYER, playerPercent]);

  const onHandlePointerDown = (e: React.PointerEvent) => {
    const target = e.currentTarget as Element;
    try {
      // @ts-ignore setPointerCapture exists on PointerEventTarget
      target.setPointerCapture && (target as any).setPointerCapture(e.pointerId);
    } catch { }
    draggingRef.current = true;
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      rectRef.current.left = r.left;
      rectRef.current.width = r.width;
    }
    e.preventDefault();
  };

  return (
    <Container fluid py="md" sx={{ height: '100%'}}>
      <Grid sx={{ height: '100%' }} columns={24}>
        <Grid.Col span={24} sx={{ height: '100%' }}>
          <Box ref={containerRef} sx={{ display: 'flex', height: '100%', gap: 3 }}>
            <Box sx={{ flex: `0 0 ${playerPercent}%`, minWidth: 0 }}>
              <Stack justify="flex-start" spacing="xs" sx={{ height: '100%' }}>
                <Player />
                <Group position="apart" sx={{ alignItems: 'flex-start', width: '100%' }}>
                  <PlayerTitle />
                  <PlayerButtons />
                </Group>
              </Stack>
            </Box>

            <Box onPointerDown={onHandlePointerDown} sx={{ width: 8, touchAction: 'none', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ width: 2, height: '40%', background: 'rgba(0,0,0,0.25)', borderRadius: 2 }} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack justify="flex-start" sx={{ height: '100%', maxHeight: '100%', gap: 3 }}>
                <QueueControlPanel />
                <ScrollArea sx={{ '.mantine-ScrollArea-viewport > div': { display: 'block !important' } }}>
                  <Group direction="column" sx={{ height: '100%', gap: 3 }}>
                    <Queue />
                  </Group>
                </ScrollArea>
              </Stack>
            </Box>
          </Box>
        </Grid.Col>
      </Grid>
    </Container>
  );
}

export default ClassicLayout;
