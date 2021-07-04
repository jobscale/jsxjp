/* global document window Common */
/* eslint-disable no-unused-expressions */
window.Channel || (
  window.Common && (() => {
    class Channel extends Common {
      constructor() {
        super();
        this.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js';
        this.pluginKey = 'ce9303bb-c19c-41ae-8edb-e6646dcce2d6';
        if (window.channelPluginSettings) throw new Error('duplicate');
        window.channelPluginSettings = this.load();
      }
      createElement() {
        const s = document.createElement('script');
        s.type = 'text/javascript';
        s.charset = 'UTF-8';
        s.src = this.src;
        s.async = true;
        return s;
      }
      attach(...argv) {
        this.logger.info(...argv);
        if (window.ChannelIOInitialized) return;
        window.ChannelIOInitialized = true;
        document.body.appendChild(this.createElement());
      }
      initialize() {
        const ch = (...argv) => ch.c(argv);
        ch.q = [];
        ch.c = args => ch.q.push(args);
        window.ChannelIO = ch;
      }
      addEventListener() {
        setTimeout(() => this.attach('timeout'), 3300);
        window.addEventListener('DOMContentLoaded', () => this.attach('DOMContentLoaded'), false);
        window.addEventListener('load', () => this.attach('load'), false);
      }
      load() {
        if (window.ChannelIO) return undefined;
        this.initialize();
        if (document.readyState === 'complete') this.attach();
        else if (window.attachEvent) window.attachEvent('onload', () => this.attach('onload'));
        else this.addEventListener();
        return this;
      }
    }
    window.Channel = Channel;
    return new Channel();
  })()
) || (() => { throw new Error('bad'); })();
