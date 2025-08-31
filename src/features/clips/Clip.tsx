import { ActionIcon, AspectRatio, Image, Box, Group, Skeleton, Stack, Text, useMantineTheme } from '@mantine/core';
import { MouseEventHandler, useEffect, useRef } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { useAppSelector } from '../../app/hooks';
import { selectClipById, selectTopNSubmitters, selectHighlightedClipId } from './clipQueueSlice';
import type { PlatformType } from '../../common/utils';
import Platform from '../../common/components/BrandPlatforms';

interface ClipProps {
  clipId: string;
  platform: PlatformType;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onCrossClick?: MouseEventHandler<HTMLButtonElement>;

  className?: string;
  card?: boolean;
  queueIndex?: number;
}

const PLATFORM_PROVIDER_MAP: Record<string, string[]> = {
  Twitch: ['twitch-clip', 'twitch-vod'],
  YouTube: ['youtube'],
  TikTok: ['tiktok'],
  Twitter: ['twitter'],
  Instagram: ['instagram'],
  Kick: ['kick-clip'],
  Streamable: ['streamable'],
};

const platformToProviderKey = (platform?: PlatformType): string[] => {
  if (!platform) return [];
  return PLATFORM_PROVIDER_MAP[platform] ?? [];
};

const Clip = ({ clipId, onClick, onCrossClick, className, card, platform, queueIndex }: ClipProps) => {
  const clip = useAppSelector(selectClipById(clipId));
  const { title, thumbnailUrl = '', author, submitters } = clip || {};

  const highlightedClipId = useAppSelector(selectHighlightedClipId);
  const theme = useMantineTheme();
  const clipRef = useRef<HTMLDivElement>(null);
  const chatUser = useAppSelector((s) => (submitters?.[0] ? s.chatUsers[submitters[0].toLowerCase()] : undefined));
  const blurredProviders = useAppSelector((s) => s.settings.blurredProviders || []);
  const topN = useAppSelector(selectTopNSubmitters(3));
  const colored = useAppSelector((s) => s.clipQueue.coloredSubmitterNames !== false);

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
  const topClass = topIndex >= 0 ? `chip-anim-${topIndex}` : undefined;
  const submitterClass = colored && topClass ? topClass : undefined;

  const submitterStyle = (() => {
    if (!colored || topClass || !chatUser) return undefined;

    const roleColor = chatUser.broadcaster
      ? theme.colors.red[6]
      : chatUser.vip
      ? theme.colors.pink[6]
      : chatUser.mod
      ? theme.colors.green[6]
      : undefined;

    return roleColor ? { color: roleColor } : undefined;
  })();

  const providerKeys = platformToProviderKey(platform);
  const shouldBlur = providerKeys.some((k) => blurredProviders.includes(k));

  const boxSx = (theme: any) => ({
    position: 'relative' as const,
    border: '3px solid transparent',
    borderRadius: 8,
    transition: 'border 0.3s, box-shadow 0.3s, transform 0.25s',
    height: '100%',
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    zIndex: 2,
    '& .clip--action-icon': { display: 'none' },
    '&:hover .clip--action-icon': { display: 'block' },
    '&:hover .clip--title': { color: onClick ? theme.colors.indigo[5] : undefined },
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
    <Box ref={clipRef} sx={boxSx}>
      {queueIndex && (
        <Box
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
        <AspectRatio ratio={16 / 9} sx={aspectRatioSx}>
          <Skeleton visible={!thumbnailUrl}>
            <Image
              src={thumbnailUrl}
              sx={{
                backgroundColor: '#373A40',
                borderRadius: 4,
                filter: shouldBlur ? 'blur(6px)' : undefined,
              }}
            />
          </Skeleton>
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
