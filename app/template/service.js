import fs from 'fs/promises';

const formatTimestamp = (ts = Date.now(), withoutTimezone = false) => {
  const timestamp = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(ts));
  if (withoutTimezone) return timestamp;
  return `${timestamp}+09:00`;
};

export class Service {
  async load(id) {
    const template = id.split('-').join('/');
    return fs.readFile(`views/${template}.html`, 'utf-8')
    .then(async html => html.replace('{{timestamp}}', await this.now()))
    .catch(() => '');
  }

  async now() {
    return formatTimestamp();
  }
}

export const service = new Service();
export default { Service, service };
