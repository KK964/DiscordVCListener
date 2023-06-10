import { readdir, readFile, writeFile } from 'node:fs/promises';
import CONSTANTS from '../utils/constants';

export async function mergeAudioFiles() {
  const files = await readdir(CONSTANTS.RECORDING_PATH);
  const audioFiles = files.filter((file) => file.endsWith('.ogg'));
  const audioFilesString = JSON.stringify(audioFiles);

  const html = await readFile(CONSTANTS.HTML.PATH, 'utf-8');
  const newHtml = html.replace(CONSTANTS.HTML.AUDIO_FILES_PLACEHOLDER, audioFilesString);
  await writeFile(CONSTANTS.HTML.OUTPUT_PATH, newHtml);
}

mergeAudioFiles();
