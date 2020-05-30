import * as fs from 'fs';
import * as path from 'path';
import { DynamoDB, SSM } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { GetParametersRequest, GetParametersResult } from 'aws-sdk/clients/ssm';
import { SlackSecrets } from './types';
import { SlackAuthError } from './errors';

const DB_NAME = 'techpivot-streaming-slack-notify';

export const parseTemplate = (fileName: string, vars: { [key: string]: string } = {}): string => {
  let template = fs.readFileSync(path.resolve(path.dirname(__filename), 'templates', fileName), {
    encoding: 'utf8',
    flag: 'r',
  });

  Object.keys(vars).forEach((key) => {
    template = template.replace(new RegExp('{{' + key + '}}', 'g'), vars[key]);
  });

  return template;
};

export const getSlackSecrets = async (region: string): Promise<SlackSecrets> => {
  var params: GetParametersRequest = {
    Names: [
      '/techpivot/streaming-slack-notify/prod/slack/client_id',
      '/techpivot/streaming-slack-notify/prod/slack/client_secret',
      '/techpivot/streaming-slack-notify/prod/slack/signing_secret',
    ],
    WithDecryption: true,
  };

  const ssm = new SSM({ region });
  const response: GetParametersResult = await ssm.getParameters(params).promise();
  const result: any = {};

  (response.Parameters || []).forEach(({ Name, Value }) => {
    var namePieces: string[] = (Name || '').split('/');
    if (namePieces.length > 0) {
      result[namePieces[namePieces.length - 1]] = Value;
    }
  });

  return result;
};

export const generateReadableSlackError = (error: any): SlackAuthError => {
  if (!error.data || !error.data.error) {
    return new SlackAuthError('Unknown Slack OAuth V2 Access error', 'unknown_error');
  }

  switch (error.data.error) {
    case 'invalid_grant_type':
      return new SlackAuthError('Value passed for grant_type was invalid.', error.data.error);
    case 'invalid_client_id':
      return new SlackAuthError('Value passed for client_id was invalid.', error.data.error);
    case 'bad_client_secret':
      return new SlackAuthError('Value passed for client_secret was invalid.', error.data.error);
    case 'invalid_code':
      return new SlackAuthError('Value passed for code was invalid.', error.data.error);
    case 'bad_redirect_uri':
      return new SlackAuthError(
        'Value passed for redirect_uri did not match the redirect_uri in the original request.',
        error.data.error
      );
    case 'oauth_authorization_url_mismatch':
      return new SlackAuthError(
        'The OAuth flow was initiated on an incorrect version of the authorization url. The flow must be initiated via /oauth/v2/authorize.',
        error.data.error
      );
    case 'preview_feature_not_available':
      return new SlackAuthError(
        'Returned when the API method is not yet available on the team in context.',
        error.data.error
      );
    case 'cannot_install_an_org_installed_app':
      return new SlackAuthError(
        'Returned when the the org-installed app cannot be installed on a workspace.',
        error.data.error
      );
    case 'invalid_arguments':
      return new SlackAuthError('The method was called with invalid arguments.', error.data.error);
    case 'invalid_arg_name':
      return new SlackAuthError(
        'The method was passed an argument whose name falls outside the bounds of accepted or expected values. This includes very long names and names with non-alphanumeric characters other than _. If you get this error, it is typically an indication that you have made a very malformed API call.',
        error.data.error
      );
    case 'invalid_charset':
      return new SlackAuthError(
        'The method was called via a POST request, but the charset specified in the Content-Type header was invalid. Valid charset names are: utf-8 iso-8859-1.',
        error.data.error
      );
    case 'invalid_form_data':
      return new SlackAuthError(
        'The method was called via a POST request with Content-Type application/x-www-form-urlencoded or multipart/form-data, but the form data was either missing or syntactically invalid.',
        error.data.error
      );
    case 'invalid_post_type':
      return new SlackAuthError(
        'The method was called via a POST request, but the specified Content-Type was invalid. Valid types are: application/json application/x-www-form-urlencoded multipart/form-data text/plain.',
        error.data.error
      );
    case 'missing_post_type':
      return new SlackAuthError(
        'The method was called via a POST request and included a data payload, but the request did not include a Content-Type header.',
        error.data.error
      );
    case 'team_added_to_org':
      return new SlackAuthError(
        'The workspace associated with your request is currently undergoing migration to an Enterprise Organization. Web API and other platform operations will be intermittently unavailable until the transition is complete.',
        error.data.error
      );
    case 'request_timeout':
      return new SlackAuthError(
        'The method was called via a POST request, but the POST data was either missing or truncated.',
        error.data.error
      );
    case 'fatal_error':
      return new SlackAuthError(
        "The server could not complete your operation(s) without encountering a catastrophic error. It's possible some aspect of the operation succeeded before the error was raised.",
        error.data.error
      );
    case 'internal_error':
      return new SlackAuthError(
        "The server could not complete your operation(s) without encountering an error, likely due to a transient issue on our end. It's possible some aspect of the operation succeeded before the error was raised.",
        error.data.error
      );
  }
  return new SlackAuthError('Unknown Slack OAuth V2 Access error', 'unknown_error');
};

/**
 * Store result in DynamoDB. Really no need to store one team_id per id as if any Slack
 * workspace decides to revoke and re-install this is minimal and our table structure is
 * minimal. We have a small GSI on team_id if we need to do some checking on other areas
 * of the app.
 */
export const saveOauthV2AccessResponse = async (region: string, response: any): Promise<any> => {
  const docClient = new DynamoDB.DocumentClient({ region });
  const timestamp: string = new Date().toISOString();
  const uuid: string = uuidv4();

  await docClient
    .put({
      TableName: DB_NAME,
      Item: {
        id: uuid,
        team_id: response.team.id,
        team_name: response.team.name,
        created_at: timestamp,
        app_id: response.app_id,
        scope: response.scope,
        token_type: response.token_type,
        access_token: response.access_token,
        bot_user_id: response.bot_user_id,
        workflow_run_count: 0,
        last_workflow_date: '',
      },
    })
    .promise();

  return uuid;
};
