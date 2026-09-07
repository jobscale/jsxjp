import { describe, expect, jest, it } from '@jest/globals';

// このテストは route.js に登録された「実際の全ハンドラ」を対象に、
// Router#handle の契約 (Promise を return するか、res.end() 済みで同期完了するか) を検証する。
// 外部 I/O (AWS SDK / メール / Push / Slack / fetch) のみを境界としてモックし、
// アプリ内のコントローラ/サービスは本物のコードを実行する。
process.env.ENV = 'test';
process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs20.x';
process.env.DETA_PROJECT_KEY = 'test-deta-key';
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';

const mockLogger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
jest.unstable_mockModule('@jobscale/create-logger', () => ({ logger: mockLogger }));

const mockS3Client = { send: jest.fn().mockResolvedValue({}) };
jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => mockS3Client),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  CreateBucketCommand: jest.fn(),
}));

const mockSsmClient = {
  send: jest.fn().mockResolvedValue({
    Parameters: [],
    Parameter: { Value: JSON.stringify({}) },
  }),
};
jest.unstable_mockModule('@aws-sdk/client-ssm', () => ({
  SSMClient: jest.fn(() => mockSsmClient),
  GetParameterCommand: jest.fn(),
  PutParameterCommand: jest.fn(),
  GetParametersByPathCommand: jest.fn(),
  DeleteParameterCommand: jest.fn(),
}));

jest.unstable_mockModule('sharp', () => ({
  default: jest.fn(() => ({
    metadata: jest.fn().mockResolvedValue({ format: 'jpeg' }),
    resize: jest.fn().mockReturnThis(),
    toFormat: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('thumb')),
  })),
}));
jest.unstable_mockModule('web-push', () => ({
  default: {
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn().mockResolvedValue({}),
  },
}));
jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({}),
      close: jest.fn(),
    }),
  },
}));
jest.unstable_mockModule('@jobscale/slack', () => ({
  Slack: jest.fn().mockImplementation(() => ({ send: jest.fn().mockResolvedValue({}) })),
}));

globalThis.fetch = jest.fn().mockResolvedValue({
  json: async () => ({}),
  text: async () => '',
});

const { route } = await import('../app/route.js');

// req/res に触れるどんなプロパティ・メソッド呼び出し・テンプレートリテラル展開・for-of にも
// 同期例外を投げずに応答する「無限プロキシ」。実際のコントローラ/サービスを
// モックなしで直接呼び出すために使う。
const createDeepMock = (label = 'mock') => new Proxy(() => {}, {
  get(_target, prop) {
    if (prop === 'then') return undefined;
    if (prop === 'toString' || prop === 'valueOf') return () => label;
    if (prop === Symbol.toPrimitive) return () => label;
    if (prop === Symbol.iterator) return () => undefined;
    return createDeepMock(`${label}.${String(prop)}`);
  },
  apply() {
    return createDeepMock(`${label}()`);
  },
  has() { return true; },
});

const createRecordingRes = () => ({
  statusCode: 200,
  writableEnded: false,
  headers: {},
  body: undefined,
  setHeader(name, value) { this.headers[name] = value; },
  getHeader(name) { return this.headers[name]; },
  contentType(value) { this.headers['Content-Type'] = value; },
  status(code) { this.statusCode = code; return this; },
  writeHead(code, h = {}) {
    this.statusCode = code;
    Object.assign(this.headers, h);
  },
  json(value) { this.body = value; this.writableEnded = true; },
  end(value) {
    if (value !== undefined) this.body = value;
    this.writableEnded = true;
  },
  redirect(uri) { this.headers.Location = uri; this.writableEnded = true; },
  setCookie() {},
  clearCookie() {},
});

// staticMap / dynamicList / prefixList を歩いて、登録済みの全ハンドラを重複排除して収集する
const collectHandlers = router => {
  const seen = new Map();
  const record = (label, handler) => {
    for (const fn of [handler].flat()) {
      if (seen.has(fn)) {
        seen.get(fn).labels.push(label);
      } else {
        seen.set(fn, { fn, labels: [label] });
      }
    }
  };
  for (const [path, methodMap] of router.staticMap) {
    for (const [method, handler] of methodMap) {
      record(`${method} ${path || '/'}`, handler);
    }
  }
  for (const { path, methodMap } of router.dynamicList) {
    for (const [method, handler] of methodMap) {
      record(`${method} ${path}`, handler);
    }
  }
  for (const { prefix, methodMap } of router.prefixList) {
    for (const [method, handler] of methodMap) {
      record(`MIDDLEWARE ${method} ${prefix}`, handler);
    }
  }
  return [...seen.values()];
};

const registeredHandlers = collectHandlers(route.router);

describe('登録済みの全ルートハンドラは Promise を return するか、同期的に応答を完了する', () => {
  it('少なくとも1つ以上のハンドラが収集されている', () => {
    expect(registeredHandlers.length).toBeGreaterThan(0);
  });

  it.each(registeredHandlers.map(({ fn, labels }) => [labels.join(', '), fn]))(
    '%s',
    async (label, handler) => {
      const req = createDeepMock('req');
      const res = createRecordingRes();

      const pending = handler(req, res);

      if (pending && typeof pending.then === 'function') {
        // Router はこの Promise を await するので、ここでは解決を待たなくてよい。
        // 未処理拒否を防ぐためだけに握りつぶす。
        pending.catch(() => {});
        return;
      }

      // Promise を返さない場合、Router は完了を待てないため、
      // この時点で応答が完了していなければ Lambda では致命的になる。
      expect(res.writableEnded).toBe(true);
    },
  );
});
