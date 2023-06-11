import { EndBehaviorType, VoiceReceiver, getVoiceConnection } from '@discordjs/voice';
import type { Guild, User, VoiceBasedChannel } from 'discord.js';

import { existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream';

import * as prism from 'prism-media';
import { canRecord } from './usersToRecord';

import CONSTANTS from '../utils/constants';

let startTime: number | undefined;

export async function startRecordingAudio(guild: Guild) {
  const connection = getVoiceConnection(guild.id);
  if (!connection) return false;
  startTime = Date.now();
  const receiver = connection.receiver;
  receiver.speaking.on('start', (userId) => {
    const user = guild.client.users.cache.get(userId);
    if (!!user && !canRecord(user)) return;
    createListeningStream(receiver, userId, user);
  });

  ensureRecordingAllUsers(guild.members.me?.voice.channel!);
  return true;
}

function ensureRecordingAllUsers(channel: VoiceBasedChannel) {
  const connection = getVoiceConnection(channel.guild.id);
  if (!connection) return;
  const receiver = connection.receiver;
  channel.members.forEach((member) => {
    try {
      if (member.voice.mute) return;
      if (member.id === channel.guild.members.me?.id) return;
      if (!canRecord(member.user)) return;
      createListeningStream(receiver, member.id, member.user);
    } catch (_) {}
  });
  setTimeout(() => {
    ensureRecordingAllUsers(channel);
  }, 5000);
}

function getUsername(user?: User) {
  if (!user) return 'unknown';
  return encodeURI(user.username + '#' + user.discriminator);
}

function createListeningStream(receiver: VoiceReceiver, userId: string, user?: User) {
  // Check if we're already recording this user; duplicate events can happen sometimes
  if (receiver.subscriptions.has(userId)) return;
  const opusStream = receiver.subscribe(userId, {
    end: {
      behavior: EndBehaviorType.AfterSilence,
      duration: 500,
    },
  });

  const oggStream = new prism.opus.OggLogicalBitstream({
    opusHead: new prism.opus.OpusHead({
      channelCount: 2,
      sampleRate: 48000,
    }),
    pageSizeControl: {
      maxPackets: 10,
    },
  });

  if (!existsSync(CONSTANTS.OUTPUT_PATH)) {
    mkdirSync(CONSTANTS.OUTPUT_PATH);
    console.log('Created output folder');
  }

  if (!existsSync(CONSTANTS.RECORDING_PATH)) {
    mkdirSync(CONSTANTS.RECORDING_PATH);
    console.log('Created recordings folder');
  }

  const filename = `${CONSTANTS.RECORDING_PATH}${Date.now() - startTime!}-${getUsername(user)}.ogg`;

  const out = createWriteStream(filename);

  pipeline(opusStream, oggStream, out, (err) => {
    if (!err) return;
    console.warn(`Error recording file ${filename} - ${err.message}`);
  });
}
