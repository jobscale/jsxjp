import fs from 'fs';
import path from 'path';
import mime from 'mime';
import puppeteer from 'puppeteer';

const nativeLogger = console;
const docsDir = path.join(process.cwd(), 'docs');
const settleMs = 2800;
const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn7kL8AAAAASUVORK5CYII=',
  'base64',
);
const dataImage = `data:image/png;base64,${transparentPng.toString('base64')}`;

const vueShim = `
export const reactive = value => value
export const nextTick = callback => Promise.resolve().then(() => callback?.())
export const createApp = component => ({
  mount(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    const state = component?.setup ? (component.setup() ?? {}) : {}
    const instance = Object.assign(state, {
      $el: el,
      $nextTick: nextTick,
    })
    Promise.resolve().then(() => component?.mounted?.call(instance))
    return instance
  },
})
`;

const loggerShim = `
const emit = (callback, args) => {
  if (typeof callback !== 'function') return
  try {
    callback({ recipe: args })
  } catch {}
}
const buildLogger = callback => ({
  info(...args) {
    emit(callback, args)
    console.info(...args)
  },
  warn(...args) {
    emit(callback, args)
    console.warn(...args)
  },
  error(...args) {
    emit(callback, args)
    console.error(...args)
  },
  debug(...args) {
    emit(callback, args)
    console.debug(...args)
  },
})
export const logger = buildLogger()
export const createLogger = (level = 'info', options = {}) => buildLogger(options.callback)
`;

const html2canvasShim = `
export default async function html2canvas(el) {
  const canvas = document.createElement('canvas')
  const width = Math.max(el?.clientWidth ?? 1, 1)
  const height = Math.max(el?.clientHeight ?? 1, 1)
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'
    ctx.fillRect(0, 0, width, height)
  }
  return canvas
}
`;

const browserShim = `
(() => {
  const noop = () => {}
  const define = (target, key, value) => {
    try {
      Object.defineProperty(target, key, {
        configurable: true,
        writable: true,
        value,
      })
    } catch {
      try {
        target[key] = value
      } catch {}
    }
  }

  class StubNotification {
    constructor(title, options = {}) {
      this.title = title
      this.options = options
    }
  }
  StubNotification.permission = 'granted'
  StubNotification.requestPermission = async () => 'granted'
  define(globalThis, 'Notification', StubNotification)

  class StubAudio {
    constructor() {
      this.currentTime = 0
    }
    async play() {}
  }
  define(globalThis, 'Audio', StubAudio)

  class StubAudioContext {
    constructor() {
      this.destination = {}
    }
    addEventListener() {}
    async decodeAudioData() {
      return {}
    }
    createBufferSource() {
      return {
        connect: noop,
        disconnect: noop,
        addEventListener: noop,
        start: noop,
      }
    }
  }
  define(globalThis, 'AudioContext', StubAudioContext)
  define(globalThis, 'webkitAudioContext', StubAudioContext)

  define(globalThis, 'focus', noop)
  define(globalThis, 'scrollTo', noop)

  if (globalThis.HTMLElement?.prototype?.scrollIntoView) {
    globalThis.HTMLElement.prototype.scrollIntoView = noop
  }
  if (globalThis.HTMLMediaElement?.prototype?.play) {
    globalThis.HTMLMediaElement.prototype.play = async function play() {}
  }

  define(globalThis.navigator, 'clipboard', {
    writeText: async () => undefined,
  })

  define(globalThis.navigator, 'serviceWorker', {
    register: async () => ({ scope: globalThis.location.origin }),
    ready: Promise.resolve({
      pushManager: {
        getSubscription: async () => ({
          endpoint: 'https://example.test/subscription',
        }),
        subscribe: async () => ({
          endpoint: 'https://example.test/subscription',
        }),
      },
    }),
    addEventListener: noop,
  })

  define(globalThis, 'mqtt', {
    connect: () => ({
      publish: noop,
      on: noop,
      end: noop,
    }),
  })

  if (globalThis.crypto && !globalThis.crypto.randomBytes) {
    define(globalThis.crypto, 'randomBytes', (size = 16) => {
      const data = new Uint8Array(size)
      globalThis.crypto.getRandomValues(data)
      return {
        toString(encoding) {
          if (encoding === 'hex') {
            return Array.from(data)
            .map(value => value.toString(16).padStart(2, '0'))
            .join('')
          }
          return Array.from(data).join(',')
        },
      }
    })
  }
})()
`;

const wait = ms => new Promise(resolve => { setTimeout(resolve, ms); });
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
};

const findHtmlFiles = dir => {
  const files = [];
  const walk = currentDir => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const nextPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(nextPath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith('.html')) {
        files.push(nextPath);
      }
    }
  };
  walk(dir);
  return files;
};

const htmlPathToRoute = htmlPath => {
  const relative = path.relative(docsDir, htmlPath).replaceAll(path.sep, '/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) {
    return `/${relative.slice(0, -'index.html'.length)}`;
  }
  return `/${relative}`;
};

const getTargetRoutes = () => {
  const routes = findHtmlFiles(docsDir).map(htmlPathToRoute);
  return routes.sort((a, b) => {
    if (a === '/') return -1;
    if (b === '/') return 1;
    return a.localeCompare(b);
  });
};

const createStaticResponse = (pathname, method = 'GET') => {
  let filePath = path.join(docsDir, decodeURIComponent(pathname));
  if (!filePath.startsWith(docsDir)) return false;
  if (!fs.existsSync(filePath)) return false;

  let stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    filePath = path.join(filePath, 'index.html');
    if (!fs.existsSync(filePath)) return false;
    stat = fs.statSync(filePath);
  }

  const contentType = mime.getType(filePath) ?? 'application/octet-stream';
  return {
    status: 200,
    contentType,
    body: method === 'HEAD' ? '' : fs.readFileSync(filePath),
    headers: {
      'Content-Length': String(stat.size),
    },
  };
};

const createStubResponse = (pathname, method) => {
  const json = body => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

  if (pathname === '/auth/sign' && method === 'HEAD') {
    return {
      status: 200,
      contentType: 'text/plain',
      body: '',
      headers: {
        Date: new Date().toUTCString(),
      },
    };
  }

  if (pathname === '/auth/sign') {
    return json({ login: 'tester', role: 'staff' });
  }

  if (pathname === '/auth/login') {
    return json({ href: '/' });
  }

  if (pathname === '/auth/totp') {
    return json({ list: ['000000'] });
  }

  if (pathname === '/api/getNumber') {
    return json({ image: dataImage, secret: '1234' });
  }

  if (pathname === '/api/sendmail') {
    return json({ ok: true });
  }

  if (pathname === '/api/public') {
    return {
      status: 200,
      contentType: 'text/plain',
      body: 'AQAB',
    };
  }

  if (pathname === '/api/subscription') {
    return json({ ok: true });
  }

  if (pathname === '/account/password') {
    return json({ ok: true });
  }

  if (pathname === '/user/register') {
    return json({ ok: true });
  }

  if (pathname === '/user/reset') {
    return json({ ok: true });
  }

  if (pathname === '/user/find') {
    return json({ rows: [] });
  }

  if (pathname === '/user/remove') {
    return json({ ok: true });
  }

  if (pathname === '/s/register') {
    return json({ id: 'stub-id' });
  }

  if (pathname === '/s/find') {
    return json({ rows: [] });
  }

  if (pathname === '/s/remove') {
    return json({ ok: true });
  }

  if (pathname === '/picts/find') {
    return json({ images: [] });
  }

  if (pathname === '/picts/getData') {
    return json({ tags: {}, imageTags: {} });
  }

  if (pathname === '/picts/putData') {
    return json({ ok: true });
  }

  if (pathname === '/picts/upload') {
    return json({ ok: true });
  }

  if (pathname === '/picts/remove') {
    return json({ ok: true });
  }

  if (pathname.startsWith('/picts/i/') || pathname.startsWith('/picts/t/')) {
    return {
      status: 200,
      contentType: 'image/png',
      body: transparentPng,
    };
  }

  if (pathname === '/plan-pulse/hub') {
    return json({
      hub: { title: 'Stub Hub', plan: [] },
      persons: [],
    });
  }

  if (pathname === '/plan-pulse/putHub') {
    return json({ hubId: 'stub-hub' });
  }

  if (pathname === '/plan-pulse/putPerson') {
    return json({ personId: 'stub-person' });
  }

  if (pathname === '/plan-pulse/removePerson') {
    return json({ ok: true });
  }

  return null;
};

const installInterception = async (page, origin) => {
  await page.setRequestInterception(true);
  page.on('request', async request => {
    if (request.isInterceptResolutionHandled()) return;
    const url = request.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      await request.continue();
      return;
    }

    const parsed = new URL(url);

    if (
      parsed.hostname === 'cdn.jsdelivr.net'
      && parsed.pathname === '/npm/vue@3/dist/vue.esm-browser.min.js'
    ) {
      await request.respond({
        status: 200,
        contentType: 'text/javascript',
        body: vueShim,
        headers: corsHeaders,
      });
      return;
    }

    if (parsed.hostname === 'esm.sh' && parsed.pathname === '/@jobscale/logger') {
      await request.respond({
        status: 200,
        contentType: 'text/javascript',
        body: loggerShim,
        headers: corsHeaders,
      });
      return;
    }

    if (parsed.hostname === 'esm.sh' && parsed.pathname === '/html2canvas@1.4.1') {
      await request.respond({
        status: 200,
        contentType: 'text/javascript',
        body: html2canvasShim,
        headers: corsHeaders,
      });
      return;
    }

    if (parsed.hostname === 'fonts.googleapis.com') {
      await request.respond({
        status: 200,
        contentType: 'text/css',
        body: '',
        headers: corsHeaders,
      });
      return;
    }

    if (parsed.hostname === 'fonts.gstatic.com') {
      await request.respond({
        status: 200,
        contentType: 'font/woff2',
        body: '',
        headers: corsHeaders,
      });
      return;
    }

    if (parsed.origin === origin) {
      if (parsed.pathname === '/menu') {
        await request.respond(createStaticResponse('/menu/', request.method()));
        return;
      }
      const staticResponse = createStaticResponse(parsed.pathname, request.method());
      if (staticResponse) {
        await request.respond(staticResponse);
        return;
      }
      const stub = createStubResponse(parsed.pathname, request.method());
      if (stub) {
        await request.respond(stub);
        return;
      }
      await request.respond({
        status: 404,
        contentType: 'text/plain',
        body: 'Not Found',
      });
      return;
    }

    await request.continue();
  });
};

const run = async () => {
  const routes = getTargetRoutes();
  const origin = 'http://docs.local';
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results = [];
  try {
    for (const route of routes) {
      const page = await browser.newPage();
      const failures = [];

      await page.setViewport({ width: 1440, height: 900 });
      await page.evaluateOnNewDocument(browserShim);
      await installInterception(page, origin);

      page.on('pageerror', error => {
        failures.push(`pageerror: ${error.message}`);
      });

      page.on('console', message => {
        if (message.type() === 'error') {
          failures.push(`console: ${message.text()}`);
        }
      });

      page.on('requestfailed', request => {
        const errorText = request.failure()?.errorText ?? 'unknown';
        if (errorText === 'net::ERR_ABORTED') return;
        failures.push(
          `requestfailed: ${request.method()} ${request.url()} (${errorText})`,
        );
      });

      page.on('response', response => {
        const status = response.status();
        if (status < 400) return;
        failures.push(`response: ${status} ${response.url()}`);
      });

      const target = new URL(route, origin).toString();
      try {
        await page.goto(target, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction('document.readyState !== "loading"');
        await wait(settleMs);
      } catch (error) {
        failures.push(`navigation: ${error.message}`);
      }

      const uniqueFailures = [...new Set(failures)];
      results.push({
        route,
        failures: uniqueFailures,
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  const failed = results.filter(result => result.failures.length);
  if (!failed.length) {
    nativeLogger.info(`Checked ${results.length} docs pages with Puppeteer: all passed`);
    return;
  }

  for (const result of failed) {
    nativeLogger.error(`[fail] ${result.route}`);
    for (const failure of result.failures) {
      nativeLogger.error(`  - ${failure}`);
    }
  }
  throw new Error(`Docs smoke check failed on ${failed.length}/${results.length} pages`);
};

await run();
