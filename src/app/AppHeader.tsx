import { useEffect, useState } from 'react';
import { ActionIcon, ActionIconProps, Button, Group, Header, Space, Text, ThemeIcon, Box, Tooltip, Sx, useMantineColorScheme } from '@mantine/core';
import { IconHome, IconList, IconHistory, IconCrown, IconPlugConnectedX } from '@tabler/icons-react';
import { PropsWithChildren } from 'react';
import { NavLinkProps, useLocation } from 'react-router-dom';
import ColorSchemeSwitch from '../common/components/ColorSchemeSwitch';
import NavLink from '../common/components/NavLink';
import MyCredits from '../common/components/MyCredits';
import IfAuthenticated from '../features/auth/IfAuthenticated';
import { useAppDispatch, useAppSelector } from './hooks';
import { login } from '../features/auth/authSlice';
import AppMenu from './AppMenu';
import { isOpenChanged, selectIsOpen, selectLayout } from '../features/clips/clipQueueSlice';
import { selectChatConnectionStatus } from '../features/twitchChat/chatConnectionSlice';

const TitleIcon = () => {
  const favicon = `${import.meta.env.BASE_URL || ''}favicon.svg`;

  return (
    <img src={favicon} alt="React Queue" style={{ width: 32, height: 32 }} />
  );
};

const TitleText = () => {
  const { colorScheme } = useMantineColorScheme();

  return (
    <Group direction="column" spacing={0} className="app-title-section">
      <Text size="xl" weight={800} color={colorScheme === 'dark' ? 'white' : 'dark'} className="app-title-wordmark">
        React Queue
      </Text>
      <MyCredits persist={false} />
    </Group>
  );
};

const NavBarIcon = ({ children, ...props }: PropsWithChildren<ActionIconProps<'button'>>) => (
  <ActionIcon variant="hover" size="lg" {...props}>
    {children}
  </ActionIcon>
);

const NavBarButton = ({ children, type: _type, className: _className, style: _style, icon, sx, ...props }: PropsWithChildren<NavLinkProps & { icon?: React.ReactNode; sx?: Sx }>) => {
  const label = typeof children === 'string' ? children : undefined;
  return (
    <Button
      component={NavLink}
      variant="subtle"
      aria-label={label}
      {...props}
      className="nav-link"
      sx={{ width: 75, justifyContent: 'center', ...sx }}
    >
      {icon && <span className="nav-icon" aria-hidden>{icon}</span>}
      <span className="nav-text">{children}</span>
    </Button>
  );
};

const AppHeader = ({ noNav = false }: { noNav?: boolean }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const isOpen = useAppSelector(selectIsOpen);
  const layout = useAppSelector(selectLayout);
  const chatConnectionStatus = useAppSelector(selectChatConnectionStatus);

  useEffect(() => {
    if (location.pathname.startsWith('/queue')) {
      setCollapsed(layout === 'fullscreen');
    } else {
      setCollapsed(false);
    }
  }, [layout, location.pathname]);

  const handleLogin = () => {
    dispatch(login(location.pathname));
  };

  const toggleCollapsed = () => {
    setCollapsed(prev => !prev);
  };

  const handleQueueToggle = () => {
    dispatch(isOpenChanged(!isOpen));
  };

  return (
    <Header height={collapsed ? 0 : 60} px="lg" sx={{ overflow: 'visible', transition: 'height 160ms' }}>
      {!collapsed ? (
        <Group position="apart" align="center" sx={{ height: '100%', flexWrap: 'nowrap' }}>
          <Group align="center" sx={{ minWidth: 0, gap: '1rem', flexWrap: 'nowrap' }}>
            <TitleIcon />
            <TitleText />
            <Space />
            {!noNav && (
              <Group
                spacing={0}
                sx={{
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'nowrap',
                  overflow: 'visible',
                  alignItems: 'center',
                }}
              >
                <NavBarButton to="/" icon={<IconHome />}>
                  Home
                </NavBarButton>
                <IfAuthenticated>
                  <NavBarButton to="queue" icon={<IconList />}>
                    Queue
                  </NavBarButton>
                  <NavBarButton to="history" icon={<IconHistory />}>
                    History
                  </NavBarButton>
                  <Box sx={{ '@media (max-width: 799px)': { display: 'none' } }}>
                    <NavBarButton to="stats" icon={<IconCrown />}>
                      Stats
                    </NavBarButton>
                  </Box>
                </IfAuthenticated>
              </Group>
            )}
          </Group>
          <IfAuthenticated
            otherwise={
              <Group sx={{ flexWrap: 'nowrap', gap: '0.5rem' }}>
                <ColorSchemeSwitch component={NavBarIcon} />
                <Button onClick={handleLogin} variant="subtle" className="nav-link login-button">
                  Login with Twitch
                </Button>
              </Group>
            }
          >
            <Group spacing="xs" align="center" sx={{ flexWrap: 'nowrap', gap: '1rem', minWidth: 0, overflowX: 'auto', alignItems: 'center', justifyContent: 'flex-end' }}>
              <Group
                spacing={6}
                align="center"
                className="status-group"
                sx={() => ({
                  padding: '8px 8px',
                  borderRadius: 4,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  '@media (max-width: 550px)': {
                    display: 'none'
                  }
                })}
              >
                <Button
                  size="xs"
                  variant="light"
                  color={isOpen ? 'teal' : 'gray'}
                  className={`queue-status-pill ${isOpen ? 'is-open' : 'is-closed'}`}
                  onClick={handleQueueToggle}
                  aria-pressed={isOpen}
                  title={`Click to ${isOpen ? 'close' : 'open'} the queue`}
                  sx={{ borderRadius: 10, height: 36, width: 158, paddingLeft: 12, paddingRight: 12, textTransform: 'none' }}
                >
                  <span className="queue-status-label">{isOpen ? 'Queue Open' : 'Queue Closed'}</span>
                  <span className="queue-status-switch" aria-hidden="true">
                    <span className="queue-status-dot" />
                  </span>
                </Button>
              </Group>

              {chatConnectionStatus === 'disconnected' && (
                <Tooltip label="Chat disconnected">
                  <ThemeIcon
                    variant="light"
                    color="red"
                    size="lg"
                    radius="xl"
                    sx={{ flexShrink: 0 }}
                  >
                    <IconPlugConnectedX size={18} />
                  </ThemeIcon>
                </Tooltip>
              )}

              <Box sx={{ flexShrink: 0, marginLeft: '8px' }}>
                <AppMenu />
              </Box>
            </Group>
          </IfAuthenticated>
        </Group>
      ) : (
        <Group position="right" sx={{ height: '100%', alignItems: 'center' }}>
        </Group>
      )}

      <Box
        onClick={toggleCollapsed}
        role="button"
        aria-label={collapsed ? 'Expand header' : 'Collapse header'}
        sx={(theme) => ({
          position: collapsed ? 'fixed' : 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: collapsed ? 0 : '100%',
          width: 20,
          height: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
          border: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3]}`,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          boxShadow: theme.shadows.xs,
          zIndex: 2000,
          cursor: 'pointer',
          padding: 0,
          transformOrigin: 'top center',
          transition: 'width 140ms ease, height 140ms ease, box-shadow 140ms ease',
          '&:hover': {
            width: 36,
            height: 24,
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
            boxShadow: theme.shadows.sm,
          },
        })}
      >
        <Text size="xs" sx={() => ({ lineHeight: 1, transition: 'transform 140ms', transform: collapsed ? 'translateY(0)' : 'translateY(-2px)', })}>
          {collapsed ? '▾' : '▴'}
        </Text>
      </Box>
    </Header>
  );
};
AppHeader.displayName = 'AppHeader';

export { TitleIcon, TitleText };
export default AppHeader;
