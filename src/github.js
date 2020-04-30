import fs from 'fs';
import { create } from '@actions/artifact';
import { ARTIFACT_NAME } from './const';
import githubHttpClient from './github-http-client';

export const saveSlackArtifact = async (channel, timestamp) => {
  console.time('Upload artifact');

  try {
    fs.writeFileSync('/tmp/channel.txt', channel);
    fs.writeFileSync('/tmp/ts.txt', timestamp);
    const artifactClient = create();

    await artifactClient.uploadArtifact(
      ARTIFACT_NAME,
      ['/tmp/channel.txt', '/tmp/ts.txt'],
      '/tmp'
    );
  } finally {
    console.timeEnd('Upload artifact');
  }
};

/**
 * Returns the string timestamp or null.
 *
 * @return object { ts, channel } The values are null if not specified
 */
export const getSlackArtifact = async () => {
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

export const getWorkflowSummary = async () => {
  //console.log(JSON.stringify(github.context));
  //console.dir(process.env);

  // current WORKFLOW:    github.context.workflow    ||  'Main'
  // current RUN_ID:      process.env.GITHUB_RUN_ID  ||  '90637811'
  // current JOB:         process.env.GITHUB_JOB     ||  'init'

  const resp = await githubHttpClient.getJson(
    `https://api.github.com/repos/techpivot/streaming-slack-notify/actions/runs/${process.env.GITHUB_RUN_ID}/jobs`
  );

  // Sample Response

  // {
  //   "statusCode": 200,
  //   "result": {
  //     "total_count": 1,
  //     "jobs": [
  //       {
  //         "id": 634601866,
  //         "run_id": 92521120,
  //         "run_url": "https://api.github.com/repos/techpivot/streaming-slack-notify/actions/runs/92521120",
  //         "node_id": "MDg6Q2hlY2tSdW42MzQ2MDE4NjY=",
  //         "head_sha": "04bdefb2815ad7e0a4118da31076311029763500",
  //         "url": "https://api.github.com/repos/techpivot/streaming-slack-notify/actions/jobs/634601866",
  //         "html_url": "https://github.com/techpivot/streaming-slack-notify/runs/634601866",
  //         "status": "in_progress",
  //         "conclusion": null,
  //         "started_at": "2020-04-30T20:42:24Z",
  //         "completed_at": null,
  //         "name": "init",
  //         "steps": [
  //           {
  //             "name": "Set up job",
  //             "status": "in_progress",
  //             "conclusion": null,
  //             "number": 1,
  //             "started_at": "2020-04-30T20:42:24.000Z",
  //             "completed_at": null
  //           }
  //         ],
  //         "check_run_url": "https://api.github.com/repos/techpivot/streaming-slack-notify/check-runs/634601866"
  //       }
  //     ]
  //   },
  //   "headers": {
  //     "server": "GitHub.com",
  //     "date": "Thu, 30 Apr 2020 20:42:28 GMT",
  //     "content-type": "application/json; charset=utf-8",
  //     "content-length": "781",
  //     "status": "200 OK",
  //     "x-ratelimit-limit": "1000",
  //     "x-ratelimit-remaining": "996",
  //     "x-ratelimit-reset": "1588282776",
  //     "cache-control": "private, max-age=60, s-maxage=60",
  //     "vary": "Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding, Accept, X-Requested-With",
  //     "etag": "\"7482e18419d551e1de27be67e31a4829\"",
  //     "x-github-media-type": "github.v3",
  //     "access-control-expose-headers": "ETag, Link, Location, Retry-After, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval, X-GitHub-Media-Type, Deprecation, Sunset",
  //     "access-control-allow-origin": "*",
  //     "strict-transport-security": "max-age=31536000; includeSubdomains; preload",
  //     "x-frame-options": "deny",
  //     "x-content-type-options": "nosniff",
  //     "x-xss-protection": "1; mode=block",
  //     "referrer-policy": "origin-when-cross-origin, strict-origin-when-cross-origin",
  //     "content-security-policy": "default-src 'none'",
  //     "x-github-request-id": "0401:5A2C:1374DE:3183A3:5EAB3834"
  //   }
  // }

  return {
    jobs: resp.result.jobs,
  };
};
