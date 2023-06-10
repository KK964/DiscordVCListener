import { EndBehaviorType, VoiceReceiver, getVoiceConnection } from '@discordjs/voice';
import type { Guild, User, VoiceBasedChannel } from 'discord.js';

import { existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { pipeline, Transform } from 'node:stream';

import * as prism from 'prism-media';
import { canRecord } from './usersToRecord';

import CONSTANTS from '../utils/constants';

let startTime: number | undefined;

const ENDING_BYTES = [
  0xf8, 0xff, 0xfe, 0xf8, 0xff, 0xfe, 0xf8, 0xff, 0xfe, 0xf8, 0xff, 0xfe, 0xf8, 0xff, 0xfe, 0xf8,
  0xff, 0xfe, 0xf8, 0xff, 0xfe, 0xf8, 0xff, 0xfe, 0xf8, 0xff, 0xfe, 0xf8, 0xff, 0xfe,
];

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

export async function stopRecordingAudio(guild: Guild) {
  const connection = getVoiceConnection(guild.id);
  if (!connection) return;
  const receiver = connection.receiver;
  receiver.speaking.removeAllListeners('start');
  receiver.subscriptions.forEach((subscription) => {
    subscription.destroy();
  });
}

function ensureRecordingAllUsers(channel: VoiceBasedChannel) {
  const connection = getVoiceConnection(channel.guild.id);
  if (!connection) return;
  const receiver = connection.receiver;
  channel.members.forEach((member) => {
    try {
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

  const prematureCloseFix = new Transform({
    transform(chunk, _encoding, callback) {
      if (chunk.length < 30) {
        callback(null, chunk);
        return;
      }

      // Ensure the last 30 bytes of the stream are ENDING_BYTES
      const lastBytes = chunk.slice(chunk.length - 30);
      let allEndingBytes = true;
      for (let i = 0; i < 30; i++) {
        if (lastBytes[i] == ENDING_BYTES[i]) continue;
        allEndingBytes = false;
        break;
      }
      if (allEndingBytes) {
        callback(null, chunk);
        return;
      }

      console.warn(`Fixing premature close of stream (${chunk.length} bytes)`);

      // Append the ending bytes to the stream
      callback(null, Buffer.concat([chunk, Buffer.from(ENDING_BYTES)]));
    },
  });

  pipeline(opusStream, prematureCloseFix, oggStream, out, (err) => {
    if (!err) return;
    console.warn(`Error recording file ${filename} - ${err.message}`);
  });
}
