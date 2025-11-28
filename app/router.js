// HTML ルーター
export class Router {
  constructor() {
    this.routes = [];
  }

  // ルート登録
  add(method, path, handler) {
    const paramNames = [];
    const regexPath = path.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    const regex = new RegExp(`^${regexPath}$`);
    this.routes.push({
      method: method.toUpperCase(),
      regexPath,
      regex,
      paramNames,
      handler,
    });
  }

  // サブルーターを前方一致でマージ
  use(prefix, subRouter) {
    subRouter.routes.forEach(route => {
      const regexPath = prefix + route.regexPath;
      const regex = new RegExp(`^${regexPath}$`);
      this.routes.push({
        method: route.method,
        regexPath,
        regex,
        paramNames: route.paramNames,
        handler: route.handler,
      });
    });
  }

  // リクエスト処理
  async handle(req, res) {
    const headers = new Headers(req.headers);
    const method = req.method.toUpperCase();
    const protocol = req.socket.encrypted ? 'https' : 'http';
    const host = headers.get('host');
    const { pathname } = new URL(`${protocol}://${host}${req.url}`);
    const route = this.routes.find(item => {
      if (method !== item.method) return false;
      if (!req.params) req.params = {};
      const match = pathname.match(item.regex);
      if (!match) return false;
      const params = {};
      item.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });
      Object.assign(req.params, params); // リクエストにパラメータを追加
      return true;
    });
    if (!route) return;
    const prom = route.handler(req, res);
    if (prom instanceof Promise) await prom;
  }
}

export const router = new Router();
export default { Router, router };
