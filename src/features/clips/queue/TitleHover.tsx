import { useState } from 'react';
import { ActionIcon, useMantineTheme } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import PlayerTitle from './PlayerTitle';

export default function TitleHover() {
  const [show, setShow] = useState(false);
  const theme = useMantineTheme();
  const containerStyle: React.CSSProperties = { position: 'fixed', bottom: 20, left: 20, zIndex: 2000 };
  const buttonStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 50,
  };

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 'calc(100% + 12px)',
    left: 0,
    background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
    color: theme.colorScheme === 'dark' ? theme.colors.gray[0] : undefined,
    padding: '12px 14px',
    borderRadius: 8,
    boxShadow: '0 8px 26px rgba(0, 0, 0, 0.45)',
    zIndex: 60,
    minWidth: '50vw',
    maxWidth: 'min(90vw, 560px)'
  };

  return (
    <div style={containerStyle} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
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
