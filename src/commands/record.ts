import {
  ApplicationCommandOptionType,
  Client,
  CommandInteraction,
  GuildChannel,
  GuildMember,
  VoiceBasedChannel,
} from 'discord.js';
import { joinChannel, leaveChannel } from '../audio/joinChannel';
import { startRecordingAudio } from '../audio/recordAudio';
import { enableRecording } from '../audio/usersToRecord';
import type { BaseCommand } from '../commands';

export const recordCommand: BaseCommand = {
  command: 'record',
  data: {
    name: 'record',
    description: 'Enables recording for a user',
    options: [
      {
        name: 'speaker',
        type: ApplicationCommandOptionType.User,
        description: 'The user to record',
        required: false,
      },
      {
        name: 'channel',
        type: ApplicationCommandOptionType.Channel,
        description: 'The channel to listen in',
        required: false,
      },
    ],
  },
  execute: async (interaction: CommandInteraction, _client: Client) => {
    await interaction.deferReply({ ephemeral: true });
    const { guild, member } = interaction;

    if (!guild) {
      return interaction.followUp({
        content: 'You can only use this command inside a server!',
        ephemeral: true,
      });
    }

    let channel = interaction.options.get('channel', false)?.channel as
      | GuildChannel
      | VoiceBasedChannel
      | undefined
      | null;

    if (!channel) {
      channel = (member as GuildMember)?.voice.channel;
    }

    if (!channel) {
      return interaction.followUp({
        content: 'You must be in a voice channel or specify one!',
        ephemeral: true,
      });
    }

    if (!channel.isVoiceBased()) {
      return interaction.followUp({
        content: 'The channel must be a voice channel!',
        ephemeral: true,
      });
    }

    const speaker = interaction.options.get('speaker', false)?.member as GuildMember | undefined;

    if (speaker) {
      if (!speaker.voice.channel) {
        return interaction.followUp({
          content: 'The speaker must be in a voice channel!',
          ephemeral: true,
        });
      }

      enableRecording(speaker.user);

      if (guild.members.me?.voice?.channel?.id === channel.id) {
        return interaction.followUp({
          content: 'Already recording audio in this channel, updating the recorded users!',
          ephemeral: true,
        });
      }
    }

    if (guild.members.me?.voice?.channel) {
      return interaction.followUp({
        content: 'There is already an active recording! Please stop it before starting a new one!',
        ephemeral: true,
      });
    }

    const success = await joinChannel(channel);

    if (!success) {
      return interaction.followUp({
        content: 'There was an error joining the channel!',
        ephemeral: true,
      });
    }

    const recording = await startRecordingAudio(guild);

    if (!recording) {
      await leaveChannel(guild);
      return interaction.followUp({
        content: 'There was an error recording the audio!',
        ephemeral: true,
      });
    }

    return interaction.followUp({
      content: 'Recording audio!',
      ephemeral: true,
    });
  },
};
