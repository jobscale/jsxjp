const action = () => {
fetch('template.html')
.then(res => res.text())
.then(content => {
  document.body.innerHTML += content;
  const templates = document.querySelectorAll('div[id^=template-]');
  templates.forEach(template => {
    const inline = template.id.replace(/template/, 'inline');
    const fragment = document.querySelector(`#${inline}`);
    template.append(fragment.content);
  });
})
};
document.addEventListener('DOMContentLoaded', action);
