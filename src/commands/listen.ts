import { CommandInteraction, ApplicationCommandOptionType, CacheType, Client } from 'discord.js';
import type { BaseCommand } from '../commands';
import { enableRecording, disableRecording } from '../audio/usersToRecord';

export const listenCommand: BaseCommand = {
  command: 'listen',
  data: {
    name: 'listen',
    description: 'Adds or removes a user from the list of users the bot is listening to',
    options: [
      {
        name: 'user',
        description: 'The user to add or remove',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'enable',
        description: 'Whether to enable or disable listening to the user',
        type: ApplicationCommandOptionType.Boolean,
        required: true,
      },
    ],
  },
  execute: async (interaction: CommandInteraction<CacheType>, _client: Client<boolean>) => {
    const user = interaction.options.getUser('user', true);
    const enable = interaction.options.get('enable', true).value as boolean;

    if (enable) {
      enableRecording(user);
    } else {
      disableRecording(user);
    }

    await interaction.reply({
      ephemeral: true,
      content: `${enable ? 'Enabled' : 'Disabled'} recording for <@${user.id}>`,
      allowedMentions: { users: [] },
    });
  },
};
