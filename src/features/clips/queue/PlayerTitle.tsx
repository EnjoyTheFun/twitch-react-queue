import { Box, Text } from '@mantine/core';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useAppSelector } from '../../../app/hooks';
import { selectCurrentClip } from '../clipQueueSlice';
import Platform from '../../../common/components/BrandPlatforms';

interface PlayerTitleProps {
  className?: string;
}

const _nbsp = <>&nbsp;</>;

function PlayerTitle({ className }: PlayerTitleProps) {
  const currentClip = useAppSelector(selectCurrentClip);

  return (
    <Box className={className} sx={{ strong: { fontWeight: 600 }, maxWidth: '70%', minWidth: 0, overflow: 'hidden' }}>
      <Text size="xl" weight={700} lineClamp={1}>
        {currentClip?.title ?? _nbsp}
      </Text>
      {currentClip?.url && currentClip?.Platform && (currentClip.Platform === 'Twitter' || currentClip.Platform === 'Instagram') && (
        <Text size="xs" weight={700} lineClamp={1}>
          <a
            href={currentClip?.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#228be6', textDecoration: 'underline' }}
          >
            {currentClip.url || _nbsp}
          </a>
        </Text>
      )}
      <Text sx={{ display: 'flex', alignItems: 'center', gap: '.25rem' }} color="dimmed" size="sm" lineClamp={1}>
        <Platform platform={currentClip?.Platform} />
        <strong>{currentClip?.author ?? _nbsp}</strong>
        {currentClip?.category && (
          <>
            {' ('}
            <strong>{currentClip?.category}</strong>
            {')'}
          </>
        )}
        {currentClip?.submitters[0] && (
          <>
            , submitted by <strong>{currentClip?.submitters[0]}</strong>
            {currentClip?.submitters.length > 1 && <> and {currentClip.submitters.length - 1} other(s)</>}
          </>
        )}
        {currentClip?.createdAt && <>, created {formatDistanceToNow(parseISO(currentClip?.createdAt))} ago</>}
      </Text>
    </Box>
  );
}

export default PlayerTitle;
