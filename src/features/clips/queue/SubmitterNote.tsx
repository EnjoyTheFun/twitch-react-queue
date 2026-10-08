import { useEffect, useRef, useState } from 'react';
import { Box, Button, Text, useMantineTheme } from '@mantine/core';
import { IconMessage2 } from '@tabler/icons-react';
import { useAppSelector } from '../../../app/hooks';
import { selectCurrentClip } from '../clipQueueSlice';
import { selectShowSubmitterNotes } from '../../settings/settingsSlice';

const AUTO_PEEK_MS = 5000;
const BUBBLE_WIDTH = 240;

function SubmitterNote() {
  const theme = useMantineTheme();
  const currentClip = useAppSelector(selectCurrentClip);
  const showSubmitterNotes = useAppSelector(selectShowSubmitterNotes);
  const submitter = currentClip?.submitters?.[0];
  const note = submitter ? currentClip?.notes?.[submitter.toLowerCase()] : undefined;

  const [expanded, setExpanded] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timerRef.current);
    if (note && showSubmitterNotes) {
      setExpanded(true);
      timerRef.current = window.setTimeout(() => setExpanded(false), AUTO_PEEK_MS);
    } else {
      setExpanded(false);
    }
    return () => window.clearTimeout(timerRef.current);
  }, [currentClip?.id, note, showSubmitterNotes]);

  if (!showSubmitterNotes || !note) {
    return null;
  }

  const toggle = () => {
    window.clearTimeout(timerRef.current);
    setExpanded((prev) => !prev);
  };

  const isDark = theme.colorScheme === 'dark';
  const surface = isDark ? theme.colors.dark[6] : theme.white;
  const border = isDark ? theme.colors.dark[4] : theme.colors.gray[3];

  return (
    <Box sx={{ position: 'relative' }}>
      <Button
        size="xs"
        variant="default"
        px={8}
        onClick={toggle}
        title={expanded ? 'Hide note' : 'Show note'}
        aria-expanded={expanded}
        aria-label="Submission note"
      >
        <IconMessage2 size={16} />
      </Button>
      <Box
        sx={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: `translateX(-50%) translateY(${expanded ? '0' : '4px'})`,
          marginBottom: 8,
          width: BUBBLE_WIDTH,
          maxWidth: '80vw',
          opacity: expanded ? 1 : 0,
          visibility: expanded ? 'visible' : 'hidden',
          pointerEvents: expanded ? 'auto' : 'none',
          transition: 'opacity 180ms ease, transform 180ms ease',
          zIndex: 20,
        }}
      >
        <Box
          sx={{
            background: surface,
            border: `1px solid ${border}`,
            borderRadius: theme.radius.sm,
            boxShadow: theme.shadows.md,
            padding: '6px 10px',
            maxHeight: 140,
            overflowY: 'auto',
          }}
        >
          <Text size="sm" color="dimmed" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
            {submitter && (
              <Text component="span" size="sm" weight={600} sx={{ fontStyle: 'normal' }}>
                {submitter}:{' '}
              </Text>
            )}
            “{note}”
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

export default SubmitterNote;

