import { useState, useEffect } from 'react';
import { Container, useMantineTheme, Switch } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../../../app/hooks';
import {
  selectAutoplayEnabled,
  autoplayChanged,
  autoplayTimeoutHandleChanged,
  previousClipWatched,
  currentClipWatched
} from '../../clipQueueSlice';
import Queue from '../Queue';
import QueueControlPanel from '../QueueControlPanel';
import CircularButton from '../CircularButton';
import TitleHover from '../TitleHover';
import Player from '../Player';

function SpotlightLayout() {
  const dispatch = useAppDispatch();
  const [queueOpen, setQueueOpen] = useState(false);
  const autoplayEnabled = useAppSelector(selectAutoplayEnabled);
  const [headerHeight, setHeaderHeight] = useState<number>(60);
  const [leftHoverIntensity, setLeftHoverIntensity] = useState(0);
  const [rightHoverIntensity, setRightHoverIntensity] = useState(0);
  const theme = useMantineTheme();

  const playerDesiredHeight = `calc(100vh - ${headerHeight}px - 48px)`;

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const screenWidth = window.innerWidth;
      const mouseX = e.clientX;

      const playerBox = document.querySelector('.player-box') as HTMLElement | null;
      if (playerBox) {
        const rect = playerBox.getBoundingClientRect();
        const isOverPlayer = (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        );

        if (isOverPlayer) {
          setLeftHoverIntensity(0);
          setRightHoverIntensity(0);
          return;
        }
      }

      const leftDistance = mouseX;
      const leftMaxDistance = 300;
      const leftIntensity = Math.max(0, Math.min(1, 1 - leftDistance / leftMaxDistance));
      setLeftHoverIntensity(leftIntensity);

      const rightDistance = screenWidth - mouseX;
      const rightMaxDistance = 300;
      const rightIntensity = Math.max(0, Math.min(1, 1 - rightDistance / rightMaxDistance));
      setRightHoverIntensity(rightIntensity);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, []);

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
    dispatch(autoplayTimeoutHandleChanged({ set: false }));
    dispatch(previousClipWatched());
  };

  const handleNextClip = () => {
    dispatch(autoplayTimeoutHandleChanged({ set: false }));
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
          {/* Left edge zone */}
          <div
            className="spotlight-edge-zone left"
            onClick={handlePreviousClip}
            style={{
              background: `linear-gradient(to right,
                rgba(0, 0, 0, ${0.6 * leftHoverIntensity}) 0%,
                rgba(0, 0, 0, ${0.35 * leftHoverIntensity}) 40%,
                transparent 100%)`,
            }}
          >
            <div className="spotlight-edge-icon" style={{ opacity: leftHoverIntensity, transform: `translateX(${-10 + leftHoverIntensity * 10}px)` }}>
              <IconChevronLeft size={64} stroke={2.5} />
            </div>
          </div>

          {/* Right edge zone */}
          <div
            className="spotlight-edge-zone right"
            onClick={handleNextClip}
            style={{
              background: `linear-gradient(to left,
                rgba(0, 0, 0, ${0.6 * rightHoverIntensity}) 0%,
                rgba(0, 0, 0, ${0.35 * rightHoverIntensity}) 40%,
                transparent 100%)`,
            }}
          >
            <div className="spotlight-edge-icon" style={{ opacity: rightHoverIntensity, transform: `translateX(${10 - rightHoverIntensity * 10}px)` }}>
              <IconChevronRight size={64} stroke={2.5} />
            </div>
          </div>

          <div className="player-box" style={{ height: playerDesiredHeight }}>
            <Player />
          </div>

          {/* Bottom slide-up queue overlay */}
          <div
            className={`spotlight-queue-overlay ${queueOpen ? 'open' : 'closed'}`}
            style={{
              background: theme.colorScheme === 'dark'
                ? 'rgba(26,27,30,0.70)'
                : 'rgba(255,255,255,0.70)',
              color: theme.colorScheme === 'dark' ? theme.colors.gray[0] : undefined,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            <div className="spotlight-queue-close">
              <CircularButton
                onClick={toggleQueue}
                title={queueOpen ? 'Hide queue' : 'Show queue'}
                color="dark"
                size={60}
                clearWhenIdle
              >
                <IconChevronDown size={34} />
              </CircularButton>
            </div>
            <div className="panel-section">
              <QueueControlPanel />
            </div>
            <div className="panel-section">
              <div className="spotlight-queue-grid" role="list">
                <Queue card wrapper={({ children }) => <div className="spotlight-queue-item" role="listitem">{children}</div>} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {!queueOpen && (
        <div className="spotlight-queue-toggle">
          <CircularButton
            onClick={toggleQueue}
            title="Show queue"
            clearWhenIdle
            color="dark"
            size={72}
          >
            <IconChevronUp size={40} />
          </CircularButton>
        </div>
      )}

      <div className="autoplay-toggle">
        <Switch
          size="sm"
          label="Autoplay"
          checked={autoplayEnabled}
          onChange={handleAutoplayChange}
        />
      </div>

      <div className="info-toggle">
        <TitleHover />
      </div>
    </Container>
  );
}

export default SpotlightLayout;
