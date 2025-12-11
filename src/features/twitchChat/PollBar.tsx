import { Box, Group, Text, Transition } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectPollActive, selectPollCounts, pollVoteRecorded, pollToggled } from './pollSlice';

const PollBar = () => {
  const dispatch = useAppDispatch();
  const active = useAppSelector(selectPollActive);
  const { yea, nay } = useAppSelector(selectPollCounts);
  const total = yea + nay;
  const yeaPct = total > 0 ? Math.round((yea / total) * 100) : 0;
  const nayPct = total > 0 ? 100 - yeaPct : 0;

  const handleClose = () => {
    dispatch(pollToggled());
  };

  return (
    <Transition mounted={active} transition="slide-up" duration={260} timingFunction="ease-out">
      {(styles) => (
        <Box
          style={styles}
          sx={(theme) => ({
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 12,
            zIndex: 1200,
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: 'center',
          })}
        >
          <Box
            sx={(theme) => ({
              width: '90%',
              maxWidth: 960,
              background: theme.colorScheme === 'dark'
                ? 'rgba(21, 24, 28, 0.92)'
                : 'rgba(255, 255, 255, 0.94)',
              border: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]}`,
              borderRadius: 12,
              boxShadow: theme.shadows.lg,
              overflow: 'visible',
              position: 'relative',
              pointerEvents: 'auto',
              backdropFilter: 'blur(6px)',
            })}
          >
            <Box sx={{ position: 'relative', padding: '10px 14px 0' }}>
              <Box
                sx={(theme) => ({
                  position: 'relative',
                  height: 28,
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[1],
                  border: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]}`,
                })}
              >
                <Box
                  sx={(theme) => ({
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${total > 0 ? yeaPct : 50}%`,
                    transition: 'width 300ms ease',
                    background: `linear-gradient(90deg, ${theme.colors.green[5]}, ${theme.colors.green[7]})`,
                    boxShadow: `0 0 12px ${theme.colors.green[8]}55`,
                    animation: 'pollGlowYea 2.4s ease-in-out infinite',
                    transformOrigin: 'left center',
                  })}
                />
                <Box
                  sx={(theme) => ({
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: `${total > 0 ? nayPct : 50}%`,
                    transition: 'width 300ms ease',
                    background: `linear-gradient(90deg, ${theme.colors.red[7]}, ${theme.colors.red[5]})`,
                    boxShadow: `0 0 12px ${theme.colors.red[8]}55`,
                    animation: 'pollGlowNay 2.4s ease-in-out infinite',
                    transformOrigin: 'right center',
                  })}
                />
                <Text
                  weight={800}
                  size="sm"
                  sx={(theme) => ({
                    position: 'absolute',
                    left: 10,
                    top: 2,
                    textShadow: '0 1px 3px rgba(0,0,0,0.55)',
                    color: theme.colorScheme === 'dark' ? theme.colors.teal[1] : theme.colors.gray[7],
                  })}
                >
                  {total > 0 ? `${yeaPct}%` : ''}
                </Text>
                <Text
                  weight={800}
                  size="sm"
                  sx={(theme) => ({
                    position: 'absolute',
                    right: 10,
                    top: 2,
                    textShadow: '0 1px 3px rgba(0,0,0,0.55)',
                    color: theme.colorScheme === 'dark' ? theme.colors.orange[2] : theme.colors.gray[7],
                  })}
                >
                  {total > 0 ? `${nayPct}%` : ''}
                </Text>
              </Box>

              <Group spacing="lg" position="apart" align="stretch">
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 56 }}>
                  <Text weight={700} size="sm" color="green">
                    Yea
                  </Text>
                  <Text size="xs" color="dimmed">
                    {yea} vote{yea === 1 ? '' : 's'}
                  </Text>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 56, alignItems: 'flex-end' }}>
                  <Text weight={700} size="sm" color="red">
                    Nay
                  </Text>
                  <Text size="xs" color="dimmed">
                    {nay} vote{nay === 1 ? '' : 's'}
                  </Text>
                </Box>
              </Group>
            </Box>
            <Box
              sx={(theme) => ({
                position: 'absolute',
                left: '50%',
                bottom: -1,
                transform: 'translateX(-50%)',
                width: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'auto',
              })}
            >
              <Text size="xs" color="dimmed" weight={800} sx={{ whiteSpace: 'nowrap', textAlign: 'center', width: '100%' }}>
                {total > 0 ? `Total votes: ${total}` : 'Type VoteYea / VoteNay to vote'}
              </Text>
              <Box
                role="button"
                aria-label="Close poll"
                onClick={handleClose}
                sx={(theme) => ({
                  marginTop: 6,
                  width: 36,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  borderTopLeftRadius: 999,
                  borderTopRightRadius: 999,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  boxShadow: 'none',
                  color: theme.colorScheme === 'dark' ? theme.colors.gray[3] : theme.colors.dark[6],
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  transition: 'background 120ms ease, box-shadow 120ms ease, border 120ms ease',
                  '&:hover': {
                    background: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
                    border: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]}`,
                    boxShadow: theme.shadows.xs,
                    color: theme.colorScheme === 'dark' ? theme.white : theme.colors.dark[7],
                  },
                })}
              >
                <IconX size={10} stroke={2.2} />
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Transition>
  );
};

export default PollBar;
