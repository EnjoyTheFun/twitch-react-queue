import { Button, Center, RingProgress, Stack, Text, Box, useMantineTheme } from '@mantine/core';
import { useEffect, useState, useRef } from 'react';
import { useAppSelector } from '../../../app/hooks';
import { selectAutoplayDelay, selectNextId, selectQueueIds, selectClipById } from '../clipQueueSlice';
import Clip from '../Clip';

interface AutoplayOverlayProps {
  visible: boolean;
  onCancel?: () => void;
}

function AutoplayOverlay({ visible, onCancel }: AutoplayOverlayProps) {
  const delay = useAppSelector(selectAutoplayDelay);
  const nextClipId = useAppSelector(selectNextId);
  const overlayOn = visible && !!nextClipId;

  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  const theme = useMantineTheme();

  const fillColor = theme.colors.blue?.[4];
  const overlayTextColor = theme.colorScheme === 'light' ? theme.white : undefined;

  const clipQueueIds = useAppSelector(selectQueueIds);
  const clips = useAppSelector((state) =>
    clipQueueIds.map((id) => selectClipById(id)(state)).filter((clip) => clip !== undefined)
  );
  const nextClip = clips.find((clip) => clip!.id === nextClipId);

  useEffect(() => {
    if (!overlayOn) {
      setProgress(0);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    if (!delay || delay <= 0) {
      setProgress(100);
      return;
    }

    const startTs = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTs;
      const pct = Math.min(100, (elapsed / delay) * 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [overlayOn, delay]);

  if (!overlayOn) return null;

  return (
    <Box
      sx={() => ({
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 2,
        padding: 24,
        pointerEvents: 'auto',
      })}
      aria-hidden={!overlayOn}
    >
      <Stack spacing="sm" align="center">
        <Center>
          <RingProgress
            size={120}
            thickness={14}
            sections={[{ value: progress, color: fillColor }]}
            label={
              onCancel && (
                <Center>
                  <Button
                    compact
                    size="md"
                    variant="subtle"
                    color="dark"
                    onClick={onCancel}
                    sx={{ color: overlayTextColor }}
                  >
                    Cancel
                  </Button>
                </Center>
              )
            }
          />
        </Center>
        <Text size="lg" weight={700} align="center" sx={{ color: overlayTextColor }}>
          Next up
        </Text>
        <Box sx={{ maxWidth: 420, width: '100%', color: overlayTextColor }}>
          <Clip platform={nextClip?.Platform || undefined} clipId={nextClipId} />
        </Box>
      </Stack>
    </Box>
  );
}

export default AutoplayOverlay;
