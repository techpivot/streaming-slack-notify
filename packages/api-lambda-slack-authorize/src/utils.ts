import * as fs from 'fs';
import * as path from 'path';

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
