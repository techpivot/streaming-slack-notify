import * as fs from 'fs';
import * as path from 'path';

/**
 * Parses the specified
 * @param fileName
 * @param vars
 * @returns string
 */
export const parseTemplate = (fileName: string, vars: { [key: string]: string } = {}): string => {
  let template = fs.readFileSync(path.resolve(__dirname, 'templates', fileName), {
    encoding: 'utf8',
    flag: 'r',
  });

  Object.keys(vars).forEach((key) => {
    template = template.replace(new RegExp('{{' + key + '}}', 'g'), vars[key]);
  });

  return template;
};

export const sleep = async (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getMemoryUsageMb = (): number => {
  return Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100;
};

/**
 * This output is specific for the GitHub workflow but we also use it in debug/server output as well.
 *
 * @param date1
 * @param date2
 */
export const getReadableDurationString = (date1: Date, date2: Date): string => {
  return getReadableDurationStringFromMs(Math.floor(Math.abs(date1.getTime() - date2.getTime())));
};

export const getReadableDurationStringFromMs = (milliseconds: number): string => {
  const result = [];
  let ms = milliseconds;
  let s = Math.floor(ms / 1000);
  ms = ms % 1000;
  let m = Math.floor(s / 60);
  s = s % 60;
  let h = Math.floor(m / 60);
  m = m % 60;
  const d = Math.floor(h / 24);
  h = h % 24;

  if (d > 0) {
    result.push(`${d}d`);
  }
  if (h > 0) {
    result.push(`${h}h`);
  }
  if (m > 0) {
    result.push(`${m}m`);
  }
  if (s > 0 || milliseconds === 0) {
    result.push(`${s}s`);
  }
  if (result.length === 0 && ms > 0) {
    result.push(`${ms}ms`);
  }

  return result.join(' ');
};
