export function printHttpError(
  request,
  response = null,
  body = null,
  errorMessage = null
) {
  console.error(
    `ERROR: Unable to post message to Slack${
      errorMessage !== null ? ': ' + errorMessage : ''
    }\n`
  );
  console.error(`\nResponse Code: ${response ? response.statusCode : null}`);
  console.error(`Response Body: ${body}`);
}
