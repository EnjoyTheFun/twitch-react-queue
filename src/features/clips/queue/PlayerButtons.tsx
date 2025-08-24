import React from 'react';
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

interface PlayerButtonsProps {
  className?: string;
}

const PlayerButtons = ({ className }: PlayerButtonsProps) => {
  const dispatch = useAppDispatch();
  const currentClipId = useAppSelector(selectCurrentId);
  const nextClipId = useAppSelector(selectNextId);
  const clipLimit = useAppSelector(selectClipLimit);
  const autoplayEnabled = useAppSelector(selectAutoplayEnabled);
  const hasPrevious = useAppSelector(selectHasPrevious);

  const handleAutoplayToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(autoplayTimeoutHandleChanged({ set: false }));
    dispatch(autoplayChanged(event.currentTarget.checked));
  };

  const handleSkip = () => {
    dispatch(autoplayTimeoutHandleChanged({ set: false }));
    dispatch(currentClipSkipped());
  };

  const handlePrevious = () => {
    dispatch(autoplayTimeoutHandleChanged({ set: false }));
    dispatch(previousClipWatched());
  };

  const handleNext = () => {
    dispatch(autoplayTimeoutHandleChanged({ set: false }));
    dispatch(currentClipWatched());
  };

  return (
    <Group align="center" className={className} sx={{ flexShrink: 0, marginLeft: 'auto' }}>
      <Group align="center" spacing="xs">
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Switch
            size="sm"
            label="Autoplay"
            checked={autoplayEnabled}
            onChange={handleAutoplayToggle}
          />
        </Box>
        {clipLimit && (
          <Button
            size="xs"
            variant="default"
            rightIcon={<PlayerSkipForward />}
            onClick={handleSkip}
            disabled={!currentClipId}
          >
            Skip
          </Button>
        )}
      </Group>
      <Button
        size="xs"
        leftIcon={<PlayerTrackPrev />}
        onClick={handlePrevious}
        disabled={!hasPrevious}
      >
        Prev
      </Button>
      <Button
        size="xs"
        rightIcon={<PlayerTrackNext />}
        onClick={handleNext}
        disabled={!currentClipId && !nextClipId}
      >
        Next
      </Button>
    </Group>
  );
};

export default PlayerButtons;
