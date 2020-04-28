import https from 'https';
import url from 'url';

export function printHttpError(
  response = null,
  body = null,
  errorMessage = null
) {
  console.error(
    `ERROR: Unable to post message to Slack${
      errorMessage !== null ? ': ' + errorMessage : ''
    }\n`
  );
  console.error(`Response Code: ${response ? response.statusCode : null}`);
  console.error(`Response Body: ${body}`);
}

export function postSlackMessage(payload) {
  const data = JSON.stringify({
    token: process.env.SLACK_ACCESS_TOKEN,
  }, payload);

  console.log(payload);
  console.log(data);


  const endpoint = url.parse('https://slack.com/api/chat.postMessage');
  const options = {
    hostname: endpoint.hostname,
    port: endpoint.port,
    path: endpoint.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  const request = https.request(options, (response) => {
    let buffer = '';

    response.on('data', (chunk) => {
      buffer += chunk;
    });

    response.on('end', () => {
      if (response.statusCode !== 200) {
        printHttpError(response, buffer, buffer);
        process.exit(1);
      }

      console.log('end', buffer);
      //JSON.parse(buffer));
    });
  });

  request.on('error', (error) => {
    printHttpError(null, null, error.message);
    process.exit(1);
  });
  request.write(data);
  request.end();
}