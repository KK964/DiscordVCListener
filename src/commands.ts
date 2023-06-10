import type {
  ApplicationCommandDataResolvable,
  Client,
  CommandInteraction,
  Guild,
} from 'discord.js';
import { recordCommand } from './commands/record';
import { leaveCommand } from './commands/leave';

export type BaseCommand = {
  command: string;
  data: ApplicationCommandDataResolvable;
  execute: (interaction: CommandInteraction, client: Client) => any | Promise<any>;
};

const commands = new Map<string, BaseCommand>();

export async function init(guild: Guild) {
  commands.clear();
  registerCommand(recordCommand);
  registerCommand(leaveCommand);

  const guildCommands = [];
  for (const command of commands.values()) {
    guildCommands.push(command.data);
  }

  await guild.commands.set(guildCommands);
}

export function registerCommand(handler: BaseCommand) {
  commands.set(handler.command, handler);
}

export function hasCommand(name: string | CommandInteraction) {
  if (typeof name === 'string') return commands.has(name);
  return commands.has(name.commandName);
}

export function getCommand(name: string | CommandInteraction) {
  if (typeof name === 'string') return commands.get(name);
  return commands.get(name.commandName);
}
