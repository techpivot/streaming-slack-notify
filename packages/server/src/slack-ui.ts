import {
  ImageElement,
  PlainTextElement,
  MrkdwnElement,
  DividerBlock,
  KnownBlock,
  MessageAttachment,
} from '@slack/types';
import Webhooks from '@octokit/webhooks';
import { getReadableDurationString } from '../../common/lib/utils';
import {
  GithubActionsWorkflowJobConclusion,
  GithubActionsWorkflowJobStepStatus,
  GitHubWorkflowRunSummary,
} from './interfaces';

type outputFallbackText = {
  text: string;
};

export const getDividerBlock = (): DividerBlock => {
  return {
    type: 'divider',
  };
};

/**
 *
 * @param summary
 */
export const getTitleBlocks = (
  summary: GitHubWorkflowRunSummary,
  outputFallbackText: outputFallbackText = { text: '' }
): KnownBlock[] => {
  const { status, conclusion, created_at, updated_at } = summary.workflowData;
  const {
    workflowName,
    runId,
    repository: { owner, repo },
  } = summary;
  let action;
  let icon = '';
  let clock = '';
  let finishTime;

  switch (status) {
    case 'queued':
      action = 'is queued';
      break;

    case 'in_progress':
      action = 'is running';
      finishTime = new Date().toISOString();
      break;

    case 'completed': {
      finishTime = updated_at;

      switch (conclusion) {
        case 'success':
          icon = ':heavy_check_mark: ';
          action = 'completed successfully';
          break;

        case 'neutral':
          icon = ':white_check_mark: ';
          action = 'successfully (neutral)';
          break;

        case 'failure':
          icon = ':x: ';
          action = 'completed with errors';
          break;

        case 'cancelled':
          icon = ':x: ';
          action = 'was cancelled';
          break;

        case 'timed_out':
          icon = ':x: ';
          action = 'timed out';
          break;

        case 'action_required':
          icon = ':exclamation: ';
          action = 'failed because manual action is required';
          break;
      }
      break;
    }
  }

  // Fallback text
  outputFallbackText.text = `Workflow ${workflowName} ${action}.`;

  // Get the duration
  if (finishTime) {
    const duration = getReadableDurationString(new Date(created_at), new Date(finishTime));
    clock = `      :clock3: ${duration}`;
    outputFallbackText.text += `  (Duration: ${duration})`;
  }

  // In order to have a better UI for continuous messages in the channel, we need a larger top divider. Currently
  // this is set to width for desktop. Without additional options, there is nothing else we can really do. The
  // divider block is being used in the commit section.

  // Temporarily disabling. Would love to get some more feedback on this
  const preDivider = '';
  // const preDivider = '══════════════════════════════════════════════════════════\n';

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${preDivider}${icon}Workflow *<https://www.github.com/${owner}/${repo}/actions/runs/${runId}|${workflowName}>* ${action}.${clock}`,
      },
    },
  ];
};

/**
 * For consistency, we proxy this into the getTitleBlocks() so it's a little more clear and less duplication
 *
 * @param workflowSummary
 */
export const getFallbackText = (summary: GitHubWorkflowRunSummary): string => {
  const outputFallbackText = { text: '' };
  getTitleBlocks(summary, outputFallbackText);

  return outputFallbackText.text;
};

export const getEventSummaryBlocks = (summary: GitHubWorkflowRunSummary): KnownBlock[] => {
  const {
    eventName,
    repository: { owner, repo },
  } = summary;
  const elements: MrkdwnElement[] = [];

  elements.push({
    type: 'mrkdwn',
    text: `*<https://www.github.com/${owner}/${repo}|${owner}/${repo}>*`,
  });
  elements.push({
    type: 'mrkdwn',
    text: '*Event*: `' + eventName + '`',
  });

  switch (eventName) {
    case 'push':
      {
        const payload = summary.payload as Webhooks.WebhookPayloadPush;
        elements.push({
          type: 'mrkdwn',
          text: '*Branch*: `' + payload.ref.replace('refs/heads/', '') + '`',
        });
      }
      break;

    case 'pull_request':
      {
        const payload = summary.payload as Webhooks.WebhookPayloadPullRequest;
        elements.push({
          type: 'mrkdwn',
          text: `*Number*: \`${payload.number}\``,
        });
      }
      break;
  }

  return [
    {
      type: 'context',
      elements,
    },
  ];
};

const getPushEventDetailBlocks = (payload: Webhooks.WebhookPayloadPush): KnownBlock[] => {
  const blocks: KnownBlock[] = [];
  const maxCommits = 2;
  let index = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload.commits.slice(0, maxCommits).forEach((commit: any) => {
    index += 1;

    const {
      id,
      url,
      message,
      author: { username },
    } = commit;

    if (index > 1) {
      blocks.push(getDividerBlock());
    }

    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<${url}|${id.substring(0, 7)}>*: ${message}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'image',
            image_url: `https://github.com/${username}.png`,
            alt_text: username,
          },
          {
            type: 'mrkdwn',
            text: `*<https://github.com/${username}|${username}>*`,
          },
        ],
      }
    );
  });

  if (payload.commits.length > maxCommits) {
    const extra = payload.commits.length - maxCommits;
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Plus *${extra}* more ${extra === 1 ? 'commit' : 'commits'}`,
        },
      ],
    });
  }

  return blocks;
};

const getPullRequestEventDetailBlocks = (payload: Webhooks.WebhookPayloadPullRequest): KnownBlock[] => {
  const blocks: KnownBlock[] = [];

  const {
    pull_request: {
      draft,
      commits,
      title,
      body,
      html_url: prUrl,
      head: { ref: headRef },
      base: { ref: baseRef },
      user: { login, html_url },
    },
  } = payload;

  // Note 1: We're currently putting the number in the top part. Could potentially be put adjacent
  // to the title; however, in UI testing I couldn't get it to look good. Specifically, either too bold
  // or not displayed with muted contrast which is what I was going for.

  // Note 2: It appears the mergeable/rebasable information is marked as null or 'unknown' while
  // running. (Makes sense)

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `${draft ? '`DRAFT` ' : ''}*<${prUrl}|${title}>*: ${body}`,
    },
  });
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'image',
        image_url: `${html_url}.png`,
        alt_text: login,
      },
      {
        type: 'mrkdwn',
        text: `*<${html_url}|${login}>* wants to merge *${commits}* commit${
          commits !== 1 ? 's' : ''
        } into \`${baseRef}\` from \`${headRef}\``,
      },
    ],
  });

  return blocks;
};

export const getEventDetailBlocks = (summary: GitHubWorkflowRunSummary): KnownBlock[] => {
  const { payload, eventName } = summary;

  switch (eventName) {
    case 'push':
      return getPushEventDetailBlocks(payload as Webhooks.WebhookPayloadPush);

    case 'pull_request':
      return getPullRequestEventDetailBlocks(payload as Webhooks.WebhookPayloadPullRequest);

    default:
      throw new Error('Unsupported event type');
  }
};

export const getJobAttachments = (summary: GitHubWorkflowRunSummary): Array<MessageAttachment> => {
  const { jobsData } = summary;
  const attachments: Array<MessageAttachment> = [];

  jobsData.jobs.forEach((job) => {
    const elements: (ImageElement | PlainTextElement | MrkdwnElement)[] = [];
    const { completed_at, html_url, name, status, conclusion, started_at, steps } = job;
    let icon = '';
    let color;
    let currentStep;
    let currentStepIndex = 0; // Zero indexed

    stepLoop: for (let i = 0; i < steps.length; i += 1) {
      const status: GithubActionsWorkflowJobStepStatus = steps[i].status as GithubActionsWorkflowJobStepStatus;
      const conclusion: GithubActionsWorkflowJobConclusion = steps[i].conclusion as GithubActionsWorkflowJobConclusion;

      switch (status) {
        case 'completed':
          switch (conclusion) {
            case 'skipped':
              break stepLoop;

            case 'failure':
            case 'success':
            case 'neutral':
            case 'cancelled':
            case 'timed_out':
            case 'action_required':
              if (!currentStep || steps[i].number > currentStep.number) {
                currentStepIndex = i;
                currentStep = steps[i];
              }
              break;
          }
          break;

        case 'in_progress':
          if (!currentStep || steps[i].number > currentStep.number) {
            currentStepIndex = i;
            currentStep = steps[i];
          }
          break;

        // Assume we have 10 steps and we have a failure/cancel after step 4. That means steps 1-4 are filled out
        // 5-9 are all "queued", but we've already populated the mock "Complete job" step as success. We don't
        // want to move the active step to this position. Instead, break immediately.
        default:
          break stepLoop;
      }
    }

    if (!currentStep) {
      // This will never happen just type safety
      throw new Error('Unable to determine current job step');
    }

    switch (status) {
      case 'in_progress':
        color = '#d2942c';
        icon = ':hourglass_flowing_sand:';
        elements.push({
          type: 'mrkdwn',
          text: '_In Progress_',
        });

        // Note: For in progress, the current steps don't include the last step "Complete job".
        // Thus let's increase by one to account for this. Additionally, the ${currentStepIndex}
        // is zero-indexed so convert this to human numbered indexed (+1)

        elements.push({
          type: 'mrkdwn',
          text: `*${steps[currentStepIndex].name}* (${currentStepIndex + 1} of ${steps.length + 1})`,
        });

        break;

      case 'queued':
        icon = ':white_circle:';
        color = '#d2d2d2';
        elements.push({
          type: 'mrkdwn',
          text: '_Queued_',
        });
        break;

      case 'completed':
        switch (conclusion) {
          case 'success':
            color = '#28a745';
            icon = ':heavy_check_mark:';
            elements.push({
              type: 'mrkdwn',
              text: `*${steps.length}* steps completed *successfully*`,
            });
            break;

          case 'neutral':
            color = '#28a745';
            icon = ':white_check_mark:';
            elements.push({
              type: 'mrkdwn',
              text: `*${steps.length}* steps completed *successfully* _(Neutral)_`,
            });
            break;

          case 'cancelled':
            color = '#ea3131';
            icon = ':x:';
            elements.push({
              type: 'mrkdwn',
              text: `*Cancelled* on step *${steps[currentStepIndex].name}* (${currentStepIndex + 1} of ${
                steps.length
              })`,
            });
            break;

          case 'failure':
            color = '#ea3131';
            icon = ':x:';
            elements.push({
              type: 'mrkdwn',
              text: `*Failed* on step *${steps[currentStepIndex].name}* (${currentStepIndex + 1} of ${steps.length})`,
            });
            break;

          case 'timed_out':
            color = '#ea3131';
            icon = ':x:';
            elements.push({
              type: 'mrkdwn',
              text: `*Timed out* on step *${steps[currentStepIndex].name}* (${currentStepIndex + 1} of ${
                steps.length
              })`,
            });
            break;

          case 'action_required':
            color = '#ea3131';
            icon = ':x:';
            elements.push({
              type: 'mrkdwn',
              text: `*Failed* on step *${steps[currentStepIndex].name}* (${currentStepIndex + 1} of ${steps.length})`,
            });
            elements.push({
              type: 'mrkdwn',
              text: `_Manual Action Required_`,
            });
            break;
        }
        break;

      default:
        throw new Error(`Unknown job status: ${status}`);
    }

    elements.unshift({
      type: 'mrkdwn',
      text: `*Job*: *<${html_url}|${name}>*`,
    });
    elements.unshift({
      type: 'mrkdwn',
      text: icon,
    });

    // Get the duration
    if (started_at) {
      elements.push({
        type: 'mrkdwn',
        // Note: Match the styling as close as possible to actual GitHub actions layout
        text: `:clock3:${getReadableDurationString(
          new Date(started_at),
          completed_at ? new Date(completed_at) : new Date()
        )}`,
      });
    }

    attachments.push({
      color,
      blocks: [{ type: 'context', elements }],
    });
  });

  return attachments;
};
