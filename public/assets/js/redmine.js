/* global document window navigator */
(() => {
  class App {
    constructor() {
      this.logger = console;
    }
    static confirm(text) {
      const param = { window };
      return param.window.confirm(text);
    }
    get uuid() {
      const data = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      const val = [];
      [8, 4, 4, 4, 12].forEach(len => {
        let x = '';
        for (let i = 0; i < len; i++) { x += data[Math.floor(Math.random() * data.length)]; }
        val.push(x);
      });
      return val.join('-');
    }
    promise() {
      const promise = {};
      promise.instance = new Promise((...argv) => {
        [promise.resolve, promise.reject] = argv;
      });
      return promise;
    }
    waiter(ms) {
      const promise = this.promise();
      setTimeout(promise.resolve, ms);
      return promise.instance;
    }
  }
  class DownloadPDF extends App {
    constructor(param) {
      super();
      this.ms = param.wait * 1000;
      this.latest = new Date(param.latest);
    }
    finishDownload(loader) {
      const agent = navigator.userAgent.toLowerCase();
      if (agent.match(/windows/) && agent.match(/chrome/)) {
        loader.close();
        return this.waiter(500);
      }
      return undefined;
    }
    download(param) {
      this.logger.info(param.name);
      const loader = window.open(param.href, this.uuid, 'width=600,height=600');
      return this.waiter(this.ms)
      .then(() => this.finishDownload(loader));
    }
    async select() {
      const list = [];
      document.querySelectorAll('.issue').forEach(element => {
        const updateAt = new Date(element.querySelector('td.updated_on').textContent);
        if (updateAt < this.latest) return;
        const href = `${element.querySelector('td.id > a').href}.pdf`;
        const name = (path => path[path.length - 1])(href.split('/'));
        if (!name) return;
        list.push({
          name,
          href,
          updateAt,
        });
      });
      return list;
    }
    async loop(list) {
      for (let i = 0; i < list.length; i++) {
        await this.download(list[i]);
      }
    }
  }
  const run = {
    id: 'redmine-pdf',
    idInput: 'load-latest-timestamp',
    tips() {
      const tips = [
        '１．設定＞詳細設定＞ダウンロード\nダウンロード前に各ファイルの保存場所を確認する＞OFF',
        '２．ポップアップブロックを解除してください。',
      ];
      return App.confirm(tips.join('\n\n'));
    },
    status() {
      return document.querySelector(`#${run.id}`);
    },
    attach() {
      const owner = document.querySelector('#query_form_with_buttons > .buttons');
      /* eslint-disable no-use-before-define */
      owner.append(job.button());
      owner.append(job.status());
      owner.append(job.dateTime());
      /* eslint-enable no-use-before-define */
    },
    printer() {
      run.status().textContent = '完了しました';
    },
    download() {
      if (!run.tips()) return;
      const loader = new DownloadPDF({
        wait: 5,
        latest: document.querySelector(`#${run.idInput}`).value,
      });
      loader.select()
      .then(list => loader.loop(list))
      .then(run.printer);
    },
  };
  const job = {
    button() {
      const element = document.createElement('span');
      element.style.padding = '20px 5px 20px 20px';
      element.style.cursor = 'pointer';
      element.style.fontSize = '1.1em';
      element.textContent = 'PDF一括ダウンロード';
      element.onclick = run.download;
      return element;
    },
    status() {
      const element = document.createElement('span');
      element.style.padding = '20px 5px 20px 20px';
      element.style.color = 'darkslateblue';
      element.style.fontSize = '1.1em';
      element.id = run.id;
      return element;
    },
    dateTime() {
      const element = document.createElement('span');
      element.style.padding = '20px 5px';
      const input = document.createElement('input');
      input.style.textAlign = 'center';
      input.style.width = '128px';
      input.style.marginRight = '5px';
      input.id = job.idInput;
      const ts = new Date();
      ts.setHours(ts.getHours() - 1);
      input.value = job.dateToString(ts);
      element.append(input);
      const sufix = document.createElement('span');
      sufix.textContent = '以降';
      element.append(sufix);
      return element;
    },
    dateToString(ts) {
      const con = n => n < 10 ? `0${n}` : n;
      const dt = {
        Y: ts.getFullYear(),
        m: con(ts.getMonth() + 1),
        d: con(ts.getDate()),
        H: con(ts.getHours()),
        M: con(ts.getMinutes()),
        S: con(ts.getSeconds()),
      };
      return `${dt.Y}-${dt.m}-${dt.d} ${dt.H}:${dt.M}`;
    },
    start() {
      if (run.status()) return;
      run.attach();
    },
  };
  job.start();
})();
