import { ActionIcon, Box, Container, Grid, Group, Portal, Stack } from '@mantine/core';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { IconListDetails } from '@tabler/icons-react';
import PlayerButtons from '../PlayerButtons';
import PlayerTitle from '../PlayerTitle';
import Queue from '../Queue';
import QueueControlPanel from '../QueueControlPanel';
import Player from '../Player';

function copyStyles(sourceDoc: Document, targetDoc: Document) {
  Array.from(sourceDoc.styleSheets).forEach((styleSheet) => {
    if (styleSheet.cssRules) {
      // for <style> elements
      const newStyleEl = sourceDoc.createElement('style');

      Array.from(styleSheet.cssRules).forEach((cssRule) => {
        // write the text of each rule into the body of the style element
        newStyleEl.appendChild(sourceDoc.createTextNode(cssRule.cssText));
      });

      targetDoc.head.appendChild(newStyleEl);
    } else if (styleSheet.href) {
      // for <link> elements loading CSS from a URL
      const newLinkEl = sourceDoc.createElement('link');

      newLinkEl.rel = 'stylesheet';
      newLinkEl.href = styleSheet.href;
      targetDoc.head.appendChild(newLinkEl);
    }
  });
}

function Popup({ children }: PropsWithChildren<object>) {
  const containerEl = useMemo(() => document.createElement('div'), []);

  useEffect(() => {
    const popup = window.open('', '', `width=720,height=${window.outerHeight},popup`);
    if (!popup) {
      return;
    }

    const closePopup = () => popup.close();
    window.addEventListener('unload', closePopup);

    popup.document.body.appendChild(containerEl);
    popup.document.title = 'Twitch React Queue — Queue';
    const styleTimeout = window.setTimeout(() => copyStyles(document, popup.document), 100);

    return () => {
      window.clearTimeout(styleTimeout);
      window.removeEventListener('unload', closePopup);
      popup.close();
    };
  }, [containerEl]);

  return <Portal target={containerEl}>{children}</Portal>;
}

function PopupContent() {
  return (
    <Container fluid p="md" sx={{ height: '100%' }}>
      <Stack justify="flex-start" sx={{ height: '100%' }}>
        <Group position="apart" align="flex-start" className="player-meta-group">
          <PlayerTitle className="player-title" />
          <PlayerButtons className="player-buttons" />
        </Group>
        <QueueControlPanel />
        <Grid pt="sm" sx={{ flex: 1, overflow: 'auto', alignContent: 'flex-start' }}>
          <Queue wrapper={({ children }) => <Grid.Col span={12} p={0} className="fullscreen-queue-col">{children}</Grid.Col>} />
        </Grid>
      </Stack>
    </Container>
  );
}

function FullscreenWithPopupLayout() {
  const [popupKey, setPopupKey] = useState(0);

  return (
    <>
      <Box className="fullscreen-player-layout">
        <Player className="fullscreen-player" />
        <ActionIcon
          className="fullscreen-show-queue"
          aria-label="Show queue"
          onClick={() => setPopupKey((key) => key + 1)}
          variant="light"
          size="lg"
        >
          <IconListDetails size={20} />
        </ActionIcon>
      </Box>
      <Popup key={popupKey}>
        <PopupContent />
      </Popup>
    </>
  );
}

export default FullscreenWithPopupLayout;
