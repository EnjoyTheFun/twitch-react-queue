import React from 'react';
import { Box, ActionIcon, useMantineTheme } from '@mantine/core';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { selectTopNSubmitters, resetWatchedCounts } from '../clipQueueSlice';
import { IconRefresh } from '@tabler/icons-react';

interface TopSubmittersMarqueeProps {
  count?: number;
}

const TopSubmittersMarquee = ({ count = 3 }: TopSubmittersMarqueeProps) => {
  const dispatch = useAppDispatch();
  const theme = useMantineTheme();
  const top = useAppSelector(selectTopNSubmitters(count));
  const colored = useAppSelector((s) => s.clipQueue.coloredSubmitterNames !== false);

  const handleReset = () => {
    dispatch(resetWatchedCounts());
  };

  const interleaved = (() => {
    if (!top || top.length === 0) return null;
    const items: React.ReactNode[] = [];
    top.forEach((t, i) => {
      if (i > 0) {
        items.push(
          <span key={`sep-${i}`} className="chip-sep">
            •
          </span>
        );
      }
      items.push(
        <span key={t.username} className={`top-submitter-chip ${colored ? `chip-anim-${i % 3}` : ''}`}>
          <span className="name">{t.username}</span>
          <span className="count">{t.count}</span>
        </span>
      );
    });
    return items;
  })();

  if (!interleaved || interleaved.length === 0) return null;

  return (
    <Box sx={{ overflow: 'hidden', width: '100%', mt: 8, borderRadius: 8, padding: '6px 10px', border: `1px solid ${theme.colorScheme === 'dark' ? '#2b2b2b' : '#e9ecef'}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Box
          sx={{
            overflowX: 'hidden',
            overflowY: 'hidden',
            flex: 1,
            minWidth: 0,
            '&::-webkit-scrollbar': {
              height: 0,
            },
          }}
        >
          <span className="top-submitters-marquee" style={{ display: 'inline-block' }}>
            {interleaved}
          </span>
        </Box>

        <ActionIcon
          className="top-submitters-refresh"
          size="sm"
          variant="light"
          onClick={handleReset}
          title="Reset top clippers"
        >
          <IconRefresh size={14} />
        </ActionIcon>
      </Box>
    </Box>
  );
};

export default TopSubmittersMarquee;
