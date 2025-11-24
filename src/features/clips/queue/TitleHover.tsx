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
        <ActionIcon
          variant="filled"
          size="xl"
          style={{
            opacity: 0.35,
            transition: 'opacity 140ms, transform 160ms',
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32
          }}
          onMouseEnter={(e: React.MouseEvent) => {
            const el = e.currentTarget as HTMLElement;
            el.style.opacity = '1';
            el.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e: React.MouseEvent) => {
            const el = e.currentTarget as HTMLElement;
            el.style.opacity = '0.35';
            el.style.transform = 'scale(1)';
          }}
        >
          <IconInfoCircle size={36} />
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
