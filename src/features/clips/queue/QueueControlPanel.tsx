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
  selectSkipVotingEnabled,
  skipVotingToggled,
} from '../clipQueueSlice';
import { selectShowTopSubmitters, toggleShowTopSubmitters } from '../../settings/settingsSlice';
import QueueQuickMenu from './QueueQuickMenu';
import TopSubmittersMarquee from './TopSubmittersMarquee';
import { useModals } from '@mantine/modals';
import ImportLinksModal from './ImportLinksModal';
import { IconFileImport, IconPalette, IconPaletteOff, IconCrown, IconCrownOff, IconThumbDown, IconThumbDownOff } from '@tabler/icons-react';

interface QueueControlPanelProps {
  className?: string;
}

const QueueControlPanel = ({ className }: QueueControlPanelProps) => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsOpen);
  const showMarquee = useAppSelector(selectShowTopSubmitters);
  const colored = useAppSelector(selectColoredSubmitterNames);
  const skipVotingEnabled = useAppSelector(selectSkipVotingEnabled);
  const clipLimit = useAppSelector(selectClipLimit);
  const totalClips = useAppSelector(selectTotalQueueLength);
  const clipsLeft = useAppSelector(selectQueueIds).length;
  const modals = useModals();

  const handleQueueToggle = (state: string) => {
    dispatch(isOpenChanged(state === 'open'));
  };

  const handleImportModal = () => {
    modals.openModal({
      title: 'Import links',
      children: <ImportLinksModal />,
      size: 'lg'
    });
  };

  const handleSkipVotingToggle = () => {
    dispatch(skipVotingToggled());
  };

  const handleColorsToggle = () => {
    dispatch(submitterColorsToggled());
  };

  const handleTopSubmittersToggle = () => {
    dispatch(toggleShowTopSubmitters());
  };

  const queueText = `${clipsLeft} of ${totalClips}${clipLimit ? `/${clipLimit}` : ''} clips left`;

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
          onChange={handleQueueToggle}
        />
        <QueueQuickMenu />
      </Group>
      <Group position="apart" align="center" sx={{ width: '100%' }} mt={0}>
        <Text size="md" weight={700} sx={{ flex: 1, margin: 0, padding: 0 }}>
          {queueText}
        </Text>
        <Group spacing={6} align="center" sx={{ alignItems: 'center', margin: 4 }}>
          <ActionIcon
            size="sm"
            variant="light"
            onClick={handleImportModal}
            title="Import links"
            aria-label="Import links"
          >
            <IconFileImport size={18} />
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
            onClick={handleColorsToggle}
            title={colored ? 'Disable submitter colors' : 'Enable submitter colors'}
            aria-label="Toggle submitter colors"
          >
            {colored ? <IconPalette size={18} /> : <IconPaletteOff size={18} />}
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="light"
            onClick={handleTopSubmittersToggle}
            title={showMarquee ? 'Hide top submitters' : 'Show top submitters'}
          >
            {showMarquee ? <IconCrown size={18} /> : <IconCrownOff size={18} />}
          </ActionIcon>
        </Group>
      </Group>

      {showMarquee && <TopSubmittersMarquee count={3} />}
    </Stack>
  );
};

export default QueueControlPanel;
