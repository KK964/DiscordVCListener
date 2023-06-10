import type { CommandInteraction, CacheType, Client } from 'discord.js';
import type { BaseCommand } from '../commands';
import { getUsers } from '../audio/usersToRecord';

export const listingToCommand: BaseCommand = {
  command: 'listening_to',
  data: {
    name: 'listening_to',
    description: 'Lists all users the bot is listening to',
  },
  execute: async (interaction: CommandInteraction<CacheType>, _client: Client<boolean>) => {
    const users = getUsers();
    if (users.length === 0) {
      await interaction.reply({ ephemeral: true, content: 'Not listening to anyone in specific' });
      return;
    }

    const userNames = users.map((user) => `<@${user.id}>`).join(', ');
    await interaction.reply({
      ephemeral: true,
      content: `Listening to: ${userNames}`,
      allowedMentions: { users: [] },
    });
  },
};
