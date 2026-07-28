setTimeout(() => {
  // const script = document.createElement('script');
  // script.src = '/assets/user-script.js';
  // document.body.appendChild(script);
  console.log('jsx.jp detected! Changing link background colors...');
  document.querySelectorAll('a').forEach(el => {
    el.style.backgroundColor = '#0f0';
  });
}, 2000);
