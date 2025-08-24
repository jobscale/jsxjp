export class Service {
  async now() {
    return new Date().toISOString();
  }
}

export const service = new Service();

export default {
  Service,
  service,
};
