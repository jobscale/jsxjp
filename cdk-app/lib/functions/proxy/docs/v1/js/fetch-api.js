export const fetchApi = (path, opts = {}) => {
  const endpointApi = 'https://api.jsx.jp';
  const pathApi = `${endpointApi}${path}`;
  return fetch(pathApi, {
    credentials: 'include',
    ...opts,
  });
};
