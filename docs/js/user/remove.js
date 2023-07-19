/* global logger */

const wait = ms => new Promise(resolve => { setTimeout(resolve, ms); });
const loading = hide => {
  document.querySelector('#loading')
  .classList[hide ? 'add' : 'remove']('hide');
  return wait(1000);
}

class Remove {
  remove(event) {
    event.preventDefault();
    loading();
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
