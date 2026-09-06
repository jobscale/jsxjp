const allowMethods = ['GET', 'POST', 'HEAD'];

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
      allowMethods.forEach(method => {
        entry.methodMap.get(method).push(handler);
      });
      return;
    }
    const methodMap = new Map();
    allowMethods.forEach(method => {
      methodMap.set(method, [handler]);
    });
    this.prefixList.push({ prefix: normalizedPrefix, methodMap });
  }

  // メソッド + pathname に対して { handler, params } / { methodNotAllowed, allow } / null を返す
  match(method, pathname) {
    const staticMethods = this.staticMap.get(pathname);
    if (staticMethods) {
      const handler = staticMethods.get(method) ?? [];
      return { handler, params: {} };
    }
    for (const entry of this.dynamicList) {
      const m = entry.regex.exec(pathname);
      if (!m) continue;
      const handler = entry.methodMap.get(method) ?? [];
      const params = {};
      entry.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(m[i + 1]);
      });
      return { handler, params };
    }
    return undefined;
  }

  // リクエスト処理
  async handle(req, res) {
    const { pathname } = req.ensure.url;
    for (const { prefix, methodMap } of this.prefixList) {
      const matches = pathname.startsWith(`${prefix.replace(/\/+$/, '')}/`);
      const middleware = methodMap.get(req.method);
      if (!matches || !middleware) continue;
      for (const prefixHandler of middleware.flat()) {
        if (res.writableEnded) return;
        await prefixHandler(req, res);
      }
      if (res.writableEnded) return;
    }
    const result = this.match(req.method, pathname);
    if (!result) return;
    if (!req.params) req.params = {};
    Object.assign(req.params, result.params);
    for (const handler of [result.handler].flat()) {
      if (res.writableEnded) return;
      const pending = handler(req, res);
      if (pending instanceof Promise) await pending;
    }
  }
}

export const router = new Router();
export default { Router, router };
