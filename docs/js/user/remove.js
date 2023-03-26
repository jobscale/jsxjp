/* global logger */
/* global App */
class Remove extends App {
  remove(event) {
    event.preventDefault();
    this.loading();
    this.removeInternal(event.currentTarget)
    .catch(e => logger.error(e.message));
  }

  async removeInternal(target) {
    const { id } = target.dataset;
    const params = ['/user/remove', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        credentials: 'omit',
      },
      body: JSON.stringify({ id }),
    }];
    return this.fetch(...params)
    .then(() => document.location.reload());
  }

  trigger() {
    document.querySelectorAll('.btn-remove')
    .forEach(el => el.addEventListener('click', event => this.remove(event)));
  }
}

window.addEventListener('DOMContentLoaded', () => new Remove().trigger());
