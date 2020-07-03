import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { BaseError, ValidationError } from '../../common/lib/errors';


export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  let statusCode = 200;

  console.log('event', event);
  console.log('context', context);
  const body: any = {
    ok: true,
  };

  try {

    // All done!
  } catch (error) {
    // If the error is one of our errors, display appropriately; Otherwise, throw 500
    if (error instanceof BaseError) {
      statusCode = error.getStatusCode();
    } else {
      statusCode = 500;
    }

    // Log the full error in CloudWatch
    console.error(error);
    console.error('Returning with statusCode: ' + statusCode);

    body.ok = false;
    body.error = {
      message: error.message || error,
      name: error.name,
    };
  }

  return {
    statusCode,
    isBase64Encoded: false,
    headers: {
      Server: 'TechPivot',
      'Content-Type': 'text/javascript',
    },
    body: JSON.stringify(body),
  };
};
