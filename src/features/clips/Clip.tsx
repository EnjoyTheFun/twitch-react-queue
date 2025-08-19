import { ActionIcon, AspectRatio, Image, Box, Group, Skeleton, Stack, Text, useMantineTheme } from '@mantine/core';
import { MouseEventHandler } from 'react';
import { Trash } from 'tabler-icons-react';
import { useAppSelector } from '../../app/hooks';
import { selectClipById } from './clipQueueSlice';
import type { PlatformType } from '../../common/utils';
import Platform from '../../common/components/BrandPlatforms';
import { selectHighlightedClipId } from './clipQueueSlice';

interface ClipProps {
  clipId: string;
  platform: PlatformType;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onCrossClick?: MouseEventHandler<HTMLButtonElement>;

  className?: string;
  card?: boolean;
  queueIndex?: number;
}

function Clip({ clipId, onClick, onCrossClick, className, card, platform, queueIndex }: ClipProps) {
  const { title, thumbnailUrl = '', author, submitters } = useAppSelector(selectClipById(clipId));
  const highlightedClipId = useAppSelector(selectHighlightedClipId);
  const theme = useMantineTheme();
  const chatUser = useAppSelector((s) => (submitters?.[0] ? s.chatUsers[submitters[0].toLowerCase()] : undefined));
  const blurredProviders = useAppSelector((s) => s.settings.blurredProviders || []);

  const platformToProviderKey = (platform: string | undefined) => {
    switch (platform) {
      case 'Twitch':
        return ['twitch-clip', 'twitch-vod'];
      case 'YouTube':
        return ['youtube'];
      case 'TikTok':
        return ['tiktok'];
      case 'Twitter':
        return ['twitter'];
      case 'Instagram':
        return ['instagram'];
      case 'Kick':
        return ['kick-clip'];
      case 'Streamable':
        return ['streamable'];
      case 'Afreeca':
        return ['afreeca-clip'];
      default:
        return [];
    }
  };

  const providerKeys = platformToProviderKey(platform);
  const shouldBlur = providerKeys.some((k) => blurredProviders.includes(k));

  const isHighlighted = highlightedClipId === clipId;

  return (
    <Box
      sx={(theme) => ({
        position: 'relative',
        border: '3px solid transparent',
        borderRadius: 8,
        transition: 'border 0.3s, box-shadow 0.3s',
        height: '100%',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        '& .clip--action-icon': { display: 'none' },
        '&:hover .clip--action-icon': { display: 'block' },
        '&:hover .clip--title': { color: onClick ? theme.colors.indigo[5] : undefined },
        ...(isHighlighted && {
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 8,
            padding: '2px',
            background: 'linear-gradient(270deg, #00f2fe, #4facfe, #00f2fe)',
            backgroundSize: '400% 400%',
            animation: 'gradient-border 2s ease infinite',
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            pointerEvents: 'none',
            zIndex: 1,
          },
          '@keyframes gradient-border': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
          },
        }),
      })}
    >
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
        sx={{
          cursor: onClick ? 'pointer' : undefined,
          '&:active': onClick
            ? {
              paddingTop: 1,
              marginBottom: -1,
            }
            : {},
        }}
        onClick={onClick}
      >
        <AspectRatio
          ratio={16 / 9}
          sx={{
            width: card ? '100%' : '9rem',
            minWidth: card ? undefined : '9rem',
            maxWidth: card ? undefined : '33%',
          }}
        >
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
              {author}&nbsp;
            </Text>
          </Skeleton>
          {submitters?.[0] && (
            <Text size="xs" color="dimmed" lineClamp={1} title={submitters.join('\n')}>
              Submitted by{' '}
              <strong
                style={{
                  color: chatUser?.broadcaster ? theme.colors.red[6] : chatUser?.vip ? theme.colors.pink[6] : chatUser?.mod ? theme.colors.green[6] : undefined,
                }}
              >
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
          <Trash size={12} />
        </ActionIcon>
      )}
    </Box>
  );
}

export default Clip;
