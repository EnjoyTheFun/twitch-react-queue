import { Container, Grid, Group, Stack, ScrollArea } from '@mantine/core';
import Player from '../Player';
import PlayerButtons from '../PlayerButtons';
import PlayerTitle from '../PlayerTitle';
import Queue from '../Queue';
import QueueControlPanel from '../QueueControlPanel';

function ClassicLayout() {
  return (
    <Container fluid py="md" sx={{ height: '100%' }}>
      <Grid sx={{ height: '100%' }} columns={24}>
        <Grid.Col xs={14} sm={15} md={15} lg={17} xl={19} span={19}>
          <Stack justify="flex-start" spacing="xs" sx={{ height: '100%' }}>
            <Player />
            <Group position="apart" sx={{ alignItems: 'flex-start', width: '100%' }}>
              <PlayerTitle />
              <PlayerButtons />
            </Group>
          </Stack>
        </Grid.Col>
        <Grid.Col xs={10} sm={9} md={9} lg={7} xl={5} span={5} sx={{ height: '100%' }}>
          <Stack justify="flex-start" sx={{ height: '100%', maxHeight: '100%', gap: 3 }}>
            <QueueControlPanel />
            <ScrollArea sx={{ '.mantine-ScrollArea-viewport > div': { display: 'block !important' } }}>
              <Group direction="column" sx={{ height: '100%', gap: 3 }}>
                <Queue />
              </Group>
            </ScrollArea>
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}

export default ClassicLayout;
