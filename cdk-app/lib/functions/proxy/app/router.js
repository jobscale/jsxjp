// HTML ルーター
// 静的パスは Map で O(1) ルックアップ、動的パスのみ線形走査する
export class Router {
  constructor() {
    // path -> Map<method, handler>
    this.staticMap = new Map();
    // { path, regex, paramNames, methodMap: Map<method, handler> }
    this.dynamicList = [];
    // { prefix, methodMap: Map<method, handler> }
    this.prefixList = [];
  }

  // ルート登録
  add(method, path, handler) {
    const upper = method.toUpperCase();
    if (!path.includes(':')) {
      let methods = this.staticMap.get(path);
      if (!methods) {
        methods = new Map();
        this.staticMap.set(path, methods);
      }
      methods.set(upper, handler);
      return;
    }
    const paramNames = [];
    const regexPath = path.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    let entry = this.dynamicList.find(item => item.path === path);
    if (!entry) {
      entry = {
        path,
        regex: new RegExp(`^${regexPath}$`),
        paramNames,
        methodMap: new Map(),
      };
      this.dynamicList.push(entry);
    }
    entry.methodMap.set(upper, handler);
  }

  // サブルーターを前方一致でマージ
  merge(prefix, subRouter) {
    const norm = prefix.replace(/\/+$/, '');
    const join = suffix => `${norm}${suffix}` || '/';
    for (const [suffix, methodMap] of subRouter.staticMap) {
      for (const [method, handler] of methodMap) {
        this.add(method, join(suffix), handler);
      }
    }
    for (const entry of subRouter.dynamicList) {
      for (const [method, handler] of entry.methodMap) {
        this.add(method, join(entry.path), handler);
      }
    }
  }

  use(prefix, handler) {
    for (const subRouter of [handler].flat()) {
      if (subRouter instanceof Router) {
        this.merge(prefix, subRouter);
      } else {
        this.middleware(prefix, subRouter);
      }
    }
  }

  middleware(prefix, handler) {
    const normalizedPrefix = prefix.replace(/\/+$/, '') || '/';
    const entry = this.prefixList.find(item => item.prefix === normalizedPrefix);
    if (entry) {
      ['GET', 'POST', 'HEAD'].forEach(method => {
        entry.methodMap.get(method).push(handler);
      });
      return;
    }
    const methodMap = new Map();
    ['GET', 'POST', 'HEAD'].forEach(method => {
      methodMap.set(method, [handler]);
    });
    this.prefixList.push({ prefix: normalizedPrefix, methodMap });
  }

  // メソッド + pathname に対して { handler, params } / { methodNotAllowed, allow } / null を返す
  match(method, pathname) {
    const staticMethods = this.staticMap.get(pathname);
    if (staticMethods) {
      const handler = staticMethods.get(method);
      if (handler) return { handler, params: {} };
      return { methodNotAllowed: true, allow: [...staticMethods.keys()] };
    }
    for (const entry of this.dynamicList) {
      const m = entry.regex.exec(pathname);
      if (!m) continue;
      const handler = entry.methodMap.get(method);
      if (!handler) {
        return { methodNotAllowed: true, allow: [...entry.methodMap.keys()] };
      }
      const params = {};
      entry.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(m[i + 1]);
      });
      return { handler, params };
    }
    return null;
  }

  // リクエスト処理
  async handle(req, res) {
    const ctx = req.ctx ?? {};
    const method = ctx.method ?? req.method.toUpperCase();
    const pathname = ctx.pathname
      ?? new URL(req.url, `http://${req.headers.host ?? 'localhost'}`).pathname;
    for (const { prefix, methodMap } of this.prefixList) {
      const matches = pathname === prefix
        || pathname.startsWith(`${prefix.replace(/\/+$/, '')}/`);
      const middleware = methodMap.get(method);
      if (!matches || !middleware) continue;
      for (const prefixHandler of middleware.flat()) {
        if (res.writableEnded) return;
        await prefixHandler(req, res);
      }
      if (res.writableEnded) return;
    }
    const result = this.match(method, pathname);
    if (!result) return;
    if (result.methodNotAllowed) {
      res.setHeader('Allow', result.allow.join(', '));
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Method Not Allowed' }));
      return;
    }
    if (!req.params) req.params = {};
    Object.assign(req.params, result.params);
    for (const handler of [result.handler].flat()) {
      if (res.writableEnded) return;
      await handler(req, res);
    }
  }
}

export const router = new Router();
export default { Router, router };
