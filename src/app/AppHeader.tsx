import { ActionIcon, ActionIconProps, Button, Group, Header, Space, Text, ThemeIcon } from '@mantine/core';
import { PropsWithChildren } from 'react';
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

  return (
    <Header height={60} px="lg">
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
    </Header>
  );
}

export default AppHeader;
