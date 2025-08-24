import { Group, Button, Switch, Box } from '@mantine/core';
import { PlayerSkipForward, PlayerTrackNext, PlayerTrackPrev } from 'tabler-icons-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  autoplayChanged,
  currentClipSkipped,
  selectAutoplayEnabled,
  selectClipLimit,
  selectNextId,
} from '../clipQueueSlice';
import { autoplayTimeoutHandleChanged } from '../clipQueueSlice';
import { currentClipWatched, selectCurrentId, previousClipWatched, selectHasPrevious } from '../clipQueueSlice';

function PlayerButtons({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const currentClipId = useAppSelector(selectCurrentId);
  const nextClipId = useAppSelector(selectNextId);
  const clipLimit = useAppSelector(selectClipLimit);
  const autoplayEnabled = useAppSelector(selectAutoplayEnabled);
  const hasPrevious = useAppSelector(selectHasPrevious);
  return (
    <Group align="center" className={className} sx={{ flexShrink: 0, marginLeft: 'auto' }}>
      <Group align="center" spacing="xs">
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Switch size="sm" label="Autoplay" checked={autoplayEnabled} onChange={(event) => {
            dispatch(autoplayTimeoutHandleChanged({ set: false }));
            dispatch(autoplayChanged(event.currentTarget.checked));
          }} />
        </Box>
        {clipLimit && (
          <Button size="xs" variant="default" rightIcon={<PlayerSkipForward />} onClick={() => {
            dispatch(autoplayTimeoutHandleChanged({ set: false }));
            dispatch(currentClipSkipped());
          }} disabled={!currentClipId}>
            Skip
          </Button>
        )}
      </Group>
      <Button size="xs"
        leftIcon={<PlayerTrackPrev />} onClick={() => {
          dispatch(autoplayTimeoutHandleChanged({ set: false }));
          dispatch(previousClipWatched());
        }} disabled={!hasPrevious}
      >
        Previous
      </Button>
      <Button size="xs" rightIcon={<PlayerTrackNext />} onClick={() => {
        dispatch(autoplayTimeoutHandleChanged({ set: false }));
        dispatch(currentClipWatched());
      }} disabled={!currentClipId && !nextClipId}>
        Next
      </Button>
    </Group>
  );
}

export default PlayerButtons;
