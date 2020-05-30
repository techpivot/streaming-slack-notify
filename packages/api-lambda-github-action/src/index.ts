//import { Context, Event, OauthV2AccessResponse } from './types';
import { BaseError } from '../../common/lib/errors';

export const handler = async (event: any, context: any): Promise<any> => {
  let statusCode: number = 200;
  let body: object = {};
  const isBase64Encoded: boolean = false;
  const cookies: string[] = [];
  const headers = {
    Server: 'TechPivot',
    'Content-Type': 'text/javascript',
  };

  try {
    statusCode = 200;
    console.log('event', event);
    console.log('ctx', context);
    //console.log('args', arguments);
    body = {
      test: 'val',
    };
  } catch (error) {
    // Log the full error in CloudWatch
    console.error(error);

    // If the error is one of our errors, display appropriately; Otherwise, throw 500
    if (error instanceof BaseError) {
      statusCode = error.getStatusCode();
    } else {
      statusCode = 500;
    }
    /*body = parseTemplate('error.html', {
      errorMessage: error.message || 'Unknown',
      errorType: error.name || error.code || 'Unknown error type',
    });*/
  } finally {
    return {
      statusCode,
      isBase64Encoded,
      cookies,
      headers,
      body,
    };
  }
};
