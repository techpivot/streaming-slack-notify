import * as github from '@actions/github';
import * as Webhooks from '@octokit/webhooks';
import {
  ImageElement,
  PlainTextElement,
  MrkdwnElement,
  DividerBlock,
  KnownBlock,
  MessageAttachment,
} from '@slack/types';
import { JobStepInterface, WorkflowSummaryInterface } from '../github/workflow';
import { COLOR_SUCCESS, COLOR_ERROR, COLOR_IN_PROGRESS, COLOR_QUEUED } from '../const';
import {
  getActionBranch,
  getActionEventName,
  getGithubRunId,
  getGithubRepositoryUrl,
  getGithubRepositoryFullName,
  getReadableDurationString,
  getWorkflowName,
  getJobContextName,
  getJobContextStatus,
  isFinalStep,
} from '../utils';

export const getDividerBlock = (): DividerBlock => {
  return {
    type: 'divider',
  };
};

export const getTitleBlocks = (): KnownBlock[] => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `GitHub actions is running *workflow*: *<${getGithubRepositoryUrl()}/actions/runs/${getGithubRunId()}|${getWorkflowName()}>*`,
      },
    },
  ];
};

export const getEventSummaryBlocks = (): KnownBlock[] => {
  const eventName = getActionEventName();
  const fields = [`*<${getGithubRepositoryUrl()}|${getGithubRepositoryFullName()}>*`, '*Event*: `' + eventName + '`'];

  if (eventName === 'push') {
    fields.push('*Branch*: `' + getActionBranch() + '`');
  }

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: fields.join('     '),
      },
    },
  ];
};

export const getCommitBlocks = (): KnownBlock[] => {
  const blocks: KnownBlock[] = [];

  switch (getActionEventName()) {
    case 'push': {
      const payload = github.context.payload as Webhooks.WebhookPayloadPush;

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

      break;
    }
  }

  return blocks;
};

export const getJobAttachments = (workflowSummary: WorkflowSummaryInterface): Array<MessageAttachment> => {
  const attachments: Array<MessageAttachment> = [];
  const finalStep = isFinalStep();
  const jobStatus = getJobContextStatus();
  const jobName = getJobContextName();

  workflowSummary.jobs.forEach((job) => {
    const elements: (ImageElement | PlainTextElement | MrkdwnElement)[] = [];
    const { completed_at, html_url, name, status, started_at, steps } = job;

    let icon = '';
    let color;
    let currentStep : JobStepInterface | undefined;
    let currentStepIndex = 0;
    let totalActiveSteps = 0;

    for (let i = 0; i < steps.length; i += 1) {
      switch (steps[i].status) {
        case 'completed':
        case 'in_progress':
          totalActiveSteps += 1;
          if (!currentStep || steps[i].number > currentStep.number) {
            currentStepIndex = i;
            currentStep = steps[i];
          }
          break;
      }
    }

    if (!currentStep) {
      // This will never happen just type safety
      throw new Error('Unable to determine current job step');
    }

    // Little bit of sorcery here. Since there really is no way to tell if the workflow run has finished
    // from inside the GitHub action (since by definition it we're always in progress unless a another job failed),
    // we rely on input in the action and then also peek the status from the Job context. Using these, we can
    // tidy up the final display and the currently running job.
    if (finalStep && jobName === currentStep.name) {
      switch (jobStatus) {
        case 'Success':
          job.status = 'completed';
          job.conclusion = 'success';
          console.debug('Using final step + success() to hint final result');
          break;

        case 'Failure':
          // Check to see the current job is ma
          switch (job.status) {
            case 'in_progress':
            case 'queued':
              // Fix, might need to add generic here depending on UI display below
              job.status = 'completed';
              job.conclusion = 'failure';
              break;

            // leave all other cases
          }
          break;
      }
    }

    // Reference
    // =========
    // status: queued, in_progress, completed

    switch (job.status) {
      case 'in_progress':
        color = COLOR_IN_PROGRESS;
        icon = ':hourglass_flowing_sand:';
        elements.push({
          type: 'mrkdwn',
          text: '_In Progress_',
        });
        // Update the step name to never display our slack notification name. In order to minimize
        // the action YAML our readme/docs don't require naming/IDs. This reduction also allows
        // the default naming to be consistent. In this case, if we're an in progress and the actions
        // is actually on it self (or from 1 + n behind) ... let's bump to the next one which is
        // even more accurate.
        let name = currentStep.name;
        console.log("currentStep.name.indexOf('techpivot/streaming-slack-notify')",
        currentStep.name.indexOf('techpivot/streaming-slack-notify'), currentStep.name);

        if (currentStep.name.indexOf('techpivot/streaming-slack-notify') >= 0 && steps[currentStepIndex + 1]) {
          // We could potentially walk this continously; however, that's silly and if the end-user wants
          // to notify multiple slack notifies ... well then we'll just have to display that as that's
          // what we're actually doing.

          // Now, in terms of updating the step: Our current observations are as follows. In a multi-step job,
          // the first techpivot/streaming-slack-notify will occur spot on; however, subsequent notifications,
          // typically are slightly late meaning we should display the subsequent notification.
          if (currentStepIndex >= 2 &&
              currentStepIndex <= 3 &&
              steps[currentStepIndex - 1].name.indexOf('techpivot/streaming-slack-notify') < 0
          ) {
              name = steps[currentStepIndex - 1].name;
              console.log('updating name A: ', name, currentStepIndex);
          } else if (steps[currentStepIndex + 1].name.indexOf('techpivot/streaming-slack-notify') < 0) {
              name = steps[currentStepIndex + 1].name;
              console.log('updating name B: ', name, currentStepIndex);
          }
        } else {
          console.log('leaving name: ', name);
        }

        // Note: For in progress, the current steps don't include the last step "Complete job".
        // Thus let's increase by one to account for this

        elements.push({
          type: 'mrkdwn',
          text: `*${name}* (${totalActiveSteps} of ${steps.length + 1})`,
        });

        break;

      case 'queued':
        icon = ':white_circle:';
        color = COLOR_QUEUED;
        elements.push({
          type: 'mrkdwn',
          text: '_Queued_',
        });
        console.log('check queue jobs');
        break;

      case 'completed':
        // Reference
        // =========
        // conclusion: null, success, failure, neutral, cancelled, timed_out or action_required

        switch (job.conclusion) {
          case 'success':
            icon = ':heavy_check_mark:';
            color = COLOR_SUCCESS;
            elements.push({
              type: 'mrkdwn',
              text: `*${steps.length}* steps completed *successfully*`,
            });
            break;

          case 'neutral':
            icon = ':heavy_check_mark:';
            color = COLOR_SUCCESS;
            elements.push({
              type: 'mrkdwn',
              text: `*${steps.length}* steps completed *successfully* _(Neutral)_`,
            });
            break;

          case 'failure':
          case 'cancelled':
          case 'timed_out':
          case 'action_required':
            icon = ':x:';
            color = COLOR_ERROR;
            elements.push({
              type: 'mrkdwn',
              text: `errorn `,
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
