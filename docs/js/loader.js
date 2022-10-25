class Loader {
  action(placeholder) {
    const inline = placeholder.id.replace(/template/, 'inline');
    const fragment = document.querySelector(`#${inline}`);
    const head = fragment.content.querySelector('#in-head');
    if (head) {
      Array.from(head.children).forEach(child => {
        if (child.tagName !== 'SCRIPT') {
          document.head.appendChild(child);
          return;
        }
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = child.src;
        document.head.appendChild(script);
      });
    }
    const body = fragment.content.querySelector('#in-body');
    if (body) {
      Array.from(body.children).forEach(child => document.body.appendChild(child));
    }
    const content = fragment.content.querySelector('#in-content');
    if (content) {
      Array.from(content.children).forEach(child => placeholder.appendChild(child));
    }
  }

  trigger() {
    const placeholders = document.querySelectorAll('div[id^=template-]');
    placeholders.forEach(placeholder => {
      const params = ['/template', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          credentials: 'omit',
        },
        body: JSON.stringify({ id: placeholder.id }),
      }];
      this.fetch(...params)
      .then(res => res.text())
      .then(template => {
        document.body.innerHTML += template;
        this.action(placeholder);
      });
    });
  }
}

window.addEventListener('DOMContentLoaded', () => new Loader().trigger());
