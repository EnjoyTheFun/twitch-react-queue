import { ActionIcon, AspectRatio, Badge, Image, Box, Group, Skeleton, Stack, Text, useMantineTheme } from '@mantine/core';
import { MouseEventHandler, useEffect, useRef, useState } from 'react';
import { IconTrash, IconStarFilled, IconExternalLink, IconPhotoOff } from '@tabler/icons-react';
import { useAppSelector } from '../../app/hooks';
import { selectClipById, selectTop3Submitters, selectHighlightedClipId } from './clipQueueSlice';
import { getProviderKeysForPlatform, type PlatformType } from '../../common/utils';
import Platform from '../../common/components/BrandPlatforms';
import StatBadge from './components/StatBadge';
import { selectFavoriteSubmitters } from '../settings/settingsSlice';

interface ClipProps {
  clipId: string;
  platform: PlatformType;

  onClick?: MouseEventHandler<HTMLDivElement>;
  onCrossClick?: MouseEventHandler<HTMLButtonElement>;
  onOpenClick?: MouseEventHandler<HTMLButtonElement>;

  className?: string;
  card?: boolean;
  isCurrent?: boolean;
  showHistoryBadges?: boolean;
  queueIndex?: number;
  draggable?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
}

const Clip = ({ clipId, onClick, onCrossClick, onOpenClick, className, card, isCurrent, showHistoryBadges, platform, queueIndex, draggable, onDragStart, onDragOver, onDrop, onDragEnd }: ClipProps) => {
  const clip = useAppSelector(selectClipById(clipId));
  const { title, thumbnailUrl, author, submitters, duration, views } = clip || {};
  const [failedThumbnailUrl, setFailedThumbnailUrl] = useState<string>();
  const thumbnailFailed = !!thumbnailUrl && failedThumbnailUrl === thumbnailUrl;

  const highlightedClipId = useAppSelector(selectHighlightedClipId);
  const theme = useMantineTheme();
  const metadataColor = theme.colorScheme === 'dark' ? theme.colors.dark[1] : theme.colors.gray[7];
  const clipRef = useRef<HTMLDivElement>(null);
  const chatUser = useAppSelector((s) => (submitters?.[0] ? s.chatUsers[submitters[0].toLowerCase()] : undefined));
  const blurredProviders = useAppSelector((s) => s.settings.blurredProviders || []);
  const topN = useAppSelector(selectTop3Submitters);
  const colored = useAppSelector((s) => s.clipQueue.coloredSubmitterNames !== false);
  const favoriteSubmitters = useAppSelector(selectFavoriteSubmitters);

  const isHighlighted = highlightedClipId === clipId;

  useEffect(() => {
    if (isHighlighted && clipRef.current) {
      const timeoutId = setTimeout(() => {
        clipRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isHighlighted]);

  const displayAuthor = (() => {
    if (!author) return '';
    const max = 30;
    if (author.length <= max) return author;
    return `${author.slice(0, max - 1)}…`;
  })();

  const topIndex = submitters?.[0] ? topN.findIndex((t) => t.username === submitters[0].toLowerCase()) : -1;
  const isFavorite = submitters?.[0] ? favoriteSubmitters.includes(submitters[0].toLowerCase()) : false;
  const topClass = topIndex >= 0 ? `chip-anim-${topIndex}` : undefined;
  const submitterClass = colored && topClass ? topClass : undefined;

  const submitterStyle = (() => {
    if (!colored) return undefined;

    if (isFavorite) {
      return {
        background: 'linear-gradient(90deg, #FFD700, #FFA500, #FFD700)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      };
    }

    if (topClass || !chatUser) return undefined;

    const roleColor = chatUser.broadcaster
      ? theme.colors.red[6]
      : chatUser.vip
        ? theme.colors.pink[6]
        : chatUser.mod
          ? theme.colors.green[6]
          : undefined;

    return roleColor ? { color: roleColor } : undefined;
  })();

  const providers = getProviderKeysForPlatform(platform);
  const shouldBlur = providers.some((k) => blurredProviders.includes(k));

  const boxSx = (theme: ReturnType<typeof useMantineTheme>) => ({
    position: 'relative' as const,
    border: '3px solid transparent',
    borderRadius: 8,
    height: '100%',
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    zIndex: 2,
    transition: 'border 0.3s, box-shadow 0.3s, transform 0.25s, background 0.12s ease-in-out',
    ...(isHighlighted && {
      border: `3px solid ${theme.colors.cyan[4]}`,
      boxShadow: `0 0 0 2px ${theme.colors.cyan[4]}33, 0 0 18px ${theme.colors.cyan[4]}88`,
      background: theme.colorScheme === 'dark' ? 'rgba(34, 211, 238, 0.10)' : 'rgba(8, 145, 178, 0.08)',
    }),
    '& .clip--action-icon': { display: 'none' },
    '& .clip--duration-badge': { display: 'none' },
    '& .clip--queue-index': { display: 'block' },
    '&:hover .clip--action-icon': { display: 'block' },
    '&:hover .clip--duration-badge': { display: 'flex' },
    '&:hover .clip--queue-index': { display: 'none' },
    '&:hover .clip--title': { color: onClick ? theme.colors.indigo[5] : undefined },
    '&:hover': { background: theme.colorScheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
  });

  const aspectRatioSx = {
    width: card ? '100%' : '9rem',
    minWidth: card ? undefined : '9rem',
    maxWidth: card ? undefined : '33%',
  };

  const groupSx = {
    cursor: onClick ? 'pointer' : undefined,
    '&:active': onClick
      ? {
        paddingTop: 1,
        marginBottom: -1,
      }
      : {},
  };

  if (!clip) return null;

  const historyStatus = showHistoryBadges
    ? isCurrent
      ? { label: 'Currently playing', color: 'blue' as const, background: 'rgba(34, 139, 230, 0.72)' }
      : clip.status === 'removed'
        ? { label: 'Removed', color: 'red' as const, background: 'rgba(250, 82, 82, 0.72)' }
        : undefined
    : undefined;

  return (
    <Box
      ref={clipRef}
      data-queue-clip={draggable ? clipId : undefined}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={className}
      sx={(theme) => ({
        ...boxSx(theme),
        ...(draggable && { cursor: 'grab', '&:active': { cursor: 'grabbing' } }),
      })}
    >
      {historyStatus && (
        <Badge
          size="xs"
          color={historyStatus.color}
          sx={{
            position: 'absolute',
            top: 7,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 'calc(100% - 14px)',
            zIndex: 3,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            backgroundColor: historyStatus.background,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {historyStatus.label}
        </Badge>
      )}
      {queueIndex && (
        <Box
          className="clip--queue-index"
          sx={{
            position: 'absolute',
            top: 1,
            left: 1,
            background: 'rgba(8, 7, 83, 0.6)',
            color: 'white',
            borderRadius: 4,
            padding: '2px 6px',
            fontSize: 12,
            fontWeight: 'bold',
            zIndex: 2,
            pointerEvents: 'none',
            backdropFilter: 'blur(1px)',
          }}
        >
          {queueIndex}
        </Box>
      )}
      <Group
        align="flex-start"
        spacing="xs"
        direction={card ? 'column' : 'row'}
        noWrap
        sx={groupSx}
        onClick={onClick}
      >
        <AspectRatio ratio={16 / 9} sx={{ ...aspectRatioSx }}>
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <Skeleton visible={!thumbnailUrl} height={thumbnailFailed ? '100%' : undefined}>
              {thumbnailFailed ? (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#373A40',
                    borderRadius: 4,
                    color: theme.colors.gray[6],
                  }}
                >
                  <IconPhotoOff size={32} stroke={1.5} />
                </Box>
              ) : (
                <Image
                  src={thumbnailUrl || undefined}
                  imageProps={{ loading: 'lazy', decoding: 'async', onError: () => setFailedThumbnailUrl(thumbnailUrl) }}
                  sx={{
                    backgroundColor: '#373A40',
                    borderRadius: 4,
                    filter: shouldBlur ? 'blur(6px)' : undefined,
                  }}
                />
              )}
            </Skeleton>
            {(duration && duration > 0) || (views && views > 0) ? (
              <Box className="clip--duration-badge" sx={{ position: 'absolute', bottom: 0, left: 0 }}>
                <StatBadge duration={duration} views={views} />
              </Box>
            ) : null}
          </Box>
        </AspectRatio>
        <Stack spacing={0} align="flex-start" sx={{ width: '100%' }}>
          <Skeleton visible={!title}>
            <Text className="clip--title" weight="700" size="sm" lineClamp={2} title={title}>
              {title}&nbsp;
            </Text>
          </Skeleton>
          <Skeleton visible={!author} height="xs">
            <Text
              sx={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}
              size="xs"
              weight="700"
              color={metadataColor}
              lineClamp={1}
              title={author}
            >
              <Platform platform={platform} />
              {displayAuthor}&nbsp;
            </Text>
          </Skeleton>
          {submitters?.[0] && (
            <Text size="xs" color={metadataColor} lineClamp={1} title={submitters.join('\n')}>
              Submitted by{' '}
              <strong className={submitterClass} style={submitterStyle}>
                {isFavorite && <IconStarFilled size={11} style={{ display: 'inline', marginRight: 2 }} />}
                {submitters[0]}
              </strong>
              {submitters.length > 1 && ` +${submitters.length - 1}`}
            </Text>
          )}
        </Stack>
      </Group>
      {onCrossClick && (
        <ActionIcon
          className="clip--action-icon"
          color="red"
          variant="filled"
          sx={{ position: 'absolute', left: 0, top: 0, opacity: 0.8, zIndex: 100 }}
          onClick={onCrossClick}
        >
          <IconTrash size={12} />
        </ActionIcon>
      )}
      {onOpenClick && (
        <ActionIcon
          className="clip--action-icon"
          color="gray"
          variant="filled"
          sx={{ position: 'absolute', right: 0, top: 0, opacity: 0.8, zIndex: 100 }}
          onClick={onOpenClick}
        >
          <IconExternalLink size={12} />
        </ActionIcon>
      )}
    </Box>
  );
};

Clip.displayName = 'Clip';

export default Clip;
