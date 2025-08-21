import { Group, Text, SegmentedControl, Stack, ActionIcon } from '@mantine/core';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  isOpenChanged,
  selectClipLimit,
  selectIsOpen,
  selectQueueIds,
  selectTotalQueueLength,
  submitterColorsToggled,
  selectColoredSubmitterNames,
} from '../clipQueueSlice';
import { selectShowTopSubmitters, toggleShowTopSubmitters } from '../../settings/settingsSlice';
import QueueQuickMenu from './QueueQuickMenu';
import TopSubmittersMarquee from './TopSubmittersMarquee';
import { Palette, Crown } from 'tabler-icons-react';

interface QueueControlPanelProps {
  className?: string;
}

function QueueControlPanel({ className }: QueueControlPanelProps) {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsOpen);
  const showMarquee = useAppSelector(selectShowTopSubmitters);
  const colored = useAppSelector(selectColoredSubmitterNames);
  const clipLimit = useAppSelector(selectClipLimit);
  const totalClips = useAppSelector(selectTotalQueueLength);
  const clipsLeft = useAppSelector(selectQueueIds).length;

  return (
    <Stack spacing={0} className={className}>
      <Group>
        <Text size="lg" weight={700} sx={{ flexGrow: 1 }}>
          Queue
        </Text>
        <SegmentedControl
          size="xs"
          sx={{ flexBasis: 196 }}
          value={isOpen ? 'open' : 'closed'}
          data={[
            { label: 'Closed', value: 'closed' },
            { label: 'Open', value: 'open' },
          ]}
          onChange={(state) => dispatch(isOpenChanged(state === 'open'))}
        />
        <QueueQuickMenu />
      </Group>
      <Group position="apart" align="center" sx={{ width: '100%' }} mt={0}>
        <Text size="md" weight={700} sx={{ flex: 1, margin: 0, padding: 0 }}>
          {clipsLeft} of {totalClips}
          {clipLimit && `/${clipLimit}`} clips left
        </Text>
        <Group spacing={6} align="center" sx={{ alignItems: 'center', margin: 4 }}>
          <ActionIcon
            size="sm"
            variant="light"
            onClick={() => dispatch(submitterColorsToggled())}
            title={colored ? 'Disable submitter colors' : 'Enable submitter colors'}
            aria-label="Toggle submitter colors"
          >
            <Palette size={18} />
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="light"
            onClick={() => dispatch(toggleShowTopSubmitters())}
            title={showMarquee ? 'Hide top submitters' : 'Show top submitters'}
          >
            <Crown size={18} />
          </ActionIcon>
        </Group>
      </Group>

      {showMarquee && <TopSubmittersMarquee count={3} />}
    </Stack>
  );
}

export default QueueControlPanel;
