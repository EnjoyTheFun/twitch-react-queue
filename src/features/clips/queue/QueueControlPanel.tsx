import { Group, Text, Stack, ActionIcon, useMantineTheme } from '@mantine/core';
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
  selectShowQueueAdditionFeed, toggleShowQueueAdditionFeed,
  selectSubOnlyMode, settingsChanged, selectAllowChannelPointsRedemptionUrls, selectChannelPointsRewardId
} from '../../settings/settingsSlice';
import { showNotification } from '@mantine/notifications';
import QueueQuickMenu from './QueueQuickMenu';
import TopSubmittersMarquee from './TopSubmittersMarquee';
import { useQueueSearchModal } from './useQueueSearchModal';
import { pollToggled, selectPollActive } from '../../twitchChat/pollSlice';
import QueueAdditionFeed from './QueueAdditionFeed';
import {
  IconBellOff,
  IconBellRinging,
  IconCrown,
  IconCrownOff,
  IconThumbDown,
  IconThumbDownOff,
  IconUserCheck,
  IconUsers,
  IconListDetails,
  IconSearch,
  IconChartBar,
  IconWashTumbleDry,
  IconWashTumbleOff
} from '@tabler/icons-react';

interface QueueControlPanelProps {
  className?: string;
}

const QueueControlPanel = ({ className }: QueueControlPanelProps) => {
  const theme = useMantineTheme();
  const dispatch = useAppDispatch();
  const { openQueueSearchModal } = useQueueSearchModal();
  const showMarquee = useAppSelector(selectShowTopSubmitters);
  const showQueueAdditionFeed = useAppSelector(selectShowQueueAdditionFeed);
  const pollActive = useAppSelector(selectPollActive);

  const skipVotingEnabled = useAppSelector(selectSkipVotingEnabled);
  const subOnlyMode = useAppSelector(selectSubOnlyMode);
  const allowChannelPointsRedemptionUrls = useAppSelector(selectAllowChannelPointsRedemptionUrls);
  const channelPointsRewardId = useAppSelector(selectChannelPointsRewardId);
  const clipLimit = useAppSelector(selectClipLimit);
  const totalClips = useAppSelector(selectTotalQueueLength);
  const clipsLeft = useAppSelector(selectQueueIds).length;

  const handleSkipVotingToggle = () => {
    dispatch(skipVotingToggled());
  };

  const handleTopSubmittersToggle = () => {
    dispatch(toggleShowTopSubmitters());
  };

  const handleQueueAdditionFeedToggle = () => {
    dispatch(toggleShowQueueAdditionFeed());
  };

  const handleSubOnlyModeToggle = () => {
    dispatch(settingsChanged({ subOnlyMode: !subOnlyMode }));
  };

  const handlePollToggle = () => {
    dispatch(pollToggled());
  };

  const handleChannelPointsRedemptionsToggle = () => {
    if (!allowChannelPointsRedemptionUrls && !channelPointsRewardId) {
      showNotification({
        id: 'channel-points-reward-id-required',
        title: 'Channel points reward ID required',
        message: 'Set the reward ID in Settings > Chat Intake > Channel points & power-ups before enabling channel points redemptions.',
        color: 'yellow',
        autoClose: true,
        style: { marginBottom: 82 },
      });
      return;
    }

    dispatch(settingsChanged({ allowChannelPointsRedemptionUrls: !allowChannelPointsRedemptionUrls }));
  };

  const queueCount = `${clipsLeft}/${totalClips}${clipLimit ? `/${clipLimit}` : ''}`;

  return (
    <Stack
      spacing={0}
      className={`queue-control-panel${theme.colorScheme === 'light' ? ' queue-control-panel-light' : ''}${className ? ` ${className}` : ''}`}
      sx={{ marginTop: '-0.5rem' }}
    >
      <Group position="apart" align="center" sx={{ width: '100%' }} mt={0}>
        <Group spacing={6} align="center" sx={{ flex: 1, margin: 0, padding: 0 }}>
          <Text size="md" weight={700} sx={{ margin: 0, padding: 0 }}>
            {queueCount}
          </Text>
          <IconListDetails size={18} style={{ marginTop: 2 }} />
        </Group>
        <Group spacing={6} align="center" sx={{ alignItems: 'center', margin: 4 }}>
          <ActionIcon
            className="queue-quick-action"
            size="sm"
            variant="light"
            onClick={openQueueSearchModal}
            title="Search queue"
            aria-label="Search queue"
          >
            <IconSearch size={18} />
          </ActionIcon>

          <ActionIcon
            className={`queue-quick-action${pollActive ? ' queue-quick-action-poll-active' : ''}`}
            size="sm"
            variant={pollActive ? 'filled' : 'light'}
            onClick={handlePollToggle}
            title={pollActive ? 'Disable poll' : 'Enable poll'}
            aria-label="Toggle poll"
          >
            <IconChartBar size={18} />
          </ActionIcon>

          <ActionIcon
            className={`queue-quick-action${allowChannelPointsRedemptionUrls ? ' queue-quick-action-redemption-active' : ''}`}
            size="sm"
            variant={allowChannelPointsRedemptionUrls ? 'filled' : 'light'}
            onClick={handleChannelPointsRedemptionsToggle}
            title={
              allowChannelPointsRedemptionUrls
                ? 'Disable channel points redemption URL submissions'
                : 'Enable channel points redemption URL submissions'
            }
            aria-label="Toggle channel points redemption URL submissions"
          >
            {allowChannelPointsRedemptionUrls ? <IconWashTumbleDry size={18} /> : <IconWashTumbleOff size={18} />}
          </ActionIcon>

          <ActionIcon
            className="queue-quick-action"
            size="sm"
            variant={showQueueAdditionFeed ? 'filled' : 'light'}
            onClick={handleQueueAdditionFeedToggle}
            title={showQueueAdditionFeed ? 'Hide new media feed' : 'Show new media feed'}
            aria-label={showQueueAdditionFeed ? 'Hide new media feed' : 'Show new media feed'}
          >
            {showQueueAdditionFeed ? <IconBellRinging size={18} /> : <IconBellOff size={18} />}
          </ActionIcon>

          <ActionIcon
            className="queue-quick-action"
            size="sm"
            variant="light"
            onClick={handleSkipVotingToggle}
            title={skipVotingEnabled ? 'Disable skip voting' : 'Enable skip voting'}
            aria-label="Toggle skip voting"
          >
            {skipVotingEnabled ? <IconThumbDown size={18} /> : <IconThumbDownOff size={18} />}
          </ActionIcon>

          <ActionIcon
            className="queue-quick-action"
            size="sm"
            variant="light"
            onClick={handleSubOnlyModeToggle}
            title={subOnlyMode ? 'Disable subscriber-only mode' : 'Enable subscriber-only mode'}
            aria-label="Toggle subscriber-only mode"
          >
            {subOnlyMode ? <IconUserCheck size={18} /> : <IconUsers size={18} />}
          </ActionIcon>

          <ActionIcon
            className="queue-quick-action"
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
      <QueueAdditionFeed enabled={showQueueAdditionFeed} />
    </Stack>
  );
};

export default QueueControlPanel;
