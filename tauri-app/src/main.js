const empty = () => {};
const { invoke } = window.__TAURI__?.core ?? { invoke: empty };
const getCurrentWindow = window.__TAURI__?.window?.getCurrentWindow ?? (() => ({
  requestUserAttention: empty,
  setBadgeCount: empty,
}));

const store = {
  greetInputEl: undefined,
  greetMsgEl: undefined,
  icon: 0,
  iconList: ['normal', 'notification'],
};

const notifyUser = async () => {
  const appWindow = getCurrentWindow();
  await appWindow.requestUserAttention(1);
};

const setBadgeCount = async () => {
  const appWindow = getCurrentWindow();
  await appWindow.setBadgeCount(1);
};

const redirect = url => {
  setTimeout(() => {
    location.href = url;
  }, 1000);
};

const setNotification = () => {
  store.icon = (store.icon + 1) % store.iconList.length;
  invoke('change_app_icon', { status: store.iconList[store.icon] });
};

const greet = async () => {
  notifyUser();
  setBadgeCount();
  store.greetMsgEl.textContent = await invoke('greet', { name: store.greetInputEl.value });
  if (store.greetInputEl.value.startsWith('https://')) {
    redirect(store.greetInputEl.value);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  store.greetInputEl = document.querySelector('#greet-input');
  store.greetMsgEl = document.querySelector('#greet-msg');
  document.querySelectorAll('.link').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      redirect(el.dataset.href);
    });
  });
  setInterval(setNotification, 2000);
  document.querySelector('#greet-form').addEventListener('submit', e => {
    e.preventDefault();
    greet();
  });
});
