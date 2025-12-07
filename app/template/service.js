import fs from 'fs';

const formatTimestamp = (ts = Date.now()) => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}).format(new Date(ts));

export class Service {
  async load(id) {
    const template = id.split('-').join('/');
    const html = fs.readFileSync(`views/${template}.html`, 'utf-8');
    return html.replace('{{timestamp}}', await this.now());
  }

  async now() {
    return formatTimestamp();
  }
}

export const service = new Service();

export default { Service, service };
