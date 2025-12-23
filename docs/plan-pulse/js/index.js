import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import { logger } from 'https://esm.sh/@jobscale/logger';

const self = reactive({
  loading: false,
  mode: '',
  plan: '',
  hubId: undefined,
  hub: { plan: [] },
  persons: [],
  person: { plan: [] },
  summary: [],

  tyyEntry(personId) {
    if (personId) {
      self.person = self.persons.find(item => item.personId === personId);
    } else {
      self.person = { plan: [] };
    }
    self.mode = 'entry';
  },

  onCloseEntry() {
    self.mode = 'hub';
  },

  onRemovePerson() {
    if (!self.person.personId) return;

    self.loading = true;
    const params = ['removePerson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hubId: self.hubId,
        personId: self.person.personId,
      }),
    }];
    fetch(...params)
    .then(res => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res.json();
    })
    .catch(e => logger.error(e.message))
    .then(() => setTimeout(() => {
      window.location.reload();
    }, 1000));
  },

  onEntry() {
    if (!self.person.name) {
      const nameRef = document.querySelector('input[name="name"]');
      self.required(nameRef, true);
      return;
    }
    self.loading = true;
    for (let i = 0; i < self.hub.plan.length; i++) {
      if (!self.person.plan[i]) self.person.plan[i] = '0';
    }
    const params = ['putPerson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hubId: self.hubId,
        personId: self.person.personId,
        person: self.person,
      }),
    }];
    fetch(...params)
    .then(res => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res.json();
    })
    .then(({ personId }) => {
      self.person.personId = personId;
    })
    .catch(e => logger.error(e.message))
    .then(() => setTimeout(() => {
      window.location.reload();
    }, 1000));
  },

  onHub() {
    const [, query] = window.location.href.split('?');
    const search = new URLSearchParams(query);
    const hubId = search.get('hub');
    if (!hubId) {
      self.mode = 'top';
      return;
    }
    self.hubId = hubId;
    self.mode = 'hub';
    self.loading = true;
    const params = ['hub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hubId: self.hubId }),
    }];
    fetch(...params)
    .then(res => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res.json();
    })
    .then(({ hub, persons }) => {
      hub.plan.forEach((v, index) => {
        const sum = persons.reduce((acc, person) => {
          if (person.plan[index] === '1') acc[0] += 1;
          if (person.plan[index] === '2') acc[1] += 1;
          if (person.plan[index] === '3') acc[2] += 1;
          return acc;
        }, [0, 0, 0]);
        self.summary[index] = sum;
      });
      self.hub = hub;
      self.persons = persons.sort((a, b) => {
        if (a.createdAt < b.createdAt) return -1;
        if (a.createdAt > b.createdAt) return 1;
        return 0;
      });
    })
    .catch(e => {
      logger.error(e.message);
      window.location.href = '/plan-pulse';
    })
    .then(() => setTimeout(() => { self.loading = false; }, 1000));
  },

  getLink() {
    return window.location.href;
  },

  onCreate() {
    self.plan = self.hub.plan.join('\n');
    self.mode = 'create';
  },

  onClosePlan() {
    if (self.hubId) {
      self.mode = 'hub';
    } else {
      self.mode = 'top';
    }
  },

  required(el, bad) {
    if (bad) {
      el.classList.add('pink');
      el.classList.add('error');
    } else {
      el.classList.remove('pink');
      el.classList.remove('error');
    }
  },

  onSubmit() {
    const planRef = document.querySelector('textarea[name="plan"]');
    const titleRef = document.querySelector('input[name="title"]');
    self.required(planRef);
    self.required(titleRef);
    const plan = self.plan.split(/[\r\n]+/)
    .map(item => item.trim()).filter(Boolean);
    let bad = 0;
    if (!plan.length) {
      self.required(planRef, true);
      bad++;
    }
    if (!self.hub.title) {
      self.required(titleRef, true);
      bad++;
    }
    if (bad) return;
    self.loading = true;
    logger.info('plan', plan);
    self.hub.plan = plan;
    const params = ['putHub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hubId: self.hubId,
        hub: self.hub,
      }),
    }];
    fetch(...params)
    .then(res => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res.json();
    })
    .then(({ hubId }) => {
      window.location.href = `?hub=${hubId}`;
    })
    .catch(e => logger.error(e.message))
    .then(() => setTimeout(() => { self.loading = false; }, 1000));
  },

  onColorScheme() {
    const html = document.querySelector('html');
    html.classList.toggle('dark-scheme');
    html.classList.toggle('light-scheme');
  },
});

createApp({
  setup() {
    return self;
  },

  async mounted() {
    self.onHub();
  },
}).mount('#app');
