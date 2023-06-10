import { rmdir, unlink } from 'node:fs';
import seven from 'node-7z';
import CONSTANTS from './constants';

export async function packageAudioFiles() {
  const sevenZip = seven.add('recordings.7z', CONSTANTS.OUTPUT_PATH, {
    recursive: true,
  });

  await new Promise<void>((resolve) => {
    sevenZip.on('end', () => {
      resolve();
    });

    sevenZip.on('error', (err) => {
      console.error(err);
      resolve();
    });
  });
}

// NOT ASYNC
export function deleteAudioFiles() {
  const path = './output';
  rmdir(path, { recursive: true }, (err) => {
    if (!err) return;
    console.error(err);
  });

  unlink('./recordings.7z', (err) => {});
}
