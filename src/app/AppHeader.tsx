import { useState } from 'react';
import { ActionIcon, ActionIconProps, Button, Group, Header, Space, Text, ThemeIcon, Box, SegmentedControl } from '@mantine/core';
import { IconHome, IconList, IconHistory } from '@tabler/icons-react';
import { PropsWithChildren } from 'react';
import { NavLinkProps, useLocation } from 'react-router-dom';
import ColorSchemeSwitch from '../common/components/ColorSchemeSwitch';
import NavLink from '../common/components/NavLink';
import MyCredits from '../common/components/MyCredits';
import IfAuthenticated from '../features/auth/IfAuthenticated';
import { useAppDispatch, useAppSelector } from './hooks';
import { login } from '../features/auth/authSlice';
import AppMenu from './AppMenu';
import { isOpenChanged, selectIsOpen } from '../features/clips/clipQueueSlice';

const TitleIcon = () => {
  const favicon = `${import.meta.env.BASE_URL || ''}favicon.svg`;

  return (
    <img src={favicon} alt="React Queue" style={{ width: 32, height: 32 }} />
  );
};

const TitleText = () => (
  <Group direction="column" spacing={0} className="app-title-section">
    <Text size="xl" weight={800}>
      React Queue
    </Text>
    <MyCredits persist={false} />
  </Group>
);

const NavBarIcon = ({ children, ...props }: PropsWithChildren<ActionIconProps<any>>) => (
  <ActionIcon variant="hover" size="lg" {...props}>
    {children}
  </ActionIcon>
);

const NavBarButton = ({ children, type, className, style, icon, ...props }: PropsWithChildren<NavLinkProps & { icon?: React.ReactNode }>) => {
  const label = typeof children === 'string' ? children : undefined;
  return (
    <Button
      component={NavLink}
      variant="subtle"
      aria-label={label}
      {...props}
      className="nav-link"
      activeStyle={({ isActive }: { isActive: boolean }) => ({
        borderBottom: isActive ? '1px solid' : undefined,
      })}
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

  const handleLogin = () => {
    dispatch(login(location.pathname));
  };

  const toggleCollapsed = () => {
    setCollapsed(prev => !prev);
  };

  const handleQueueToggle = (state: string) => {
    dispatch(isOpenChanged(state === 'open'));
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
                  gap: 0,
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
                </IfAuthenticated>
              </Group>
            )}
          </Group>
          <IfAuthenticated
            otherwise={
              <Group sx={{ flexWrap: 'nowrap', gap: '0.5rem' }}>
                <ColorSchemeSwitch component={NavBarIcon} />
                <Button onClick={handleLogin}>Login with Twitch</Button>
              </Group>
            }
          >
            <Group spacing="xs" align="center" sx={{ flexWrap: 'nowrap', gap: '1rem', minWidth: 0, overflowX: 'auto', alignItems: 'center', justifyContent: 'flex-end' }}>
              <Group
                spacing={6}
                align="center"
                className="status-group"
                sx={(theme) => ({
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
                <Text className="status-label hide-on-mobile" size="sm" weight={600} sx={{ lineHeight: 1, fontSize: '1rem' }}>Status:</Text>
                <SegmentedControl
                  size="sm"
                  sx={{
                    display: 'flex',
                    width: '176px',
                    '& .mantine-SegmentedControl-control': {
                      display: 'flex',
                      width: '100%'
                    },
                    '& .mantine-SegmentedControl-item': {
                      flex: '1 1 0% !important',
                      width: '50% !important',
                      minWidth: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingLeft: '6px',
                      paddingRight: '6px'
                    },
                    '& .mantine-SegmentedControl-item button, & .mantine-SegmentedControl-item [role="button"]': {
                      width: '100% !important',
                      display: 'block'
                    },
                    '& .mantine-SegmentedControl-label': {
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      textAlign: 'center',
                      width: '100%'
                    }
                  }}
                  value={isOpen ? 'open' : 'closed'}
                  data={[
                    { label: 'Closed', value: 'closed' },
                    { label: 'Open', value: 'open' },
                  ]}
                  onChange={handleQueueToggle}
                />
              </Group>

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
        <Text size="xs" sx={(t) => ({ lineHeight: 1, transition: 'transform 140ms', transform: collapsed ? 'translateY(0)' : 'translateY(-2px)', })}>
          {collapsed ? '▾' : '▴'}
        </Text>
      </Box>
    </Header>
  );
};
AppHeader.displayName = 'AppHeader';

export { TitleIcon, TitleText };
export default AppHeader;
