import { Group, Button, Switch, Box } from '@mantine/core';
import { IconPlayerSkipForward, IconPlayerTrackNext, IconPlayerTrackPrev, IconExternalLink } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  autoplayChanged,
  currentClipSkipped,
  selectAutoplayEnabled,
  selectClipLimit,
  selectNextId,
  autoplayTimeoutHandleChanged,
  currentClipWatched,
  selectCurrentId,
  previousClipWatched,
  selectHasPrevious,
  selectCurrentClip
} from '../clipQueueSlice';
import clipProvider from '../providers/providers';
import FavoriteButton from './FavoriteButton';
import SubmitterNote from './SubmitterNote';

function PlayerButtons({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const currentClipId = useAppSelector(selectCurrentId);
  const nextClipId = useAppSelector(selectNextId);
  const clipLimit = useAppSelector(selectClipLimit);
  const autoplayEnabled = useAppSelector(selectAutoplayEnabled);
  const hasPrevious = useAppSelector(selectHasPrevious);
  const currentClip = useAppSelector(selectCurrentClip);
  return (
    <Group align="center" className={className}>
      <Group align="center" spacing={4} className="player-action-buttons">
        <Box className="autoplay-toggle-inline" sx={{ display: 'flex', alignItems: 'center' }}>
          <Switch size="xs" radius={6} label="Autoplay" checked={autoplayEnabled} onChange={(event) => {
            dispatch(autoplayTimeoutHandleChanged({ set: false }));
            dispatch(autoplayChanged(event.currentTarget.checked));
          }} />
        </Box>
        <SubmitterNote />
        <FavoriteButton />
        {currentClip && (
          <Button
            className="player-info-icon-button"
            size="xs"
            variant="default"
            px={8}
            onClick={() => {
              const href = clipProvider.getUrl(currentClip.id) || currentClip.url;
              if (href) window.open(href, '_blank', 'noopener,noreferrer');
            }}
            title="Open"
          >
            <IconExternalLink size={16} />
          </Button>
        )}
        {clipLimit && (
          <Button
            size="xs"
            variant="default"
            rightIcon={<IconPlayerSkipForward />}
            onClick={() => {
              dispatch(autoplayTimeoutHandleChanged({ set: false }));
              dispatch(currentClipSkipped());
            }}
            disabled={!currentClipId}>
            Skip
          </Button>
        )}
      </Group>
      <Group align="center" spacing={4} className="player-navigation-buttons">
        <Button
          className="player-navigation-button"
          size="xs"
          leftIcon={<IconPlayerTrackPrev />}
          onClick={() => {
            dispatch(autoplayTimeoutHandleChanged({ set: false }));
            dispatch(previousClipWatched());
          }}
          disabled={!hasPrevious}
        >
          Prev
        </Button>
        <Button className="player-navigation-button" size="xs"
          rightIcon={<IconPlayerTrackNext />}
          onClick={() => {
            dispatch(autoplayTimeoutHandleChanged({ set: false }));
            dispatch(currentClipWatched());
          }}
          disabled={!currentClipId && !nextClipId}>
          Next
        </Button>
      </Group>
    </Group>
  );
}

export default PlayerButtons;
