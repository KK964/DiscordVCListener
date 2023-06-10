import type { User } from 'discord.js';

const usersToRecord = new Set<User>();

export function enableRecording(user: User) {
  usersToRecord.add(user);
}

export function disableRecording(user: User) {
  usersToRecord.delete(user);
}

export function clearUsers() {
  usersToRecord.clear();
}

export function canRecord(user: User) {
  if (usersToRecord.size === 0) return true;
  return usersToRecord.has(user);
}
