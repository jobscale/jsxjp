/* global logger */

class Remove {
  wait(ms) {
    new Promise(resolve => { setTimeout(resolve, ms); });
  }

  loading(hide) {
    document.querySelector('#loading')
    .classList[hide ? 'add' : 'remove']('hide');
    return this.wait(1000);
  }

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
    return fetch(...params)
    .then(() => document.location.reload());
  }

  trigger() {
    document.querySelectorAll('.btn-remove')
    .forEach(el => el.addEventListener('click', event => this.remove(event)));
  }
}

window.addEventListener('DOMContentLoaded', () => new Remove().trigger());
