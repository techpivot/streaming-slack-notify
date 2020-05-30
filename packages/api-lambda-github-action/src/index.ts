//import { Context, Event, OauthV2AccessResponse } from './types';
import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { BaseError } from '../../common/lib/errors';


export const handler = async (event: any, context: Context): Promise<APIGatewayProxyResult> => {
  let statusCode: number = 200;
  let body: object = {};

  try {
    console.log('event', event);
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

  } finally {
    return {
      statusCode,
      isBase64Encoded: false,
      headers: {
        Server: 'TechPivot',
        'Content-Type': 'text/javascript',
      },
      body: JSON.stringify(body),
    };
  }
};
