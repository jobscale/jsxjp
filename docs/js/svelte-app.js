/* eslint-disable no-shadow, no-unused-expressions */

class Svelte {
  constructor() {
    setTimeout(() => this.svelte(), 1e3);
  }

  svelte() {
    function t() { }
    function e(t) {
      return t();
    }
    function n() {
      return {};
    }
    function o(t) {
      t.forEach(e);
    }
    function r(t) {
      return typeof t === 'function';
    }
    function s(t, e) {
      return t !== e || (t && typeof t === 'object') || typeof t === 'function';
    }
    function c(t, e) {
      t.appendChild(e);
    }
    function l(t, e, n) {
      t.insertBefore(e, n || null);
    }
    function u(t) {
      t.parentNode.removeChild(t);
    }
    function a(t, e) {
      for (let n = 0; n < t.length; n += 1) {
        t[n] && t[n].d(e);
      }
    }
    function i(t) {
      return document.createElementNS('http://www.w3.org/2000/svg', t);
    }
    function f() {
      return document.createTextNode('');
    }
    function d(t, e, n) {
      n === null ? t.removeAttribute(e) : t.getAttribute(e) !== n && t.setAttribute(e, n);
    }
    let m;
    function $(t) {
      m = t;
    }
    function p(t) {
      (() => {
        if (!m) throw new Error('Function called outside component initialization');
        return m;
      })().$$.on_mount.push(t);
    }
    const h = [];
    const g = [];
    const y = [];
    const x = [];
    const b = Promise.resolve();
    let v = !1;
    function _(t) {
      y.push(t);
    }
    let k = !1;
    const w = new Set();
    function j(t) {
      if (t.fragment === null) return;
      t.update();
      o(t.before_update);
      const e = t.dirty;
      t.dirty = [-1];
      t.fragment && t.fragment.p(t.ctx, e);
      t.after_update.forEach(_);
    }
    function E() {
      if (k) return;
      k = !0;
      do {
        for (let t = 0; t < h.length; t += 1) {
          const e = h[t];
          $(e);
          j(e.$$);
        }
        for ($(null), h.length = 0; g.length;) {
          g.pop()();
        }
        for (let t = 0; t < y.length; t += 1) {
          const e = y[t];
          w.has(e) || (w.add(e), e());
        }
        y.length = 0;
      } while (h.length);
      for (; x.length;) {
        x.pop()();
      }
      v = !1;
      k = !1;
      w.clear();
    }
    const A = new Set();
    function N(t, e) {
      t.$$.dirty[0] === -1 && (
        h.push(t),
        v || (v = !0, b.then(E)),
        t.$$.dirty.fill(0)
      );
      t.$$.dirty[e / 31 | 0] |= 1 << e % 31;
    }
    function S(s, c, l, a, i, f, d, p = [-1]) {
      const h = m;
      $(s);
      const g = s.$$ = {
        fragment: null,
        ctx: null,
        props: f,
        update: t,
        not_equal: i,
        bound: n(),
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(c.context || (h ? h.$$.context : [])),
        callbacks: n(),
        dirty: p,
        skip_bound: !1,
        root: c.target || h.$$.root,
      };
      d && d(g.root);
      let y = !1;
      g.ctx = l ? l(s, c.props || {}, (t, e, ...n) => {
        const o = n.length ? n[0] : e;
        g.ctx && i(g.ctx[t], g.ctx[t] = o) && (
          !g.skip_bound && g.bound[t] && g.bound[t](o), y && N(s, t)
        );
        return e;
      }) : [];
      g.update();
      y = !0;
      o(g.before_update);
      g.fragment = !!a && a(g.ctx);
      if (c.target) {
        if (c.hydrate) {
          const v = c.target;
          const t = Array.from(v.childNodes);
          g.fragment && g.fragment.l(t);
          t.forEach(u);
        } else {
          g.fragment && g.fragment.c();
        }
        let x; let
          b;
        c.intro && (
          (x = s.$$.fragment) && x.i && (A.delete(x), x.i(b))
        );
        ((t, n, s, c) => {
          const {
            fragment: l, on_mount: u, on_destroy: a, after_update: i,
          } = t.$$;
          l && l.m(n, s);
          c || _(() => {
            const n = u.map(e).filter(r);
            a ? a.push(...n) : o(n);
            t.$$.on_mount = [];
          });
          i.forEach(_);
        })(s, c.target, c.anchor, c.customElement);
        E();
      }
      $(h);
    }
    function O(t, e, n) {
      const o = t.slice();
      o[4] = e[n];
      return o;
    }
    function B(t, e, n) {
      const o = t.slice();
      o[7] = e[n];
      return o;
    }
    function C(t) {
      let e;
      return {
        c() {
          e = i('line');
          d(e, 'class', 'minor svelte-1xs85ek');
          d(e, 'y1', '42');
          d(e, 'y2', '45');
          d(e, 'transform', `rotate(${6 * (t[4] + t[7])})`);
        },
        m(t, n) {
          l(t, e, n);
        },
        d(t) {
          t && u(e);
        },
      };
    }
    function D(e) {
      let n;
      let r;
      const s = [1, 2, 3, 4];
      const c = [];
      for (let t = 0; t < 4; t += 1) {
        c[t] = C(B(e, s, t));
      }
      return {
        c() {
          n = i('line');
          for (let t = 0; t < 4; t += 1) {
            c[t].c();
          }
          r = f();
          d(n, 'class', 'major svelte-1xs85ek');
          d(n, 'y1', '35');
          d(n, 'y2', '45');
          d(n, 'transform', `rotate(${30 * e[4]})`);
        },
        m(t, e) {
          l(t, n, e);
          for (let n = 0; n < 4; n += 1) {
            c[n].m(t, e);
          }
          l(t, r, e);
        },
        p: t,
        d(t) {
          t && u(n);
          a(c, t);
          t && u(r);
        },
      };
    }
    function I(e) {
      let [n, o, r, s, f, m, $, p, h, g] = [];
      const x = [];
      const y = [];
      for (let i = 0; i < 60; i += 5) {
        y.push(i);
      }
      for (let t = 0; t < y.length; t += 1) {
        x[t] = D(O(e, y, t));
      }
      return {
        c() {
          n = i('svg');
          o = i('circle');
          for (let t = 0; t < x.length; t += 1) {
            x[t].c();
          }
          r = i('line');
          f = i('line');
          $ = i('g');
          p = i('line');
          h = i('line');
          d(o, 'class', 'clock-face svelte-1xs85ek');
          d(o, 'r', '48');
          d(r, 'class', 'hour svelte-1xs85ek');
          d(r, 'y1', '2');
          d(r, 'y2', '-20');
          d(r, 'transform', s = `rotate(${30 * e[2] + e[1] / 2})`);
          d(f, 'class', 'minute svelte-1xs85ek');
          d(f, 'y1', '4');
          d(f, 'y2', '-30');
          d(f, 'transform', m = `rotate(${6 * e[1] + e[0] / 10})`);
          d(p, 'class', 'second svelte-1xs85ek');
          d(p, 'y1', '10');
          d(p, 'y2', '-38');
          d(h, 'class', 'second-counterweight svelte-1xs85ek');
          d(h, 'y1', '10');
          d(h, 'y2', '2');
          d($, 'transform', g = `rotate(${6 * e[0]})`);
          d(n, 'viewBox', '-50 -50 100 100');
          d(n, 'class', 'svelte-1xs85ek');
        },
        m(t, e) {
          l(t, n, e);
          c(n, o);
          for (let t = 0; t < x.length; t += 1) {
            x[t].m(n, null);
          }
          c(n, r);
          c(n, f);
          c(n, $);
          c($, p);
          c($, h);
        },
        p(t, [e]) {
          6 & e && s !== (s = `rotate(${30 * t[2] + t[1] / 2})`) && d(r, 'transform', s);
          3 & e && m !== (m = `rotate(${6 * t[1] + t[0] / 10})`) && d(f, 'transform', m);
          1 & e && g !== (g = `rotate(${6 * t[0]})`) && d($, 'transform', g);
        },
        i: t,
        o: t,
        d(t) {
          t && u(n);
          a(x, t);
        },
      };
    }
    const opts = {
      raf: true,
      step: 1e3,
    };
    const delay = () => opts.step - (Date.now() % opts.step);
    const anime = interval => (opts.raf
      ? requestAnimationFrame(interval)
      : setTimeout(interval, delay()));
    function M(t, e, n) {
      let [c, o, r, s] = [new Date()];
      const interval = () => {
        n(3, c = new Date());
        anime(interval);
      };
      p(() => anime(interval));
      t.$$.update = () => {
        8 & t.$$.dirty && n(2, o = c.getHours());
        8 & t.$$.dirty && n(1, r = c.getMinutes());
        8 & t.$$.dirty && n(0, s = c.getSeconds() + (c.getMilliseconds() / 1e3));
      };
      return [s, r, o, c];
    }
    const params = {
      target: document.querySelector('#svelte-app'),
      props: {
        name: 'world',
      },
    };
    params.target.addEventListener('click', () => { opts.raf = !opts.raf; });
    S({}, params, M, I, s, {});
  }
}

window.addEventListener('DOMContentLoaded', () => new Svelte());
