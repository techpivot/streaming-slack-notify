type Event = { a: string; b: number };

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
      "X-Test": "customval1",
    },
    body: JSON.stringify(body),
  };
};
