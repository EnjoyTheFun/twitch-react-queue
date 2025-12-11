import { Container, Stack, Title, Group, Card, Text, Table, Box, useMantineTheme, Button } from '@mantine/core';
import { IconRefresh, IconBug } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectTopNSubmitters, selectWatchedCount, selectWatchedCounts, resetWatchedCounts, setWatchedCounts, selectTotalMediaWatched } from '../clipQueueSlice';

function LeaderboardPage() {
  const dispatch = useAppDispatch();
  const theme = useMantineTheme();
  const totalWatched = useAppSelector(selectWatchedCount);
  const totalMediaWatched = useAppSelector(selectTotalMediaWatched);
  const watchedCounts = useAppSelector(selectWatchedCounts);
  const topSubmitters = useAppSelector(selectTopNSubmitters(100));

  const totalSubmitters = Object.keys(watchedCounts).filter(username => {
    const uname = username.toLowerCase();
    return uname !== 'import*' && !uname.includes('(r/lsf)');
  }).length;

  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return '';
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all watched counts?')) {
      dispatch(resetWatchedCounts());
    }
  };

  return (
    <Container size="lg" py="xl">
      <Stack spacing="lg">
        <Group position="apart" align="flex-start">
          <div>
            <Title order={1}>Submitter Leaderboard</Title>
            <Text color="dimmed" mt="xs">
              Top submitters ranked by number of submitted media watched
            </Text>
          </div>
          <Group spacing="xs">
            <Button
              leftIcon={<IconRefresh size={16} />}
              variant="default"
              size="sm"
              onClick={handleReset}
              title="Reset all watched counts"
            >
              Reset
            </Button>
          </Group>
        </Group>

        <Card withBorder radius="md" p="lg" bg={theme.colorScheme === 'dark' ? 'dark.7' : 'gray.0'}>
          <Group position="apart" mb="md">
            <div>
              <Text size="sm" color="dimmed" weight={500}>
                Media watched per session
              </Text>
              <Title order={2}>{totalWatched}</Title>
            </div>
            <div>
              <Text size="sm" color="dimmed" weight={500}>
                Total media watched
              </Text>
              <Title order={2}>{totalMediaWatched ?? 0}</Title>
            </div>
            <div>
              <Text size="sm" color="dimmed" weight={500}>
                Total submitters
              </Text>
              <Title order={2}>{totalSubmitters}</Title>
            </div>
          </Group>
        </Card>

        {topSubmitters && topSubmitters.length > 0 ? (
          <Card withBorder radius="md" p="lg">
            <Stack spacing="md">
              <Box
                sx={{
                  maxHeight: 'calc(100vh - 400px)',
                  minHeight: '400px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '4px',
                    '&:hover': {
                      background: theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                    },
                  },
                }}
              >
                <Table striped highlightOnHover>
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Rank</th>
                      <th>Submitter</th>
                      <th style={{ textAlign: 'right', width: '100px' }}>Watched</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSubmitters.slice(0, 100).map((submitter, index) => {
                      const medalEmoji = getMedalEmoji(index);
                      return (
                        <tr key={submitter.username}>
                          <td>
                            <Group spacing={6}>
                              <Text size="sm" weight={index < 3 ? 700 : 500}>{index + 1}</Text>
                              {medalEmoji && <Text size="sm">{medalEmoji}</Text>}
                            </Group>
                          </td>
                          <td>
                            <Text sx={{ textTransform: 'capitalize' }} weight={index < 3 ? 600 : 400}>
                              {submitter.username}
                            </Text>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Text weight={index < 3 ? 700 : 500}>{submitter.count}</Text>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Box>
            </Stack>
          </Card>
        ) : (
          <Card withBorder radius="md" p="lg">
            <Text align="center" color="dimmed" py="xl">
              No media watched yet. Start watching to populate the leaderboard!
            </Text>
          </Card>
        )}
      </Stack>
    </Container>
  );
}

export default LeaderboardPage;
