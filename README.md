# Discord VC Recorder

Bot that records voice channels and returns a 7 ZIP file with the audio files, and a playback html file.

## Requirements

- [Discord](https://discord.com/developers) bot token
- Linux distribution (tested on Ubuntu 20.04)
  - This may work on Windows, but it is not tested and will probably never be supported
- [Node.js](https://nodejs.org) 18.0.0 or newer

## Installation

1. Clone this repository
2. Install dependencies with `npm install`
3. Copy `.env.example` to `.env` and fill in the values
4. Build the bot with `npm run build` or `npm run start` for development (will build and run the bot)
5. Run the bot with `npm run start:prod`

## Usage

Commands:

- `/record [channel=voice channel] [speaker=specific user to record]` - Starts recording the specified voice channel
  - If neither channel, or speaker is specified, the channel you are in will be used
  - If no channel is specified, but the speaker is, the channel of the speaker will be used
  - If no speaker is specified, the bot will record all users in the channel
- `/leave` - Leaves the voice channel and stops recording, and returns the 7 ZIP file with the audio files, and a playback html file
- `/listening_to` - Returns the users the bot is currently recording
- `/listen <user> <enable=true|false>` - Enables or disables recording of a specific user
- `/forceleave` - Forces the bot to leave the voice channel, even if it is not recording, and deletes the audio files
