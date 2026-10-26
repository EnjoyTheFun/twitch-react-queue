import { Text } from '@mantine/core';
import { useModals } from '@mantine/modals';
import { SettingsModal } from './SettingsModal';

const useSettingsModal = () => {
  const modals = useModals();
  const openSettingsModal = () => {
    const id = modals.openModal({
      title: <Text size="xl" weight={800}>Settings</Text>,
      children: <SettingsModal closeModal={() => modals.closeModal(id)} />,
      closeOnClickOutside: false,
      closeOnEscape: false,
      size: 900,
    });
  };

  return { openSettingsModal };
};

export default useSettingsModal;
