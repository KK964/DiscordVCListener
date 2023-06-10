import type { Client, CommandInteraction } from 'discord.js';
import { leaveChannel } from '../audio/joinChannel';
import { clearUsers } from '../audio/usersToRecord';
import type { BaseCommand } from '../commands';
import { mergeAudioFiles } from '../utils/audioMerger';
import { deleteAudioFiles, packageAudioFiles } from '../utils/audioPackager';

export const leaveCommand: BaseCommand = {
  command: 'leave',
  data: {
    name: 'leave',
    description: 'Leave the voice channel',
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

    const success = await leaveChannel(guild);
    if (!success) {
      return interaction.followUp({
        content: 'There was an error leaving the channel!',
        ephemeral: true,
      });
    }

    clearUsers();

    // Give time for the bot to clear leftover audio files
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 500);
    });

    await mergeAudioFiles();

    await packageAudioFiles();

    await interaction.followUp({
      content: 'Exported audio files!',
      files: ['recordings.7z'],
    });

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 10000);
    });

    deleteAudioFiles();
    return null;
  },
};
