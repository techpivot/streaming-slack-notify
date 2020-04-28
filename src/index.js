import { getInput, postSlackMessage } from './utils';

async function run() {
  try {
    if (!process.env.SLACK_ACCESS_TOKEN) {
      throw new Error(`
No SLACK_ACCESS_TOKEN secret defined.

  1) Navigate to Repository > Settings > Secrets and add SLACK_ACCESS_TOKEN secret
  2) Update Github workflow file (e.g.  ./github/workflows/main.yml) to include:
      env:
        SLACK_ACCESS_TOKEN: \${{ secrets.SLACK_ACCESS_TOKEN }}
      `);
    }

    const channel = getInput('channel', { required: true });
    const ts = getInput('ts');

    const method = !ts ? 'chat.postMessage' : 'chat.update';

    console.log('channel: ' + channel);
    console.log('ts: ' + ts);


    // Build the payload
    const payload = {
      // Required
      channel: getInput('channel', { required: true }),
      text: 'replaceme',
      // Optional
      username: getInput('username'),
      icon_url: getInput('icon_url'),
    };

    if (ts) {
      payload.text = 'REPLACEME NEW';
    }

    // Build attachments

    // Footer

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

    postSlackMessage(method, payload)
      .then((json) => {
        console.log(`::set-output name=channel::${json.channel}`);
        console.log(`::set-output name=ts::${json.ts}`);
        console.log(`'Successfully sent "${method}" payload for channel: ${channel}`)
      })
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });


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
    console.error(error.message || error);
    process.exit(1);
  }
}

run();
