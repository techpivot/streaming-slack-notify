export class BaseError extends Error {
  name: string;
  statusCode: number;

  constructor(message: string, name: string, statusCode: number) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
  }

  public getStatusCode(): number {
    return this.statusCode;
  }
}

export class InvalidJsonError extends BaseError {
  constructor(message: string) {
    super(message, 'InvalidJsonError', 400);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string) {
    super(message, 'ValidationError', 400);
  }
}

export const sanitizeErrorForTemplates = (error: string): string => {
  error = error.replace(/[:]\d{12}[:]/, ':XXXXXXXXXXXX:');

  return error;
};

export class GitHubAppValidationError extends BaseError {
  constructor(message: string) {
    super(message, 'GitHubAppValidationError', 400);
  }
}

export class SlackApplicationAuthError extends BaseError {
  constructor(message: string, name: string) {
    super(message, name, 400);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(message, 'NotFoundError', 400);
  }
}

export const generateReadableSlackError = (error: any): SlackApplicationAuthError => {
  if (!error.data || !error.data.error) {
    return new SlackApplicationAuthError('Unknown Slack OAuth V2 Access error', 'unknown_error');
  }

  switch (error.data.error) {
    case 'invalid_grant_type':
      return new SlackApplicationAuthError('Value passed for grant_type was invalid.', error.data.error);
    case 'invalid_client_id':
      return new SlackApplicationAuthError('Value passed for client_id was invalid.', error.data.error);
    case 'bad_client_secret':
      return new SlackApplicationAuthError('Value passed for client_secret was invalid.', error.data.error);
    case 'invalid_code':
      return new SlackApplicationAuthError('Value passed for code was invalid.', error.data.error);
    case 'bad_redirect_uri':
      return new SlackApplicationAuthError(
        'Value passed for redirect_uri did not match the redirect_uri in the original request.',
        error.data.error
      );
    case 'oauth_authorization_url_mismatch':
      return new SlackApplicationAuthError(
        'The OAuth flow was initiated on an incorrect version of the authorization url. The flow must be initiated via /oauth/v2/authorize.',
        error.data.error
      );
    case 'preview_feature_not_available':
      return new SlackApplicationAuthError(
        'Returned when the API method is not yet available on the team in context.',
        error.data.error
      );
    case 'cannot_install_an_org_installed_app':
      return new SlackApplicationAuthError(
        'Returned when the the org-installed app cannot be installed on a workspace.',
        error.data.error
      );
    case 'invalid_arguments':
      return new SlackApplicationAuthError('The method was called with invalid arguments.', error.data.error);
    case 'invalid_arg_name':
      return new SlackApplicationAuthError(
        'The method was passed an argument whose name falls outside the bounds of accepted or expected values. This includes very long names and names with non-alphanumeric characters other than _. If you get this error, it is typically an indication that you have made a very malformed API call.',
        error.data.error
      );
    case 'invalid_charset':
      return new SlackApplicationAuthError(
        'The method was called via a POST request, but the charset specified in the Content-Type header was invalid. Valid charset names are: utf-8 iso-8859-1.',
        error.data.error
      );
    case 'invalid_form_data':
      return new SlackApplicationAuthError(
        'The method was called via a POST request with Content-Type application/x-www-form-urlencoded or multipart/form-data, but the form data was either missing or syntactically invalid.',
        error.data.error
      );
    case 'invalid_post_type':
      return new SlackApplicationAuthError(
        'The method was called via a POST request, but the specified Content-Type was invalid. Valid types are: application/json application/x-www-form-urlencoded multipart/form-data text/plain.',
        error.data.error
      );
    case 'missing_post_type':
      return new SlackApplicationAuthError(
        'The method was called via a POST request and included a data payload, but the request did not include a Content-Type header.',
        error.data.error
      );
    case 'team_added_to_org':
      return new SlackApplicationAuthError(
        'The workspace associated with your request is currently undergoing migration to an Enterprise Organization. Web API and other platform operations will be intermittently unavailable until the transition is complete.',
        error.data.error
      );
    case 'request_timeout':
      return new SlackApplicationAuthError(
        'The method was called via a POST request, but the POST data was either missing or truncated.',
        error.data.error
      );
    case 'fatal_error':
      return new SlackApplicationAuthError(
        "The server could not complete your operation(s) without encountering a catastrophic error. It's possible some aspect of the operation succeeded before the error was raised.",
        error.data.error
      );
    case 'internal_error':
      return new SlackApplicationAuthError(
        "The server could not complete your operation(s) without encountering an error, likely due to a transient issue on our end. It's possible some aspect of the operation succeeded before the error was raised.",
        error.data.error
      );
  }
  return new SlackApplicationAuthError('Unknown Slack OAuth V2 Access error', 'unknown_error');
};
