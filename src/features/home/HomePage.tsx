import { Box, Container, Text, Title } from '@mantine/core';
import MyCredits from '../../common/components/MyCredits';
import FeaturesSection from './FeaturesSection';
import QuickstartSection from './QuickstartSection';
import ScreenshotsSection from './ScreenshotsSection';

function HomePage() {
  return (
    <Container py="md">
      <Box>
        <Title order={1}>React Queue</Title>
        <MyCredits />
        <Text component="p">Queue and play clips, images or social posts from your Twitch chat</Text>
      </Box>
      <QuickstartSection />
      <FeaturesSection />
      <ScreenshotsSection />
      <Box mt="xl" pt="md" sx={(theme) => ({ borderTop: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]}` })}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Box>
            <MyCredits />
            <Text size="xs" color="dimmed" mt={6}>
              Based on{' '}
              <a
                href="https://github.com/jakemiki/twitch-clip-queue"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', color: '#ffffff' }}
              >
                Clip Queue
              </a>
              {' '}by{' '}
              <a
                href="https://github.com/jakemiki"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', color: '#ffffff' }}
              >
                jakemiki
              </a>
            </Text>
          </Box>
          <Text size="xs" color="dimmed" sx={{ whiteSpace: 'nowrap' }}>
            v{process.env.npm_package_version || '1.1.4'}
          </Text>
        </Box>
      </Box>
    </Container>
  );
}

export default HomePage;
