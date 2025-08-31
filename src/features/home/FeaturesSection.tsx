import { Title, List, ThemeIcon, Code, Box, Spoiler, Text } from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';

function FeaturesSection() {
  return (
    <Box mb="md">
      <Title order={2}>Features</Title>
      <List
        mt="md"
        spacing="sm"
        icon={
          <ThemeIcon size={26} radius="xl">
            <IconCircleCheck size={18} />
          </ThemeIcon>
        }
      >
        <List.Item>
          <strong>Multi-provider media support</strong>
          <br />
          Supports media from Twitch, Kick, YouTube, Streamable, TikTok and X(Twitter).
        </List.Item>

        <List.Item>
          <strong>Twitch chat integration</strong>
          <br />
          Accepts media/clip links from chat and exposes moderator commands (default prefix <Code>!q</Code>) for queue control.
        </List.Item>

        <List.Item>
          <strong>Queue management</strong>
          <br />
          Manage all media, add blur to thumbnails, highlight items and play them out of order.
        </List.Item>

        <List.Item>
          <strong>Persistent memory</strong>
          <br />
          Deduplicates remembered media and lets you configure how long watched media are kept before they can be re-added.
        </List.Item>

        <List.Item>
          <strong>Import media</strong>
          <br />
          Paste URLs to bulk-import media or use the import via API feature (whitelist only).
        </List.Item>

        <List.Item>
          <strong>Skip voting</strong>
          <br />
          When enabled, viewers can cast unique votes (<Code>!q voteskip</Code>) to skip the current media.
        </List.Item>

        <List.Item>
          <strong>Submitter leaderboard</strong>
          <br />
          Toggleable leaderboard for top submitters and animated username color styling.
        </List.Item>

        <List.Item>
          <strong>Privacy-first</strong>
          <br />
          Runs locally in your browser, no third-party data collection by default! You control persistence and settings.
        </List.Item>
      </List>

      <Spoiler maxHeight={0} showLabel="Show chat commands" hideLabel="Hide chat commands" mt="md">
        <Box mt="sm" pb="md">
          <Text weight={600} mb="xs">Chat commands</Text>
          <List spacing="xs">
            <List.Item>
              <Code>!q next</Code> - play next clip in queue
            </List.Item>
            <List.Item>
              <Code>!q [open/close]</Code> - open or close queue for new submissions
            </List.Item>
            <List.Item>
              <Code>!q clear</Code> - clear current queue
            </List.Item>
            <List.Item>
              <Code>!q purgememory</Code> - purge clip memory
            </List.Item>
            <List.Item>
              <Code>!q autoplay [on|off]</Code> - toggle autoplay behavior
            </List.Item>
            <List.Item>
              <Code>!q limit &lt;number&gt;</Code> - set clip limit to <Code>number</Code>
            </List.Item>
            <List.Item>
              <Code>!q remove &lt;URL&gt;</Code> - remove a specific clip by <Code>URL</Code>
            </List.Item>
            <List.Item>
              <Code>!q removeidx &lt;index&gt;</Code> - remove clip at queue position <Code>index</Code>
            </List.Item>
            <List.Item>
              <Code>!q bump &lt;index&gt;</Code> - bump the clip at position <Code>index</Code> to the top and highlight it
            </List.Item>
            <List.Item>
              <Code>!q ht &lt;index&gt;</Code> - highlight the clip at position <Code>index</Code>
            </List.Item>
            <List.Item>
              <Code>!q providers [&lt;list&gt;|all|none]</Code> - set enabled clip providers to <Code>[providers]</Code> or all/none
            </List.Item>
            <List.Item>
              <Code>!q skip</Code> - immediate skip of the current clip
            </List.Item>
            <List.Item>
              <Code>!q replace &lt;URL&gt;</Code> - replace the current clip with a new clip with <Code>URL</Code>
            </List.Item>
            <List.Item>
              <Code>!q add &lt;URL&gt;</Code> - add a new clip to the queue with <Code>URL</Code> (mod only even if queue is closed)
            </List.Item>
            <List.Item>
              <Code>!q voteskip</Code> - (public) vote to skip
            </List.Item>
          </List>
          <Text size="sm" color="dimmed" mt="sm">Note: some commands are moderator-only; prefix may vary by configuration.</Text>
        </Box>
      </Spoiler>
    </Box>
  );
}

export default FeaturesSection;
