import { useState, useEffect } from 'react';
import { Container, Grid, useMantineTheme, Switch } from '@mantine/core';
import { IconMenu2, IconX, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../../../app/hooks';
import {
  selectAutoplayEnabled,
  autoplayChanged,
  autoplayTimeoutHandleChanged,
  previousClipWatched,
  currentClipWatched
} from '../../clipQueueSlice';
import Player from '../Player';
import Queue from '../Queue';
import QueueControlPanel from '../QueueControlPanel';
import CircularButton from '../CircularButton';
import TitleHover from '../TitleHover';

function SpotlightLayout() {
  const dispatch = useAppDispatch();
  const [queueOpen, setQueueOpen] = useState(false);
  const autoplayEnabled = useAppSelector(selectAutoplayEnabled);
  const [headerHeight, setHeaderHeight] = useState<number>(60);
  const theme = useMantineTheme();

  const playerDesiredHeight = `calc(100vh - ${headerHeight}px - 48px)`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const headerEl = document.querySelector('header') as HTMLElement | null;
    if (!headerEl) return;

    let raf = 0;
    let mounted = true;

    const updateHeader = () => {
      if (!mounted) return;
      try {
        const h = headerEl.offsetHeight || 0;
        setHeaderHeight(Math.round(h));
      } catch (err) {
        // ignore errors
      }
    };

    const scheduleUpdate = () => {
      try { cancelAnimationFrame(raf); } catch (e) { /* ignore */ }
      raf = requestAnimationFrame(updateHeader);
    };

    scheduleUpdate();
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('orientationchange', scheduleUpdate);

    let mo: MutationObserver | null = null;
    try {
      mo = new MutationObserver(() => scheduleUpdate());
      mo.observe(headerEl, { attributes: true, attributeFilter: ['class', 'style'], childList: true, subtree: false });
    } catch (err) {
      mo = null;
    }

    return () => {
      mounted = false;
      try { cancelAnimationFrame(raf); } catch (e) { /* ignore */ }
      try { window.removeEventListener('resize', scheduleUpdate); } catch (e) { /* ignore */ }
      try { window.removeEventListener('orientationchange', scheduleUpdate); } catch (e) { /* ignore */ }
      try { mo?.disconnect(); } catch (e) { /* ignore */ }
    };
  }, []);

  useEffect(() => {
    // hide browser scrollbars but allow scrolling
    const styleId = 'etf-hide-scrollbar-style';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      html, body, #root, * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
      *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
    `;
    document.head.appendChild(style);

    return () => {
      document.getElementById(styleId)?.remove();
    };
  }, []);

  const toggleQueue = () => {
    setQueueOpen(prev => !prev);
  };

  const handlePreviousClip = () => {
    dispatch(previousClipWatched());
  };

  const handleNextClip = () => {
    dispatch(currentClipWatched());
  };

  const handleAutoplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(autoplayTimeoutHandleChanged({ set: false }));
    dispatch(autoplayChanged(e.currentTarget.checked));
  };

  return (
    <Container fluid pt="md" className="spotlight-layout">
      <div className="content-container">
        <div className="stage">
          <div className="side-panel left">
            <CircularButton
              onClick={handlePreviousClip}
              title="Previous"
              color="dark"
              size={96}
            >
              <IconChevronLeft size={48} />
            </CircularButton>
          </div>

          <div className="player-box" style={{ height: playerDesiredHeight }}>
            <Player />
            <TitleHover />
          </div>

          <div className="side-panel right">
            <CircularButton
              onClick={handleNextClip}
              title="Next"
              color="dark"
              size={96}
            >
              <IconChevronRight size={48} />
            </CircularButton>
          </div>

          {queueOpen && (
            <div
              className="queue-popup"
              style={{
                background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
                color: theme.colorScheme === 'dark' ? theme.colors.gray[0] : undefined
              }}
            >
              <div className="panel-section">
                <QueueControlPanel />
              </div>
              <div className="panel-section">
                <Grid pt="sm">
                  <Queue card wrapper={({ children }) => <Grid.Col span={2}>{children}</Grid.Col>} />
                </Grid>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="queue-toggle">
        <CircularButton
          onClick={toggleQueue}
          title={queueOpen ? 'Hide queue' : 'Show queue'}
        >
          {queueOpen ? <IconX /> : <IconMenu2 />}
        </CircularButton>
      </div>

      <div className="autoplay-toggle">
        <Switch
          size="sm"
          label="Autoplay"
          checked={autoplayEnabled}
          onChange={handleAutoplayChange}
        />
      </div>
    </Container>
  );
}

export default SpotlightLayout;
