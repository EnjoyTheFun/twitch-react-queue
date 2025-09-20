import { Box } from '@mantine/core';
import { IconClock, IconEye } from '@tabler/icons-react';

interface StatBadgeProps {
  duration?: number;
  views?: number;
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `00:${seconds.toString().padStart(2, '0')}`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatViews = (views: number): string => {
  if (views < 1000) return views.toString();

  const formatShort = (value: number, suffix: string) => {
    const rounded = +(value).toFixed(1);
    return `${(rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1))}${suffix}`;
  };

  if (views < 1000000) return formatShort(views / 1000, 'k');
  return formatShort(views / 1000000, 'm');
};

const StatBadge = ({ duration, views }: StatBadgeProps) => {
  if (!duration && !views) return null;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        flexDirection: 'column-reverse',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        background: 'rgba(8, 7, 83, 0.6)',
        color: 'white',
        padding: '2px 4px',
        borderRadius: 4,
        fontSize: 8,
        lineHeight: 1.5,
        fontWeight: 700,
        zIndex: 2,
        pointerEvents: 'none',
        minWidth: 'auto',
        width: 'auto',
        whiteSpace: 'nowrap',
        gap: '1px',
      }}
    >
      {duration && duration > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <IconClock size={8} />
          <span>{formatDuration(Math.round(duration))}</span>
        </Box>
      )}
      {views && views > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <IconEye size={8} />
          <span>{formatViews(views)}</span>
        </Box>
      )}
    </Box>
  );
};

export default StatBadge;
