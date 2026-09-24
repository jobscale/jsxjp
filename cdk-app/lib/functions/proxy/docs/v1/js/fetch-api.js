export const getEnv = () => {
  if (location.hostname.match('127.0.0.')) {
    return 'local';
  }
  if (['dev.jsx.jp'].includes(location.hostname)) {
    return 'dev';
  }
  if (['stg.jsx.jp'].includes(location.hostname)) {
    return 'stg';
  }
  if (['jsx.jp', 'www.jsx.jp'].includes(location.hostname)) {
    return 'prod';
  }
  return 'test';
};

const endpointApi = {
  test: '',
  local: '',
  dev: 'https://dev-api.jsx.jp',
  stg: 'https://stg-api.jsx.jp',
  prod: 'https://api.jsx.jp',
}[getEnv()];

export const fetchApi = (path, opts = {}) => {
  const pathApi = `${endpointApi}${path}`;
  return fetch(pathApi, {
    credentials: 'include',
    ...opts,
  });
};
