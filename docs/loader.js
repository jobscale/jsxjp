class Loader {
  action() {
    const templates = document.querySelectorAll('div[id^=template-]');
    templates.forEach(template => {
      const inline = template.id.replace(/template/, 'inline');
      const fragment = document.querySelector(`#${inline}`);
      template.append(fragment.content);
    });
  }
  trigger() {
    fetch('template.html')
    .then(res => res.text())
    .then(content => {
      document.body.innerHTML += content;
      this.action();
    });
  }
}
document.addEventListener('DOMContentLoaded', () => new Loader().trigger());
