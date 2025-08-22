import { ActionIcon, ActionIconProps, Button, Group, Header, Space, Text, ThemeIcon, useMantineTheme, Box } from '@mantine/core';
import { PropsWithChildren, useState } from 'react';
import ColorSchemeSwitch from '../common/components/ColorSchemeSwitch';
import { NavLinkProps, useLocation } from 'react-router-dom';
import NavLink from '../common/components/NavLink';
import MyCredits from '../common/components/MyCredits';
import IfAuthenticated from '../features/auth/IfAuthenticated';
import { useAppDispatch } from './hooks';
import { login } from '../features/auth/authSlice';
import AppMenu from './AppMenu';
import ImportLinksButton from '../features/clips/queue/ImportLinksButton';

export function TitleIcon() {
  const favicon = `${process.env.PUBLIC_URL || ''}/favicon.svg`;

  return (
    <ThemeIcon size="xl" variant="gradient" gradient={{ from: 'violet', to: 'indigo' }}>
      <img src={favicon} alt="React Queue" style={{ width: 32, height: 32 }} />
    </ThemeIcon>
  );
}

export function TitleText() {
  return (
    <Group direction="column" spacing={0}>
      <Text size="xl" weight={800}>
        React Queue
      </Text>
      <MyCredits />
    </Group>
  );
}

function NavBarIcon({ children, ...props }: PropsWithChildren<ActionIconProps<any>>) {
  return (
    <ActionIcon variant="hover" size="lg" {...props}>
      {children}
    </ActionIcon>
  );
}

function NavBarButton({ children, type, className, style, ...props }: PropsWithChildren<NavLinkProps>) {
  return (
    <Button
      component={NavLink}
      variant="subtle"
      {...props}
      activeStyle={({ isActive }: { isActive: boolean }) => ({
        borderBottom: isActive ? '1px solid' : undefined,
      })}
    >
      {children}
    </Button>
  );
}

function AppHeader({ noNav = false }: { noNav?: boolean }) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const theme = useMantineTheme();

  return (
    <Header height={collapsed ? 0 : 60} px="lg" sx={{ overflow: 'visible', transition: 'height 160ms' }}>
      {!collapsed ? (
        <Group position="apart" align="center" sx={{ height: '100%' }}>
          <Group align="center">
            <TitleIcon />
            <TitleText />
            <Space />
            {!noNav && (
              <Group spacing={0}>
                <NavBarButton to="/">Home</NavBarButton>
                <IfAuthenticated>
                  <NavBarButton to="queue">Queue</NavBarButton>
                  <NavBarButton to="history">History</NavBarButton>
                </IfAuthenticated>
              </Group>
            )}
          </Group>
          <IfAuthenticated
            otherwise={
              <Group>
                <ColorSchemeSwitch component={NavBarIcon} />
                <Button onClick={() => dispatch(login(location.pathname))}>Login with Twitch</Button>
              </Group>
            }
          >
            <Group spacing="xs" align="center">
              <ImportLinksButton />
              <AppMenu />
            </Group>
          </IfAuthenticated>
        </Group>
      ) : (
  <Group position="right" sx={{ height: '100%', alignItems: 'center' }}>
  </Group>
      )}

  <Box
        onClick={() => setCollapsed((c) => !c)}
        role="button"
        aria-label={collapsed ? 'Expand header' : 'Collapse header'}
        sx={() => ({
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
}

export default AppHeader;
