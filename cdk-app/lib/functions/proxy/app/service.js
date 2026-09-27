import { formatTimestamp } from './timestamp.js';

export class Service {
  async now() {
    return formatTimestamp();
  }

  async nowWithoutTimezone() {
    return formatTimestamp({ tz: false });
  }
}

export const service = new Service();
export default { Service, service };
