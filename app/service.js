const formatTimestamp = ts => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}).format(ts ? new Date(ts) : new Date());

export class Service {
  async now() {
    return formatTimestamp();
  }
}

export const service = new Service();

export default { Service, service };
