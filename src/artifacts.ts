import fs from 'fs';
import { create } from '@actions/artifact';
import { ARTIFACT_NAME } from './const';

interface ArtifactInterface {
  channel: string | null;
  ts: string | null;
}

/**
 * Returns the string timestamp or null.
 *
 * @return object { ts, channel } The values are null if not specified
 */
export const getArtifacts = async (): Promise<ArtifactInterface> => {
  console.time('Retrieve artifact');

  try {
    if (!fs.existsSync('/tmp/channel.txt') || !fs.existsSync('/tmp/ts.txt')) {
      const artifactClient = create();

      // Note: We call this every load and thus the very first time, there may not exist
      // an artifact yet. This allows us to write simpler Github actions without having
      // to proxy input/output inbetween all other steps.
      await artifactClient.downloadArtifact(ARTIFACT_NAME, '/tmp');
    }

    const fileOpts = { encoding: 'utf8', flag: 'r' };

    return {
      channel: fs.readFileSync('/tmp/channel.txt', fileOpts),
      ts: fs.readFileSync('/tmp/ts.txt', fileOpts),
    };
  } catch (error) {
    // This is okay. error = "Unable to find any artifacts for the associated workflow"
    return {
      channel: null,
      ts: null,
    };
  } finally {
    console.timeEnd('Retrieve artifact');
  }
};

export const saveArtifacts = async (channel: string, timestamp: string): Promise<any> => {
  console.time('Upload artifact');

  try {
    fs.writeFileSync('/tmp/channel.txt', channel);
    fs.writeFileSync('/tmp/ts.txt', timestamp);
    const artifactClient = create();

    return await artifactClient.uploadArtifact(
      ARTIFACT_NAME,
      ['/tmp/channel.txt', '/tmp/ts.txt'],
      '/tmp'
    );
  } finally {
    console.timeEnd('Upload artifact');
  }
};
