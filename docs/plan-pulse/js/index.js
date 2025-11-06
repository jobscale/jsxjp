import { createApp, reactive } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import { logger } from 'https://esm.sh/@jobscale/logger';

const Titan = {
  tyyEntry(personId) {
    if (personId) {
      this.person = this.persons.find(item => item.personId === personId);
    } else {
      this.person = { plan: [] };
    }
    this.mode = 'entry';
  },

  onCloseEntry() {
    this.mode = 'hub';
  },

  onRemovePerson() {
    if (!this.person.personId) return;

    this.loading = true;
    const params = ['removePerson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hubId: this.hubId,
        personId: this.person.personId,
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
    if (!this.person.name) {
      this.required(this.$refs.name, true);
      return;
    }

    this.loading = true;
    for (let i = 0; i < this.hub.plan.length; i++) {
      if (!this.person.plan[i]) this.person.plan[i] = '0';
    }
    const params = ['putPerson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hubId: this.hubId,
        personId: this.person.personId,
        person: this.person,
      }),
    }];
    fetch(...params)
    .then(res => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res.json();
    })
    .then(({ person }) => {
      this.person = person;
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
      this.mode = 'top';
      return;
    }
    this.hubId = hubId;
    this.mode = 'hub';

    this.loading = true;
    const params = ['hub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hubId: this.hubId }),
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
        this.summary[index] = sum;
      });
      this.hub = hub;
      this.persons = persons.sort((a, b) => {
        if (a.createdAt < b.createdAt) return -1;
        if (a.createdAt > b.createdAt) return 1;
        return 0;
      });
    })
    .catch(e => {
      logger.error(e.message);
      window.location.href = '/plan-pulse';
    })
    .then(() => setTimeout(() => { this.loading = false; }, 1000));
  },

  getLink() {
    return window.location.href;
  },

  onCreate() {
    this.plan = this.hub.plan.join('\n');
    this.mode = 'create';
  },

  onClosePlan() {
    if (this.hubId) {
      this.mode = 'hub';
    } else {
      this.mode = 'top';
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
    this.required(this.$refs.plan);
    this.required(this.$refs.title);
    const plan = this.plan.split(/[\r\n]+/)
    .map(item => item.trim())
    .filter(item => item.length);
    let bad = 0;
    if (!plan.length) {
      this.required(this.$refs.plan, true);
      bad++;
    }
    if (!this.hub.title) {
      this.required(this.$refs.title, true);
      bad++;
    }
    if (bad) return;
    this.loading = true;
    logger.info('plan', plan);
    this.hub.plan = plan;
    const params = ['putHub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hubId: this.hubId,
        hub: this.hub,
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
    .then(() => setTimeout(() => { this.loading = false; }, 1000));
  },

  onColorScheme() {
    const html = document.querySelector('html');
    html.classList.toggle('dark-scheme');
    html.classList.toggle('light-scheme');
  },
};

createApp({
  setup() {
    return reactive({
      ...Titan,
      loading: false,
      mode: '',
      plan: '',
      hubId: undefined,
      hub: { plan: [] },
      persons: [],
      person: { plan: [] },
      summary: [],
    });
  },

  async mounted() {
    this.onHub();
  },
}).mount('#app');
