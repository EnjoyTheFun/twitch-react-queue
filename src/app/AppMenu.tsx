import {
  UnstyledButton,
  Avatar,
  Menu,
  Switch,
  Text,
  Group,
  useMantineColorScheme,
  Divider,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconMoonStars, IconSettings, IconLogout, IconChevronDown, IconToggleLeftFilled, IconToggleRightFilled } from '@tabler/icons-react';
import { selectUsername, selectProfilePictureUrl, logout } from '../features/auth/authSlice';
import { isOpenChanged, selectIsOpen } from '../features/clips/clipQueueSlice';
import useSettingsModal from '../features/settings/SettingsModal';
import { useAppDispatch, useAppSelector } from './hooks';

const AppMenu = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const username = useAppSelector(selectUsername);
  const profilePictureUrl = useAppSelector(selectProfilePictureUrl);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { openSettingsModal } = useSettingsModal();

  const handleLogout = () => {
    navigate('/');
    dispatch(logout());
  };

  const isOpen = useAppSelector(selectIsOpen);
  const handleToggleQueue = () => dispatch(isOpenChanged(!isOpen));

  return (
    <Menu
      withinPortal={true}
      position="bottom"
      placement="end"
      closeOnItemClick={true}
      control={
        <UnstyledButton
          sx={(theme) => ({
            padding: theme.spacing.xs,

            '&:hover': {
              backgroundColor:
                theme.colorScheme === 'dark'
                  ? theme.fn.rgba(theme.colors[theme.primaryColor][9], 0.35)
                  : theme.fn.rgba(theme.colors.gray[0], 0.35),
            },
          })}
        >
          <Group sx={{ minWidth: 0, gap: 8, alignItems: 'center', flexWrap: 'nowrap' }}>
            <Avatar size="md" radius="xl" src={profilePictureUrl} alt={username}></Avatar>
            <Text
              sx={{
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                maxWidth: 140,
                display: 'block',
                '@media (max-width: 800px)': {
                  display: 'none',
                },
              }}
            >
              {username}
            </Text>
            <IconChevronDown size={14} />
          </Group>
        </UnstyledButton>
      }
    >
      <Menu.Item
        icon={<IconMoonStars size={14} />}
        onClick={() => toggleColorScheme()}
        rightSection={<Switch size="xs" checked={colorScheme === 'dark'} readOnly />}
      >
        Dark mode
      </Menu.Item>
      { /* Mobile-only queue toggle */ }
      <Menu.Item
        icon={isOpen ? <IconToggleRightFilled size={14} /> : <IconToggleLeftFilled size={14} />}
        onClick={handleToggleQueue}
        sx={{ '@media (min-width: 551px)': { display: 'none' } }}
      >
        {isOpen ? 'Close Queue' : 'Open Queue'}
      </Menu.Item>
      <Menu.Item icon={<IconSettings size={14} />} onClick={() => openSettingsModal()}>
        Settings
      </Menu.Item>

      <Divider />

      <Menu.Item
        icon={<IconLogout size={14} />}
        onClick={handleLogout}
      >
        Log Out
      </Menu.Item>
    </Menu>
  );
};
AppMenu.displayName = 'AppMenu';

export default AppMenu;
