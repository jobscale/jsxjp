(() => {
  const LogLevels = [
    'error',
    'warn',
    'info',
    'debug',
    'trace',
  ];

  const globalObject = typeof global !== 'undefined' ? global : window;
  const singleton = (() => {
    if (!globalObject.loggerSingleton) {
      globalObject.loggerSingleton = {
        native() {},
        instance: undefined,
      };
    }
    return globalObject.loggerSingleton;
  })();

  class Logger {
    constructor(options) {
      this.logger = this;
      this.Logger = Logger;
      this.config(options);
      this.initialize();
    }

    config(options) {
      this.logLevel = (options && options.logLevel ? options.logLevel : 'info').toLowerCase();
      this.level = LogLevels.indexOf(this.logLevel);
    }

    initialize() {
      const { log } = console;
      if (log !== singleton.native) {
        singleton.instance = this;
        this.defineProperty();
        this.std = {};
      } else {
        this.std = singleton.instance.std;
      }
      const mummy = console;
      LogLevels.forEach(logLevel => {
        if (!this.std[logLevel]) this.std[logLevel] = mummy[logLevel];
        const level = LogLevels.indexOf(logLevel);
        this[logLevel] = (...args) => {
          if (this.level < level) return;
          const logger = this.std[logLevel];
          const LEVEL = `[${logLevel.toUpperCase()}]`;
          logger(__fname, __line, LEVEL, ...args); // eslint-disable-line
        };
        if (mummy[logLevel]) mummy[logLevel] = singleton.native;
      });
      mummy.log = singleton.native;
      mummy.alert = singleton.native;
    }

    defineProperty() {
      Object.defineProperty(globalObject, '__line', {
        get() { return new Error().stack.split('\n')[3].split(':').reverse()[1]; },
      });
      Object.defineProperty(globalObject, '__fname', {
        get() { return new Error().stack.split('\n')[3].split(/[:( ]/).reverse()[2]; },
      });
    }
  }

  if (typeof module !== 'undefined') module.exports = new Logger();
  if (typeof window !== 'undefined') window.logger = new Logger();
})();
