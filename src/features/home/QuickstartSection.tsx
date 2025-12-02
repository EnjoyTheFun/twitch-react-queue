import { Title, Text, Box } from "@mantine/core";

function QuickstartSection() {
  return (
    <Box mb="md">
      <Title order={2}>Quickstart</Title>
      <Text component="p">
        Simply <Text component="span" weight="bold">Login with Twitch</Text>. Twitch will ask you to allow the app to get your username and read chat.
        Any information received from Twitch is not sent anywhere but Twitch. By default the app connects to your channel's chat (you can change it later).
        Then <Text component="span" weight="bold">open the queue</Text> and wait for media links to be posted in chat.
      </Text>
    </Box>
  );
}

export default QuickstartSection;
