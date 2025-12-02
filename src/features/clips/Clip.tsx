import { ActionIcon, AspectRatio, Image, Box, Group, Skeleton, Stack, Text, useMantineTheme } from '@mantine/core';
import { MouseEventHandler, useEffect, useRef } from 'react';
import { IconTrash, IconStarFilled } from '@tabler/icons-react';
import { useAppSelector } from '../../app/hooks';
import { selectClipById, selectTopNSubmitters, selectHighlightedClipId } from './clipQueueSlice';
import { getProviderKeysForPlatform, type PlatformType } from '../../common/utils';
import Platform from '../../common/components/BrandPlatforms';
import StatBadge from './components/StatBadge';
import { selectFavoriteSubmitters } from '../settings/settingsSlice';

interface ClipProps {
  clipId: string;
  platform: PlatformType;

  onClick?: MouseEventHandler<HTMLDivElement>;
  onCrossClick?: MouseEventHandler<HTMLButtonElement>;

  className?: string;
  card?: boolean;
  queueIndex?: number;
}

const Clip = ({ clipId, onClick, onCrossClick, className, card, platform, queueIndex }: ClipProps) => {
  const clip = useAppSelector(selectClipById(clipId));
  const { title, thumbnailUrl, author, submitters, duration, views } = clip || {};

  const highlightedClipId = useAppSelector(selectHighlightedClipId);
  const theme = useMantineTheme();
  const clipRef = useRef<HTMLDivElement>(null);
  const chatUser = useAppSelector((s) => (submitters?.[0] ? s.chatUsers[submitters[0].toLowerCase()] : undefined));
  const blurredProviders = useAppSelector((s) => s.settings.blurredProviders || []);
  const topN = useAppSelector(selectTopNSubmitters(3));
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

  const boxSx = (theme: any) => ({
    position: 'relative' as const,
    border: '3px solid transparent',
    borderRadius: 8,
    height: '100%',
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    zIndex: 2,
    transition: 'border 0.3s, box-shadow 0.3s, transform 0.25s, background 0.12s ease-in-out',
    '& .clip--action-icon': { display: 'none' },
    '& .clip--duration-badge': { display: 'none' },
    '& .clip--queue-index': { display: 'block' },
    '&:hover .clip--action-icon': { display: 'block' },
    '&:hover .clip--duration-badge': { display: 'flex' },
    '&:hover .clip--queue-index': { display: 'none' },
    '&:hover .clip--title': { color: onClick ? theme.colors.indigo[5] : undefined },
    '&:hover': { background: theme.colorScheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
    ...(isHighlighted && {
      '&::after': {
        content: '""',
        position: 'absolute' as const,
        inset: 6,
        borderRadius: 8,
        background: 'linear-gradient(270deg, #00f2fe, #4facfe, #00f2fe)',
        backgroundSize: '400% 400%',
        filter: 'blur(12px)',
        opacity: 0.30,
        pointerEvents: 'none' as const,
        zIndex: 0,
        transition: 'opacity 0.20s',
        animation: 'gradient-border 2s ease infinite',
      },
      '&::before': {
        content: '""',
        position: 'absolute' as const,
        inset: 0,
        borderRadius: 8,
        padding: '2px',
        background: 'linear-gradient(270deg, #00f2fe, #4facfe, #00f2fe)',
        backgroundSize: '400% 400%',
        animation: 'gradient-border 2s ease infinite',
        WebkitMask:
          'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        filter: 'blur(6px)',
        opacity: 0.95,
        pointerEvents: 'none' as const,
        zIndex: 3,
      },
      '@keyframes gradient-border': {
        '0%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
        '100%': { backgroundPosition: '0% 50%' },
      },
    }),
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

  return (
    <Box
      ref={clipRef}
      sx={(theme) => ({
        ...boxSx(theme),
      })}
    >
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
        className={className}
        sx={groupSx}
        onClick={onClick}
      >
        <AspectRatio ratio={16 / 9} sx={{ ...aspectRatioSx }}>
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <Skeleton visible={!thumbnailUrl}>
              <Image
                src={thumbnailUrl || undefined}
                sx={{
                  backgroundColor: '#373A40',
                  borderRadius: 4,
                  filter: shouldBlur ? 'blur(6px)' : undefined,
                }}
              />
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
              color="dimmed"
              lineClamp={1}
              title={author}
            >
              <Platform platform={platform} />
              {displayAuthor}&nbsp;
            </Text>
          </Skeleton>
          {submitters?.[0] && (
            <Text size="xs" color="dimmed" lineClamp={1} title={submitters.join('\n')}>
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
    </Box>
  );
};

Clip.displayName = 'Clip';

export default Clip;
