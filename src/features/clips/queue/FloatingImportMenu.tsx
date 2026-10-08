import { ActionIcon, Box } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useModals } from '@mantine/modals';
import { useAppSelector } from '../../../app/hooks';
import { selectUsername } from '../../auth/authSlice';
import ImportLinksModal from './ImportLinksModal';

function FloatingImportMenu() {
  const username = useAppSelector(selectUsername);
  const modals = useModals();

  const openBulkImportModal = () => {
    modals.openModal({
      title: 'Import links',
      children: <ImportLinksModal />,
      size: 'lg',
    });
  };

  if (!username) return null;

  return (
    <Box className="floating-import-menu">
      <ActionIcon
        className="fab-main"
        size="xl"
        radius="xl"
        variant="filled"
        color="indigo"
        aria-label="Import links"
        onClick={openBulkImportModal}
        sx={{
          transition: 'transform 220ms ease',
          '&:hover': {
            transform: 'scale(1.08)',
          },
        }}
      >
        <IconPlus size={24} />
      </ActionIcon>
    </Box>
  );
}

export default FloatingImportMenu;

