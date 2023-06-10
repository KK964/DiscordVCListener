import dotenv from 'dotenv';
dotenv.config();
import { GatewayIntentBits } from 'discord-api-types/v10';
import { Client } from 'discord.js';

import events from 'events';
import { getCommand, hasCommand, init } from './commands';

// Increase the max listeners to avoid issues when dealing with a lot of users talking at once
events.defaultMaxListeners = 1000;

const client = new Client({
  intents: [
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
  ],
});

client.on('ready', async () => {
  console.log('Ready!');

  const guild = client.guilds.cache.get(process.env.DISCORD_GUILD!);
  if (!guild) throw new Error('Guild not found');

  init(guild);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand() || !interaction.guildId) return;
  if (interaction.user.id !== process.env.DISCORD_USER) {
    await interaction.reply({ ephemeral: true, content: 'You are not allowed to use this bot!' });
    return;
  }

  if (!hasCommand(interaction)) {
    await interaction.reply({ ephemeral: true, content: 'Unknown command!' });
    return;
  }

  const handler = getCommand(interaction)!;
  handler.execute(interaction, client);
});

void client.login(process.env.DISCORD_TOKEN);
