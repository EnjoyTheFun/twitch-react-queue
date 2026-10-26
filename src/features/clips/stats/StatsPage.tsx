import { useState } from 'react';
import { Badge, Box, Button, Card, Container, Group, Modal, Progress, SimpleGrid, Stack, Table, Text, ThemeIcon, Title } from '@mantine/core';
import { IconClock, IconDeviceTv, IconPlayerPlay, IconRefresh, IconUsers } from '@tabler/icons-react';
import { createSelector } from '@reduxjs/toolkit';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { queueCleared, resetWatchedCounts } from '../clipQueueSlice';
import type { Clip } from '../clipQueueTypes';
import { selectTopNSubmitters, selectWatchedCounts, selectWatchedCount, selectTotalMediaWatched } from '../clipQueueSelectors';
import type { RootState } from '../../../app/store';

const selectWatchedHistory = (state: RootState) => state.clipQueue.watchedHistory;
const selectClipsById = (state: RootState) => state.clipQueue.byId;

const selectSessionStats = createSelector(
  [selectWatchedHistory, selectClipsById],
  (watchedHistory, byId) => {
  const watched = [...new Set(watchedHistory)].map((id) => byId[id]).filter((clip): clip is Clip => Boolean(clip));
  const submitters: Record<string, number> = {};
  const platforms: Record<string, number> = {};
  let duration = 0;

  watched.forEach((clip) => {
    clip.submitters?.forEach((name) => {
      const username = name.toLowerCase();
      if (username !== 'import*' && !username.includes('(r/lsf)')) {
        submitters[username] = (submitters[username] || 0) + 1;
      }
    });
    if (clip.Platform) platforms[clip.Platform] = (platforms[clip.Platform] || 0) + 1;
    if (typeof clip.duration === 'number' && Number.isFinite(clip.duration) && clip.duration > 0) duration += clip.duration;
  });

  return {
    watched,
    duration,
    submitters: Object.entries(submitters).sort((a, b) => b[1] - a[1]),
    platforms: Object.entries(platforms).sort((a, b) => b[1] - a[1]),
  };
  }
);

const selectTop100Submitters = selectTopNSubmitters(100);

const formatDuration = (seconds: number) => {
  const roundedSeconds = Math.round(seconds);
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const remainder = roundedSeconds % 60;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${remainder}s`;
  return `${remainder}s`;
};

function StatsPage() {
  const [showResetModal, setShowResetModal] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSessionStats);
  const totalWatched = useAppSelector(selectWatchedCount);
  const totalMediaWatched = useAppSelector(selectTotalMediaWatched);
  const watchedCounts = useAppSelector(selectWatchedCounts);
  const allTimeSubmitters = useAppSelector(selectTop100Submitters);
  const totalSubmitters = Object.keys(watchedCounts).filter((name) => name !== 'import*' && !name.includes('(r/lsf)')).length;
  const maxPlatformCount = session.platforms[0]?.[1] || 1;
  const cards = [
    { label: 'Media this session', value: session.watched.length, icon: IconPlayerPlay, color: 'violet' },
    { label: 'Total media watched', value: totalMediaWatched ?? 0, icon: IconDeviceTv, color: 'blue' },
    { label: 'Watch time this session*', value: formatDuration(session.duration), icon: IconClock, color: 'teal' },
    { label: 'All-time submitters', value: totalSubmitters, icon: IconUsers, color: 'orange' },
  ];

  return (
    <Container size="lg" py="xl">
      <Stack spacing="xl">
        <Group position="apart" align="flex-start">
          <div>
            <Title order={1}>Stats</Title>
            <Text color="dimmed" mt={4}>A snapshot of what your community has been watching</Text>
          </div>
          <Stack spacing="xs" align="flex-end">
            <Button className="modal-cancel-button" leftIcon={<IconRefresh size={16} />} variant="default" size="sm" onClick={() => setShowResetModal(true)}>
              Reset all-time stats
            </Button>
            <Button className="modal-primary-button" size="sm" leftIcon={<IconPlayerPlay size={16} />} onClick={() => setShowNewSessionModal(true)}>
              Start a new session
            </Button>
          </Stack>
        </Group>

        <SimpleGrid cols={4} spacing="md" breakpoints={[{ maxWidth: 900, cols: 2 }, { maxWidth: 480, cols: 1 }]}>
          {cards.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} withBorder radius="md" p="lg">
              <Group position="apart" noWrap>
                <div>
                  <Text size="sm" color="dimmed" weight={500}>{label}</Text>
                  <Title order={2} mt={6}>{value}</Title>
                </div>
                <ThemeIcon size={44} radius="md" color={color} variant="light"><Icon size={22} /></ThemeIcon>
              </Group>
            </Card>
          ))}
        </SimpleGrid>

        <SimpleGrid cols={2} spacing="md" breakpoints={[{ maxWidth: 700, cols: 1 }]}>
          <Card withBorder radius="md" p="lg">
            <Group position="apart" mb="md">
              <div><Title order={3}>Most active submitters</Title><Text size="sm" color="dimmed">Ranked by media watched this session</Text></div>
              <Badge variant="light">{session.submitters.length} people</Badge>
            </Group>
            {session.submitters.length ? (
              <Table highlightOnHover>
                <tbody>{session.submitters.slice(0, 10).map(([name, count], index) => (
                  <tr key={name}>
                    <td><Text weight={600}>{index + 1}. {name}</Text></td>
                    <td style={{ textAlign: 'right' }}><Badge color={index === 0 ? 'violet' : 'gray'}>{count} watched</Badge></td>
                  </tr>
                ))}</tbody>
              </Table>
            ) : <Text color="dimmed" py="xl" align="center">Watch some media to see your session leaders.</Text>}
          </Card>

          <Card withBorder radius="md" p="lg">
            <Group position="apart" mb="md">
              <div><Title order={3}>Media platforms</Title><Text size="sm" color="dimmed">Where this session’s media came from</Text></div>
              <Badge variant="light">{session.watched.length} items</Badge>
            </Group>
            {session.platforms.length ? <Stack spacing="md" mt="xl">
              {session.platforms.map(([platform, count]) => (
                <Box key={platform}>
                  <Group position="apart" mb={6}><Text weight={500}>{platform}</Text><Text size="sm" color="dimmed">{count} · {Math.round(count / session.watched.length * 100)}%</Text></Group>
                  <Progress value={count / maxPlatformCount * 100} color="violet" radius="xl" />
                </Box>
              ))}
            </Stack> : <Text color="dimmed" py="xl" align="center">Platform breakdown appears as you watch media.</Text>}
            {session.duration === 0 && <Text size="xs" color="dimmed" mt="lg">Watch time includes known media durations only.</Text>}
          </Card>
        </SimpleGrid>
        <Text size="xs" color="dimmed" align="right">Session count: {totalWatched}</Text>

        <Card withBorder radius="md" p="lg">
          <Group position="apart" mb="md">
            <div>
              <Title order={3}>All-time leaderboard</Title>
              <Text size="sm" color="dimmed">Top submitters by total media watched</Text>
            </div>
            <Badge variant="light">{totalSubmitters} submitters</Badge>
          </Group>
          {allTimeSubmitters.length ? (
            <Table striped highlightOnHover>
              <thead><tr><th style={{ width: 72 }}>Rank</th><th>Submitter</th><th style={{ textAlign: 'right', width: 120 }}>Watched</th></tr></thead>
              <tbody>{allTimeSubmitters.map((submitter, index) => (
                <tr key={submitter.username}>
                  <td><Text weight={index < 3 ? 700 : 500}>{index + 1}{index === 0 ? ' 🥇' : index === 1 ? ' 🥈' : index === 2 ? ' 🥉' : ''}</Text></td>
                  <td><Text sx={{ textTransform: 'capitalize' }} weight={index < 3 ? 600 : 400}>{submitter.username}</Text></td>
                  <td style={{ textAlign: 'right' }}><Text weight={index < 3 ? 700 : 500}>{submitter.count}</Text></td>
                </tr>
              ))}</tbody>
            </Table>
          ) : <Text color="dimmed" py="xl" align="center">No all-time stats yet. Watch media to populate the leaderboard.</Text>}
        </Card>
      </Stack>

      <Modal opened={showResetModal} onClose={() => setShowResetModal(false)} title="Reset all-time stats" centered>
        <Stack spacing="lg">
          <Text>Are you sure you want to reset all-time submitter stats? Session history and watch-time data will not be deleted.</Text>
          <Group position="right" spacing="sm">
            <Button className="modal-cancel-button" variant="default" onClick={() => setShowResetModal(false)}>Cancel</Button>
            <Button className="modal-cancel-button" color="red" onClick={() => { dispatch(resetWatchedCounts()); setShowResetModal(false); }}>Reset stats</Button>
          </Group>
        </Stack>
      </Modal>
      <Modal opened={showNewSessionModal} onClose={() => setShowNewSessionModal(false)} title="Start a new session" centered>
        <Stack spacing="lg">
          <Text>This clears the current queue and resets session indexing and session stats. Your saved media history and all-time stats will remain.</Text>
          <Group position="right" spacing="sm">
            <Button className="modal-cancel-button" variant="default" onClick={() => setShowNewSessionModal(false)}>Cancel</Button>
            <Button className="modal-primary-button" color="teal" onClick={() => { dispatch(queueCleared()); setShowNewSessionModal(false); }}>Start new session</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

export default StatsPage;
