import {
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
} from '@discordjs/voice';
import type { Guild, GuildChannel } from 'discord.js';

export async function joinChannel(channel: GuildChannel) {
  let connection = getVoiceConnection(channel.guild.id);
  if (connection) return true;

  connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    selfDeaf: false,
    selfMute: true,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
  } catch (error) {
    console.warn(error);
    return false;
  }

  // Attempt to refresh the connection when Discord is being Discord
  connection.on(VoiceConnectionStatus.Disconnected, async (_oldState, _newState) => {
    if (!connection) return;
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
      // May be switching channels
    } catch (error) {
      // The connection is irrecoverable
      connection.destroy();
    }
  });

  return true;
}

export async function leaveChannel(guild: Guild) {
  const connection = getVoiceConnection(guild.id);
  if (!connection) return true;

  connection.destroy();
  return true;
}
