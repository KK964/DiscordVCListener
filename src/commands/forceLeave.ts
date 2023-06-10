import type { Client, CommandInteraction } from 'discord.js';
import { clearUsers } from '../audio/usersToRecord';
import type { BaseCommand } from '../commands';
import { deleteAudioFiles } from '../utils/audioPackager';

export const forceLeaveCommand: BaseCommand = {
  command: 'forceleave',
  data: {
    name: 'forceleave',
    description: 'Force leave the voice channel, and delete all audio files',
  },
  execute: async (interaction: CommandInteraction, _client: Client) => {
    await interaction.deferReply({ ephemeral: true });
    const { guild } = interaction;

    if (!guild) {
      return interaction.followUp({
        content: 'You can only use this command inside a server!',
        ephemeral: true,
      });
    }

    const voiceChannel = guild.members.me?.voice?.channel;

    if (!voiceChannel) {
      return interaction.followUp({
        content: 'I am not in a voice channel!',
        ephemeral: true,
      });
    }

    await guild.members.me?.voice.disconnect();

    clearUsers();

    // Give time for the bot to process last audio streams
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 500);
    });

    await interaction.followUp({
      content: 'Left voice channel, and deleted all audio files!',
    });

    // Delete all audio files after 10 seconds
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 10000);
    });

    deleteAudioFiles();
    return null;
  },
};
