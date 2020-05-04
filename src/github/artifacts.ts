import fs from 'fs';
import { create, UploadResponse } from '@actions/artifact';
import { ARTIFACT_NAME } from '../const';

interface ArtifactInterface {
  channel: string | null;
  ts: string | null;
}

const fileOpts = { encoding: 'utf8', flag: 'r' };

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

export const saveArtifacts = async (channel: string, timestamp: string): Promise<UploadResponse> => {
  console.time('Upload artifact');

  try {
    fs.writeFileSync('/tmp/channel.txt', channel);
    fs.writeFileSync('/tmp/ts.txt', timestamp);
    const artifactClient = create();

    return await artifactClient.uploadArtifact(ARTIFACT_NAME, ['/tmp/channel.txt', '/tmp/ts.txt'], '/tmp');
  } finally {
    console.timeEnd('Upload artifact');
  }
};

/**
 * Since a single job is run on the same host node we can just safely store these in file system.
 */
export const getLastJobOutputIndex = (jobName: string): number | undefined => {
  try {
    return parseInt(fs.readFileSync(`/tmp/${jobName.replace(/[\W_]+/g, '').toLowerCase()}.txt`, fileOpts), 10);
  } catch (error) {
    // Return undefined if unable to get a number
    // The first time this is run we'll get the following error. Just return undefined
    // Error: ENOENT: no such file or directory, open '/tmp/init.txt'
    // at Object.openSync (fs.js:440:3)
    // at Object.readFileSync (fs.js:342:35)
  }
};

/**
 * Since a single job is run on the same host node we can just safely store these in file system.
 */
export const saveLastJobOutputIndex = (jobName: string, index: number): void => {
  try {
    fs.writeFileSync(`/tmp/${jobName.replace(/[\W_]+/g, '').toLowerCase()}.txt`, index);
  } catch (error) {
    // We shouldn't have any trouble writing the file. However, in the event the tmp directory
    // changes or invalid characters somewhere. Let's fail
    // Return undefined if unable to get a number
    console.error('Error saving last job output index');
    throw error;
  }
};
