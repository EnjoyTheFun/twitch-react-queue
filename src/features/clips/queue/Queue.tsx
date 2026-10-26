import { DragEvent, Fragment, PropsWithChildren, ReactElement, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconTrash } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectQueueClips, currentClipReplaced, queueClipRemoved, queueItemsReordered } from '../clipQueueSlice';
import { selectHighlightRedemptionSubmissions, selectShowQueueDragHints } from '../../settings/settingsSlice';
import Clip from '../Clip';
import type { Clip as ClipType } from '../clipQueueSlice';

interface QueueProps {
  card?: boolean;
  wrapper?: (props: PropsWithChildren<object>) => ReactElement;
  filteredClips?: ClipType[];
  reorderable?: boolean;
}

function Queue({ wrapper, card, filteredClips, reorderable = true }: QueueProps) {
  const dispatch = useAppDispatch();
  const allClips = useAppSelector(selectQueueClips);
  const clips = filteredClips ?? allClips;
  const showDragHints = useAppSelector(selectShowQueueDragHints);
  const highlightRedemptionSubmissions = useAppSelector(selectHighlightRedemptionSubmissions);
  const [draggedClipId, setDraggedClipId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    position: 'before' | 'after';
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [dragActionZonesActive, setDragActionZonesActive] = useState(false);
  const [showActionHints, setShowActionHints] = useState(false);
  const [playerBounds, setPlayerBounds] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const dragOccurred = useRef(false);
  const dragResetTimeout = useRef<number | undefined>(undefined);
  const actionZoneTimeout = useRef<number | undefined>(undefined);
  const autoScrollFrame = useRef<number | undefined>(undefined);
  const geometryFrame = useRef<number | undefined>(undefined);
  const pendingDragY = useRef<number | null>(null);
  const cachedItems = useRef<Array<{
    element: HTMLElement;
    bounds: { top: number; bottom: number; left: number; width: number; height: number };
  }>>([]);
  const dragPointerY = useRef<number | null>(null);
  const dropTargetRef = useRef(dropTarget);
  dropTargetRef.current = dropTarget;
  const queueRef = useRef<HTMLDivElement | null>(null);
  const Wrapper = wrapper ?? Fragment;

  const stopAutoScroll = () => {
    dragPointerY.current = null;
    if (autoScrollFrame.current !== undefined) {
      window.cancelAnimationFrame(autoScrollFrame.current);
      autoScrollFrame.current = undefined;
    }
  };

  const handleClipClick = (clipId: string) => () => {
    if (dragOccurred.current) {
      dragOccurred.current = false;
      return;
    }
    dispatch(currentClipReplaced(clipId));
  };

  const handleClipRemove = (clipId: string) => () => dispatch(queueClipRemoved(clipId));
  const handleDragStart = (clipId: string) => (event: DragEvent<HTMLDivElement>) => {
    if (actionZoneTimeout.current) window.clearTimeout(actionZoneTimeout.current);

    if (!reorderable) return;

    setDragActionZonesActive(false);
    setShowActionHints(false);

    dragOccurred.current = true;

    if (dragResetTimeout.current) window.clearTimeout(dragResetTimeout.current);

    setDraggedClipId(clipId);
    setDropTarget(null);
    setDragActionZonesActive(true);

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', clipId);
    event.dataTransfer.setData('application/x-etf-queue-clip', clipId);

    const preview = event.currentTarget.cloneNode(true) as HTMLDivElement;
    const { width, height } = event.currentTarget.getBoundingClientRect();

    Object.assign(preview.style, {
      position: 'fixed',
      top: '-10000px',
      left: '-10000px',
      width: `${width}px`,
      height: `${height}px`,
      opacity: '0.94',
      transform: 'scale(1.02)',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.18)',
      borderRadius: '10px',
      pointerEvents: 'none',
    });

    document.body.appendChild(preview);

    event.dataTransfer.setDragImage(preview, event.clientX - event.currentTarget.getBoundingClientRect().left, event.clientY - event.currentTarget.getBoundingClientRect().top);

    window.setTimeout(() => preview.remove(), 0);

    const player = document.querySelector<HTMLElement>('.queue-player-surface, .player-box');
    const bounds = player?.getBoundingClientRect();

    setPlayerBounds(bounds ? { top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height } : null);

    if (showDragHints) {
      actionZoneTimeout.current = window.setTimeout(() => setShowActionHints(true), 500);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  useEffect(() => {
    if (!reorderable || !draggedClipId) return;

    const autoScroll = () => {
      autoScrollFrame.current = undefined;
      const root = queueRef.current;
      const pointerY = dragPointerY.current;
      if (!root || pointerY === null) return;

      let viewport = root.parentElement;
      while (viewport) {
        const overflowY = window.getComputedStyle(viewport).overflowY;
        const isQueueViewport = viewport.classList.contains('mantine-ScrollArea-viewport');
        if (
          viewport.scrollHeight > viewport.clientHeight &&
          (isQueueViewport || overflowY === 'auto' || overflowY === 'scroll')
        ) {
          break;
        }
        viewport = viewport.parentElement;
      }

      if (!viewport) return;

      const bounds = viewport.getBoundingClientRect();
      const edgeSize = 48;
      let distanceFromEdge = 0;
      let direction = 0;

      if (pointerY < bounds.top + edgeSize) {
        direction = -1;
        distanceFromEdge = bounds.top + edgeSize - pointerY;
      } else if (pointerY > bounds.bottom - edgeSize) {
        direction = 1;
        distanceFromEdge = pointerY - (bounds.bottom - edgeSize);
      }

      if (!direction) return;

      const speed = Math.max(2, Math.ceil((distanceFromEdge / edgeSize) * 16));
      const previousScrollTop = viewport.scrollTop;
      viewport.scrollTop += direction * speed;
      if (viewport.scrollTop !== previousScrollTop) {
        const scrollDelta = viewport.scrollTop - previousScrollTop;
        cachedItems.current.forEach(({ bounds }) => {
          bounds.top -= scrollDelta;
          bounds.bottom -= scrollDelta;
        });
        setDropTarget((current) => current ? { ...current, top: current.top - scrollDelta } : current);
        autoScrollFrame.current = window.requestAnimationFrame(autoScroll);
      }
    };

    const scheduleAutoScroll = () => {
      if (autoScrollFrame.current === undefined) {
        autoScrollFrame.current = window.requestAnimationFrame(autoScroll);
      }
    };

    const onDocumentDragOver = (event: globalThis.DragEvent) => {
      const root = queueRef.current;

      if (!root || !root.contains(event.target as Node)) {
        dragPointerY.current = null;
        return;
      }

      event.preventDefault();

      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      dragPointerY.current = event.clientY;
      pendingDragY.current = event.clientY;
      scheduleAutoScroll();
      if (geometryFrame.current !== undefined) return;
      geometryFrame.current = window.requestAnimationFrame(() => {
        geometryFrame.current = undefined;
        const pointerY = pendingDragY.current;
        if (pointerY === null) return;

        const elements = Array.from(root.querySelectorAll<HTMLElement>('[draggable="true"]'));
        const previous = cachedItems.current;
        const orderChanged = elements.length !== previous.length
          || elements.some((element, index) => element !== previous[index].element);

        if (orderChanged) {
          cachedItems.current = elements
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return {
                element,
                bounds: { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height },
              };
            })
            .filter(({ bounds }) => bounds.width > 0 && bounds.height > 0)
            .sort((a, b) => a.bounds.top - b.bounds.top || a.bounds.left - b.bounds.left);
        }

        const items = cachedItems.current;
        if (!items.length) return;
        const target = items.find(({ bounds }) => pointerY < bounds.top + bounds.height / 2) ?? items[items.length - 1];
        const targetIndex = items.indexOf(target);
        const clip = clips[targetIndex];
        if (!clip) return;

        const position = pointerY < target.bounds.top + target.bounds.height / 2 ? 'before' : 'after';
        const top = position === 'before' ? target.bounds.top - 1.5 : target.bounds.bottom - 1.5;
        setDropTarget((current) => current?.id === clip.id && current.position === position && current.top === top
          ? current
          : { id: clip.id, position, top, left: target.bounds.left + 8, width: Math.max(0, target.bounds.width - 16) });
      });
    };

    const onDocumentDrop = (event: globalThis.DragEvent) => {
      const root = queueRef.current;
      const currentDropTarget = dropTargetRef.current;
      if (event.defaultPrevented || !root || !root.contains(event.target as Node) || !currentDropTarget) return;
      event.preventDefault();
      const sourceId = draggedClipId ?? event.dataTransfer?.getData('text/plain');
      if (sourceId && sourceId !== currentDropTarget.id) {
        dispatch(queueItemsReordered({ sourceId, targetId: currentDropTarget.id, position: currentDropTarget.position }));
      }
      setDraggedClipId(null);
      setDropTarget(null);
      setDragActionZonesActive(false);
      setShowActionHints(false);
      stopAutoScroll();
    };

    const ownerDocument = queueRef.current?.ownerDocument ?? document;
    const invalidateGeometry = () => {
      cachedItems.current = [];
    };
    ownerDocument.addEventListener('dragover', onDocumentDragOver);
    ownerDocument.addEventListener('drop', onDocumentDrop);
    ownerDocument.addEventListener('scroll', invalidateGeometry, true);
    ownerDocument.defaultView?.addEventListener('resize', invalidateGeometry);

    return () => {
      ownerDocument.removeEventListener('dragover', onDocumentDragOver);
      ownerDocument.removeEventListener('drop', onDocumentDrop);
      ownerDocument.removeEventListener('scroll', invalidateGeometry, true);
      ownerDocument.defaultView?.removeEventListener('resize', invalidateGeometry);
      if (geometryFrame.current !== undefined) {
        window.cancelAnimationFrame(geometryFrame.current);
        geometryFrame.current = undefined;
      }
      pendingDragY.current = null;
      cachedItems.current = [];
      stopAutoScroll();
    };
  }, [reorderable, draggedClipId, clips, dispatch]);

  const handleDrop = (targetId: string) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const sourceId = draggedClipId ?? event.dataTransfer.getData('text/plain');

    if (sourceId && sourceId !== targetId) {
      dispatch(queueItemsReordered({ sourceId, targetId, position: dropTarget?.id === targetId ? dropTarget.position : 'before' }));
    }

    setDraggedClipId(null);
    setDropTarget(null);
    setDragActionZonesActive(false);
    setShowActionHints(false);
    stopAutoScroll();

    if (actionZoneTimeout.current) window.clearTimeout(actionZoneTimeout.current);

    dragResetTimeout.current = window.setTimeout(() => {
      dragOccurred.current = false;
    }, 200);
  };

  const handleActionDrop = (action: 'play' | 'remove') => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const sourceId = event.dataTransfer.getData('application/x-etf-queue-clip');

    if (sourceId) {
      dispatch(action === 'play' ? currentClipReplaced(sourceId) : queueClipRemoved(sourceId));
    }

    setDragActionZonesActive(false);
    setShowActionHints(false);
    setDraggedClipId(null);
    setDropTarget(null);

    stopAutoScroll();

    if (actionZoneTimeout.current) window.clearTimeout(actionZoneTimeout.current);
  };

  return (
    <div ref={queueRef} style={{ display: 'contents', userSelect: 'none', WebkitUserSelect: 'none' }}>
      {clips.map((clip) => (
        <Wrapper key={clip.id}>
          <Clip
            platform={clip.Platform || undefined}
            key={clip.id}
            clipId={clip.id}
            card={card}
            queueIndex={clip.seq}
            draggable={reorderable}
            onDragStart={reorderable ? handleDragStart(clip.id) : undefined}
            onDragOver={reorderable ? handleDragOver : undefined}
            onDrop={reorderable ? handleDrop(clip.id) : undefined}
            onDragEnd={() => {
              setDraggedClipId(null);
              setDropTarget(null);
              setDragActionZonesActive(false);
              setShowActionHints(false);
              stopAutoScroll();
              if (actionZoneTimeout.current) window.clearTimeout(actionZoneTimeout.current);
              if (!dragResetTimeout.current) {
                dragResetTimeout.current = window.setTimeout(() => {
                  dragOccurred.current = false;
                }, 200);
              }
            }}
            className={[
              draggedClipId === clip.id ? 'queue-item--dragging' : '',
              highlightRedemptionSubmissions && clip.submissionSource ? `queue-item--${clip.submissionSource}` : '',
            ].filter(Boolean).join(' ')}
            onClick={handleClipClick(clip.id)}
            onCrossClick={handleClipRemove(clip.id)}
          />
        </Wrapper>
      ))}
      {dropTarget && draggedClipId && draggedClipId !== dropTarget.id && (
        <div
          className="queue-drop-indicator"
          style={{ top: dropTarget.top, left: dropTarget.left, width: dropTarget.width }}
          aria-hidden="true"
        />
      )}
      {dragActionZonesActive && playerBounds && createPortal(
        <>
          <div
            className={`queue-drag-action-zone queue-drag-play-zone${showActionHints ? '' : ' queue-drag-hints-hidden'}`}
            style={{
              position: 'fixed',
              top: playerBounds.top,
              left: playerBounds.left,
              width: playerBounds.width,
              height: playerBounds.height,
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleActionDrop('play')}
          >
            {showActionHints && (
              <span className="queue-drag-play-copy">
                <span className="queue-drag-play-label">Drop to play</span>
                <span className="queue-drag-settings-hint">
                  You can hide these hints in Queue &amp; Playback settings
                </span>
              </span>
            )}
          </div>
          <div
            className={`queue-drag-action-zone queue-drag-remove-zone${showActionHints ? '' : ' queue-drag-hints-hidden'}`}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 'min(25px, max(22px, 3.5vw))',
              height: '100vh',
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleActionDrop('remove')}
          >
            {showActionHints && <>
              <span className="queue-drag-remove-badge">
                <IconTrash size={22} stroke={2} />
              </span>
              <span className="queue-drag-remove-label">Drop to remove</span>
            </>}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

export default Queue;
