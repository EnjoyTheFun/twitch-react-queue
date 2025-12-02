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
          Supports media from Twitch, Kick, YouTube, Streamable, TikTok, Reddit and X/Twitter.
        </List.Item>

        <List.Item>
          <strong>Twitch chat integration</strong>
          <br />
          Accepts media links from chat and provides moderator chat commands (default prefix <Code>!q</Code>) to control the queue.
        </List.Item>

        <List.Item>
          <strong>Layouts & player customization</strong>
          <br />
          Drag to resize the player, configure autoplay delay and playback speed.
        </List.Item>

        <List.Item>
          <strong>Queue management</strong>
          <br />
          Manage queued items, blur thumbnails, highlight entries and play items out of order.
        </List.Item>

        <List.Item>
          <strong>Persistent memory</strong>
          <br />
          Deduplicates remembered media and lets you configure how long watched media are kept before they can be re-added.
        </List.Item>

        <List.Item>
          <strong>Import media</strong>
          <br />
          Paste URLs to bulk-import media or use the import via API feature to add media from Discord or Reddit.
        </List.Item>

        <List.Item>
          <strong>Chat voting</strong>
          <br />
          When enabled, viewers can cast unique votes (<Code>!q voteup</Code> OR <Code>!q voteskip</Code>) to upvote or skip media respectively.
        </List.Item>

        <List.Item>
          <strong>Submitter leaderboard</strong>
          <br />
          Optional leaderboard showing top submitters with animated username colors.
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
              <Code>!q next</Code> - play next item in queue
            </List.Item>
            <List.Item>
              <Code>!q [open/close]</Code> - open or close queue for new submissions
            </List.Item>
            <List.Item>
              <Code>!q clear</Code> - clear current queue
            </List.Item>
            <List.Item>
              <Code>!q purgememory</Code> - purge media memory
            </List.Item>
            <List.Item>
              <Code>!q autoplay [on|off]</Code> - toggle autoplay behavior
            </List.Item>
            <List.Item>
              <Code>!q limit &lt;number&gt;</Code> - set media limit to <Code>number</Code>
            </List.Item>
            <List.Item>
              <Code>!q remove &lt;URL&gt;</Code> - remove a specific media item with <Code>URL</Code>
            </List.Item>
            <List.Item>
              <Code>!q removeidx &lt;index&gt;</Code> - remove media item with <Code>index</Code>
            </List.Item>
            <List.Item>
              <Code>!q bump &lt;index&gt;</Code> - bump the media item with <Code>index</Code> to the top and highlight it
            </List.Item>
            <List.Item>
              <Code>!q ht &lt;index&gt;</Code> - highlight the media item with <Code>index</Code>
            </List.Item>
            <List.Item>
              <Code>!q providers [&lt;list&gt;|all|none]</Code> - set enabled media providers to <Code>[providers]</Code> or all/none
            </List.Item>
            <List.Item>
              <Code>!q skip</Code> - immediate skip of the current media item
            </List.Item>
            <List.Item>
              <Code>!q replace &lt;URL&gt;</Code> - replace the current media item with a new media item with <Code>URL</Code>
            </List.Item>
            <List.Item>
              <Code>!q add &lt;URL&gt;</Code> - add a new media item to the queue with <Code>URL</Code> (mod only even if queue is closed)
            </List.Item>
            <List.Item>
              <Code>!q voteskip</Code> - (public) vote to skip
            </List.Item>
            <List.Item>
              <Code>!q voteup &lt;index&gt;</Code> or <Code>!q up &lt;index&gt;</Code> - (public) vote to upvote the item at queue position <Code>index</Code>. Adds your name as a submitter and may boost the item's position in the queue.
            </List.Item>
            <List.Item>
              <Code>!q block &lt;username&gt;</Code> - block a user (prevents submissions and using commands)
            </List.Item>
            <List.Item>
              <Code>!q unblock &lt;username&gt;</Code> - unblock a user
            </List.Item>
            <List.Item>
              <Code>!q blacklist &lt;channel&gt;</Code> - blacklist a creator/channel (blocks media originating from this creator)
            </List.Item>
            <List.Item>
              <Code>!q unblacklist &lt;channel&gt;</Code> - remove a creator/channel from the blacklist
            </List.Item>
          </List>
          <Text size="sm" color="dimmed" mt="sm">Note: some commands are moderator-only; prefix may vary by configuration.</Text>
        </Box>
      </Spoiler>
    </Box>
  );
}

export default FeaturesSection;
