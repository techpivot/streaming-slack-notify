import * as core from '@actions/core';
import * as github from '@actions/github';
import slackNotify from 'slack-notify';


const notRequired = { required: false };


// most @actions toolkit packages have async methods
async function run() {
  try {
    if (!process.env.SLACK_WEBHOOK) {
      throw 'No SLACK_WEBHOOK secret defined. Navigate to Repository > Settings > Secrets and add SLACK_WEBHOOK secret';
    }

    const slack = slackNotify(process.env.SLACK_WEBHOOK);

    let attachment = {};
    attachment.fallback = core.getInput('fallback', {
      required: false,
    });
    attachment.color = core.getInput('color', {
      required: false,
    });
    attachment.pretext = core.getInput('pretext', {
      required: false,
    });
    attachment.author_name = core.getInput('author_name', {
      required: false,
    });
    attachment.author_link = core.getInput('author_link', {
      required: false,
    });
    attachment.author_icon = core.getInput('author_icon', {
      required: false,
    });
    attachment.title = core.getInput('title', {
      required: false,
    });
    attachment.title_link = core.getInput('title_link', {
      required: false,
    });
    attachment.text = core.getInput('text', {
      required: false,
    });
    attachment.image_url = core.getInput('image_url', {
      required: false,
    });
    attachment.thumb_url = core.getInput('thumb_url', {
      required: false,
    });
    attachment.footer = core.getInput('footer', {
      required: false,
    });
    attachment.footer_icon = core.getInput('footer_icon', {
      required: false,
    });

    const channel = core.getInput('channel', {
      required: true,
    });
    const icon_url = core.getInput('icon_url', {
      required: true,
    });

    //console.log('>>>', process.env);
    console.log('context', github.context);


    slack.onError = function (err) {
      core.error(`Error ${err}, action may still succeed though`);
    };


    slack.send({
      channel: channel,
      // It's OKAY if not set. Will use the default webhook username specified
      username: core.getInput('username', notRequired),

      icon_url: icon_url,

      text: `Github action (${process.env.GITHUB_WORKFLOW}) triggered\n`,
      attachments: [
        {
          title: `${process.env.GITHUB_REPOSITORY}`,
          title_link: `https://github.com/${process.env.GITHUB_REPOSITORY}`,
          author_name: `${process.env.GITHUB_ACTOR}`,
          author_link: `https://github.com/${process.env.GITHUB_ACTOR}`,
          author_icon: `https://github.com/${process.env.GITHUB_ACTOR}.png`,

          color: attachment.color,
          text: `${process.env.GITHUB_REF}`,
          footer: `action -> ${process.env.GITHUB_EVENT_NAME}`,
          thumb_url:
            'https://avatars0.githubusercontent.com/u/44036562?s=200&v=4',
        },
        attachment,
      ],
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
