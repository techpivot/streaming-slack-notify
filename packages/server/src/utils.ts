import { SSM } from 'aws-sdk';
import { GetParameterResult } from 'aws-sdk/clients/ssm';
import { REGION, SSM_PARAMETER_QUEUE_URL } from './const';

export const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getMemoryUsageMb = () => {
  return Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100;
};

const isMethod = (propertyName: string, value: any): boolean => {
  return propertyName !== 'constructor' && typeof value === 'function';
};

export const autoBind = (obj: any): void => {
  const propertyNames = Object.getOwnPropertyNames(obj.constructor.prototype);
  propertyNames.forEach((propertyName) => {
    const value = obj[propertyName];
    if (isMethod(propertyName, value)) {
      obj[propertyName] = value.bind(obj);
    }
  });
};

const numberEnding = (number: number): string => {
  return number > 1 ? 's' : '';
};

export const getReadableElapsedTime = (date1: Date, date2: Date): string => {
  const milliseconds = Math.abs(date1.getTime() - date2.getTime());

  let temp = Math.floor(milliseconds / 1000);

  const years = Math.floor(temp / 31536000);
  if (years) {
    return years + ' year' + numberEnding(years);
  }

  const days = Math.floor((temp %= 31536000) / 86400);
  if (days) {
    return days + ' day' + numberEnding(days);
  }

  const hours = Math.floor((temp %= 86400) / 3600);
  if (hours) {
    return hours + ' hour' + numberEnding(hours);
  }

  const minutes = Math.floor((temp %= 3600) / 60);
  if (minutes) {
    return minutes + ' minute' + numberEnding(minutes);
  }

  const seconds = temp % 60;
  if (seconds) {
    return seconds + ' second' + numberEnding(seconds);
  }

  return 'less than a second';
};

export const getReadableDurationString = (dateOne: Date, dateTwo: Date): string => {
  let d, h, m, s;

  s = Math.floor(Math.abs(dateOne.getTime() - dateTwo.getTime()) / 1000);
  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;

  const result = [];
  if (d > 0) {
    result.push(`${d}d`);
  }
  if (h > 0) {
    result.push(`${h}h`);
  }
  if (m > 0) {
    result.push(`${m}m`);
  }
  if (s > 0) {
    result.push(`${s}s`);
  }

  return result.join(' ');
};

export const getSqsQueueUrl = async (): Promise<string> => {
  const ssm = new SSM({ region: REGION });

  try {
    const response: GetParameterResult = await ssm
      .getParameter({
        Name: SSM_PARAMETER_QUEUE_URL,
        WithDecryption: true,
      })
      .promise();

    if (!response.Parameter) {
      throw new Error('Successfully queried parameter store but no Parameter was received');
    }

    if (!response.Parameter.Value) {
      throw new Error('Successfully queried parameter store but no Parameter value was received');
    }

    return response.Parameter.Value;
  } catch (err) {
    console.error('Error: Unable to connect to AWS Parameter Store to retrieve queue URL');
    console.error(err);
    process.exit(1);
  }
};
