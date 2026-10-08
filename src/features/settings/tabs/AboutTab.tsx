import { Box, Stack, Text } from '@mantine/core';
import { APP_VERSION } from '../../../common/utils';
import type { SettingsTabProps } from './types';

function AboutTab(_props: SettingsTabProps) {
  return (
    <Stack spacing="md">
      <Box>
        <Text size="lg" weight={600} mb="xs">React Queue v{APP_VERSION}</Text>
        <Text size="sm" color="dimmed">
          A Twitch-integrated media queue for streamers and content creators
        </Text>
      </Box>

      <Box>
        <Text size="sm" weight={500} mb={4}>Built by</Text>
        <Text size="sm" color="dimmed">
          <a href="https://github.com/EnjoyTheFun" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
            EnjoyTheFun
          </a>
        </Text>
      </Box>

      <Box>
        <Text size="sm" weight={500} mb={4}>Based on</Text>
        <Text size="sm" color="dimmed">
          <a href="https://jakemiki.me/twitch-clip-queue/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Clip Queue
          </a>
          {' '}by{' '}
          <a href="https://github.com/jakemiki/twitch-clip-queue" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
            jakemiki
          </a>
        </Text>
        <Text size="xs" color="dimmed" mt="xs">
          React Queue is a custom fork that extends the original Clip Queue project with support for multiple media platforms,
          enhanced moderation features, and additional customization options.
        </Text>
      </Box>

      <Box>
        <Text size="sm" weight={500} mb={4}>Source Code</Text>
        <Text size="sm" color="dimmed">
          <a href="https://github.com/EnjoyTheFun/twitch-react-queue" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
            View on GitHub
          </a>
        </Text>
      </Box>

      <Box>
        <Text size="sm" weight={500} mb={4}>License</Text>
        <Text size="xs" color="dimmed">
          This project is open source and available under the MIT License.
        </Text>
      </Box>
    </Stack>
  );
}

export default AboutTab;
