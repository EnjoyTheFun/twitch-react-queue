import { Group, Text, Stack, ActionIcon } from '@mantine/core';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  selectClipLimit,
  selectQueueIds,
  selectTotalQueueLength,
  selectSkipVotingEnabled,
  skipVotingToggled,
} from '../clipQueueSlice';
import {
  selectShowTopSubmitters, toggleShowTopSubmitters,
  selectSubOnlyMode, settingsChanged
} from '../../settings/settingsSlice';
import QueueQuickMenu from './QueueQuickMenu';
import TopSubmittersMarquee from './TopSubmittersMarquee';
import { useQueueSearchModal } from './QueueSearch';
import { pollToggled, selectPollActive } from '../../twitchChat/pollSlice';
import {
  IconCrown,
  IconCrownOff,
  IconThumbDown,
  IconThumbDownOff,
  IconUserCheck,
  IconUsers,
  IconListDetails,
  IconSearch,
  IconChartBar
} from '@tabler/icons-react';

interface QueueControlPanelProps {
  className?: string;
}

const QueueControlPanel = ({ className }: QueueControlPanelProps) => {
  const dispatch = useAppDispatch();
  const { openQueueSearchModal } = useQueueSearchModal();
  const showMarquee = useAppSelector(selectShowTopSubmitters);
  const pollActive = useAppSelector(selectPollActive);

  const skipVotingEnabled = useAppSelector(selectSkipVotingEnabled);
  const subOnlyMode = useAppSelector(selectSubOnlyMode);
  const clipLimit = useAppSelector(selectClipLimit);
  const totalClips = useAppSelector(selectTotalQueueLength);
  const clipsLeft = useAppSelector(selectQueueIds).length;

  const handleSkipVotingToggle = () => {
    dispatch(skipVotingToggled());
  };

  const handleTopSubmittersToggle = () => {
    dispatch(toggleShowTopSubmitters());
  };

  const handleSubOnlyModeToggle = () => {
    dispatch(settingsChanged({ subOnlyMode: !subOnlyMode }));
  };

  const handlePollToggle = () => {
    dispatch(pollToggled());
  };

  const queueCount = `${clipsLeft}/${totalClips}${clipLimit ? `/${clipLimit}` : ''}`;

  return (
    <Stack spacing={0} className={className} sx={{ marginTop: '-0.5rem' }}>
      <Group position="apart" align="center" sx={{ width: '100%' }} mt={0}>
        <Group spacing={6} align="center" sx={{ flex: 1, margin: 0, padding: 0 }}>
          <Text size="md" weight={700} sx={{ margin: 0, padding: 0 }}>
            {queueCount}
          </Text>
          <IconListDetails size={18} style={{ marginTop: 2 }} />
        </Group>
        <Group spacing={6} align="center" sx={{ alignItems: 'center', margin: 4 }}>
          <ActionIcon
            size="sm"
            variant="light"
            onClick={openQueueSearchModal}
            title="Search queue"
            aria-label="Search queue"
          >
            <IconSearch size={18} />
          </ActionIcon>

          <ActionIcon
            size="sm"
            variant={pollActive ? 'filled' : 'light'}
            color={pollActive ? 'green' : undefined}
            onClick={handlePollToggle}
            title={pollActive ? 'Disable poll' : 'Enable poll'}
            aria-label="Toggle poll"
          >
            <IconChartBar size={18} />
          </ActionIcon>

          <ActionIcon
            size="sm"
            variant="light"
            onClick={handleSkipVotingToggle}
            title={skipVotingEnabled ? 'Disable skip voting' : 'Enable skip voting'}
            aria-label="Toggle skip voting"
          >
            {skipVotingEnabled ? <IconThumbDown size={18} /> : <IconThumbDownOff size={18} />}
          </ActionIcon>

          <ActionIcon
            size="sm"
            variant="light"
            onClick={handleSubOnlyModeToggle}
            title={subOnlyMode ? 'Disable subscriber-only mode' : 'Enable subscriber-only mode'}
            aria-label="Toggle subscriber-only mode"
          >
            {subOnlyMode ? <IconUserCheck size={18} /> : <IconUsers size={18} />}
          </ActionIcon>

          <ActionIcon
            size="sm"
            variant="light"
            onClick={handleTopSubmittersToggle}
            title={showMarquee ? 'Hide top submitters' : 'Show top submitters'}
          >
            {showMarquee ? <IconCrown size={18} /> : <IconCrownOff size={18} />}
          </ActionIcon>
          <QueueQuickMenu />
        </Group>
      </Group>

      {showMarquee && <TopSubmittersMarquee count={3} />}
    </Stack>
  );
};

export default QueueControlPanel;
