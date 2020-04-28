import { NO_SLACK_ACCESS_TOKEN, TIMING_EXECUTION_LABEL } from './const';
import {
  getInput,
  postSlackMessage,
  getSlackArtifact,
  saveSlackArtifact,
} from './utils';
import { getDividerBlock, getCommitBlocks } from './ui';
import * as github from '@actions/github';

async function run() {
  console.time(TIMING_EXECUTION_LABEL);
  try {
    if (!process.env.SLACK_ACCESS_TOKEN) {
      throw new Error(NO_SLACK_ACCESS_TOKEN);
    }

    let { channel, ts } = await getSlackArtifact();

    if (!channel) {
      channel = getInput('channel', { required: true });
    }

    const method = !ts ? 'chat.postMessage' : 'chat.update';

    // Build the attachment.
    /*const attachment = {
      title: `${process.env.GITHUB_REPOSITORY}`,
      title_link: `https://github.com/${process.env.GITHUB_REPOSITORY}`,
      author_name: `${process.env.GITHUB_ACTOR}`,
      author_link: `https://github.com/${process.env.GITHUB_ACTOR}`,
      author_icon: `https://github.com/${process.env.GITHUB_ACTOR}.png`,
    }
    */

    console.log(github.context);

    let blocks = [];
    blocks.push(getDividerBlock());
    blocks = blocks.concat(getCommitBlocks());
    blocks.push(getDividerBlock());


    const payload = {
      channel,
      attachments: [
        {
          color: '#000000',
          blocks: blocks,
        },
      ],
    };

    if (ts) {
      payload.ts = ts;
      payload.text = 'REPLACEME NEW';
    } else {
      // Add other required fields for the first post.
      payload.text = 'replaceme';

      // Optional fields (These are only applicable for the first post)
      ['username', 'username', 'username'].forEach((k) => {
        const inputValue = getInput(k);
        if (!!inputValue) {
          payload[k] = inputValue;
        }
        payload.username = getInput('username');
        payload.icon_url = getInput('icon_url');
        payload.icon_emoji = getInput('icon_emoji');
      })

    }


    /*
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

    //console.log('>>>', process.env);
    console.log('context', github.context);
    */

    // initial
    let responseJson;
    await postSlackMessage(method, payload)
      .then((json) => {
        responseJson = json;
        console.log(
          `Successfully sent "${method}" payload for channel: ${channel}`
        );
      })
      .catch((error) => {
        console.error(`\u001b[31;1mERROR: ${error}\u001b[0m`);
        process.exit(1);
      });

    // Create an artifact
    if (!ts) {
      await saveSlackArtifact(responseJson.channel, responseJson.ts);
    }
    /*

    const response = slack.send({
      text: `Github action (${process.env.GITHUB_WORKFLOW}) triggered\n`,
      attachments: [
        {
          // Opinionated attachment / status
          title: `${process.env.GITHUB_REPOSITORY}`,
          title_link: `https://github.com/${process.env.GITHUB_REPOSITORY}`,
          author_name: `${process.env.GITHUB_ACTOR}`,
          author_link: `https://github.com/${process.env.GITHUB_ACTOR}`,
          author_icon: `https://github.com/${process.env.GITHUB_ACTOR}.png`,

          // color: attachment.color,
          text: `${process.env.GITHUB_REF}`,
          footer: `action -> ${process.env.GITHUB_EVENT_NAME}`,
          thumb_url:
            'https://avatars0.githubusercontent.com/u/44036562?s=200&v=4',
        },
      ],
    }); */
  } catch (error) {
    console.error(`\u001b[31;1mERROR: ${error.message || error}\u001b[0m`);
    process.exit(1);
  } finally {
    console.timeEnd(TIMING_EXECUTION_LABEL);
  }
}

run();
