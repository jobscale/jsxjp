import fs from 'fs/promises';
import path from 'path';
import { formatTimestamp } from '../timestamp.js';

export class Service {
  async load(id) {
    const template = id.split('-').join('/');
    const file = path.join(import.meta.dirname, '../..', 'views', `${template}.html`);
    return fs.readFile(file, 'utf-8')
    .then(async html => html.replace('{{timestamp}}', await this.now()))
    .catch(() => '');
  }

  async now() {
    return formatTimestamp();
  }
}

export const service = new Service();
export default { Service, service };
