import { useModals } from '@mantine/modals';
import QueueSearchModal from './QueueSearch';

export const useQueueSearchModal = () => {
  const modals = useModals();

  const openQueueSearchModal = () => {
    const id = modals.openModal({
      children: <QueueSearchModal closeModal={() => modals.closeModal(id)} />,
      closeOnClickOutside: true,
      closeOnEscape: true,
      size: 'lg',
      withCloseButton: false,
    });
  };

  return { openQueueSearchModal };
};
