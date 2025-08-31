import { useState } from 'react';
import { ActionIcon, useMantineTheme } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import PlayerTitle from './PlayerTitle';

export default function TitleHover() {
  const [show, setShow] = useState(false);
  const theme = useMantineTheme();

  const buttonStyle: React.CSSProperties = {
    position: 'absolute',
    top: 8,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 50,
  };

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 40,
    left: '50%',
    transform: 'translateX(-50%)',
    background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
    color: theme.colorScheme === 'dark' ? theme.colors.gray[0] : undefined,
    padding: 8,
    borderRadius: 6,
    boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
    zIndex: 60,
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <div style={buttonStyle}>
        <ActionIcon variant="filled" size="md" title="Show info" style={{ opacity: 0.3, transition: 'opacity 120ms' }} onMouseEnter={(e: React.MouseEvent) => ((e.currentTarget as HTMLElement).style.opacity = '1')} onMouseLeave={(e: React.MouseEvent) => ((e.currentTarget as HTMLElement).style.opacity = '0.3')}>
          <IconInfoCircle />
        </ActionIcon>
      </div>
      {show && (
        <div style={panelStyle}>
          <PlayerTitle />
        </div>
      )}
    </div>
  );
}
