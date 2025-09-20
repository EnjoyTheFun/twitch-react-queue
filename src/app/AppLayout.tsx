import { AppShell, Box } from '@mantine/core';
import { PropsWithChildren } from 'react';
import AppHeader from './AppHeader';
import AppTitle from './AppTitle';

const AppLayout = ({ children, noNav = false }: PropsWithChildren<{ noNav?: boolean }>) => {

  return (
    <AppShell
      padding={0}
      fixed
      header={<AppHeader noNav={noNav} />}
      sx={{
        main: {
          height: '100vh',
          minHeight: '100vh',
          maxHeight: '100vh',
        },
      }}
    >
      <AppTitle />
      <Box
        sx={{
          height: '100%',
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </AppShell>
  );
};
AppLayout.displayName = 'AppLayout';

export default AppLayout;
