import { Event } from './types';

export const handler = async (event: Event): Promise<any> => {
  console.log('==> ', event);

  const body = {
    test: 1,
    test3: 2
  };

  return {
    statusCode: 200,
    isBase64Encoded: false,
    cookies: [],
    headers: {
      "Server": "TechPivot",
    },
    body: JSON.stringify(body),
  };
};
