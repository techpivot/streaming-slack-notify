export const sleep = async (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getMemoryUsageMb = (): number => {
  return Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100;
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
