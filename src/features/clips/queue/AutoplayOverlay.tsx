import { Button, Center, RingProgress, Stack, Text, Box, useMantineTheme } from '@mantine/core';
import { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { currentClipWatched, selectAutoplayDelay, selectNextId, selectQueueClipsForAutoplay } from '../clipQueueSlice';
import Clip from '../Clip';

interface AutoplayOverlayProps {
  visible: boolean;
  onCancel?: () => void;
}

function AutoplayOverlay({ visible, onCancel }: AutoplayOverlayProps) {
  const dispatch = useAppDispatch();
  const delay = useAppSelector(selectAutoplayDelay);
  const nextClipId = useAppSelector(selectNextId);
  const overlayOn = visible && !!nextClipId;

  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  const theme = useMantineTheme();

  const fillColor = theme.colors.blue?.[4];
  const overlayTextColor = theme.colorScheme === 'light' ? theme.white : undefined;

  const clips = useAppSelector(selectQueueClipsForAutoplay);
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
        backgroundColor: 'rgba(8, 12, 24, 0.72)',
        backdropFilter: 'blur(5px)',
        zIndex: 2,
        padding: 24,
        pointerEvents: 'auto',
      })}
      aria-hidden={!overlayOn}
    >
      <Stack
        spacing="sm"
        align="center"
        sx={{
          width: 'min(100%, 480px)',
          padding: '24px 20px',
          borderRadius: 20,
          background: 'rgba(20, 24, 35, 0.82)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 18px 60px rgba(0, 0, 0, 0.4)',
        }}
      >
        <Center>
          <RingProgress
            size={112}
            thickness={8}
            sections={[{ value: progress, color: fillColor }]}
            label={
              onCancel && (
                <Center>
                  <Button
                    compact
                    size="sm"
                    variant="filled"
                    radius="xl"
                    onClick={onCancel}
                    sx={(theme) => ({
                      height: 32,
                      paddingLeft: 14,
                      paddingRight: 14,
                      color: theme.white,
                      backgroundColor: 'transparent',
                      border: 0,
                      boxShadow: 'none',
                      transition: 'background-color 140ms ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      },
                      '&:focus-visible': {
                        outline: `2px solid ${theme.colors.blue[3]}`,
                        outlineOffset: 2,
                      },
                    })}
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
        <Box
          onClick={() => dispatch(currentClipWatched())}
          sx={{
            maxWidth: 420,
            width: '100%',
            color: overlayTextColor,
            cursor: 'pointer',
            borderRadius: 8,
            '&:focus-visible': {
              outline: '2px solid rgba(255, 255, 255, 0.8)',
              outlineOffset: 3,
            },
          }}
        >
          <Clip platform={nextClip?.Platform || undefined} clipId={nextClipId} />
        </Box>
      </Stack>
    </Box>
  );
}

export default AutoplayOverlay;
