export const REGION = 'us-east-1';

export const DYNAMODB_SLACK_TABLE_NAME = 'techpivot-streaming-slack-notify-slack';

export const DYNAMODB_GITHUB_TABLE_NAME = 'techpivot-streaming-slack-notify-github';

export const SSM_PARAMETER_QUEUE_URL = '/techpivot/streaming-slack-notify/queue-url';

export const SSM_SLACK_APP_CLIENT_ID = '/techpivot-streaming-slack-notify/prod/slack/client_id';

export const SSM_SLACK_APP_CLIENT_SECRET = '/techpivot-streaming-slack-notify/prod/slack/client_secret';

export const SSM_SLACK_APP_SIGNING_SECRET = '/techpivot-streaming-slack-notify/prod/slack/signing_secret';

export const SSM_GITHUB_APP_PRIVATE_KEY = '/techpivot/streaming-slack-notify/prod/github-app/private-key';

export const SSM_GITHUB_APP_WEBHOOK_SECRET = '/techpivot/streaming-slack-notify/prod/github-app/webhook-secret';

export const GITHUB_APP_ID = 71405;

export const API_ENDPOINT = 'https://api.streaming-slack-notify.techpivot.com';
