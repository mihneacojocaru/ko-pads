import { AudioEngine } from './AudioEngine.js';
import { Display } from './Display.js';
import { Instrument } from './Instrument.js';
import { Knob } from './Knob.js';
import { Looper } from './Looper.js';
import { DrumGroup, NoteGroup } from './SoundGroup.js';

const PADS = [
  { key: '7', name: 'TOM HI', voice: 'tomHi' },
  { key: '8', name: 'COWBELL', voice: 'cowbell' },
  { key: '9', name: 'ZAP', voice: 'zap' },
  { key: '4', name: 'TOM LO', voice: 'tomLo' },
  { key: '5', name: 'OPEN HAT', voice: 'openHat' },
  { key: '6', name: 'RIM', voice: 'rim' },
  { key: '1', name: 'KICK', voice: 'kick' },
  { key: '2', name: 'SNARE', voice: 'snare' },
  { key: '3', name: 'HAT', voice: 'hat' },
  { key: '.', name: 'CLAP', voice: 'clap' },
  { key: '0', name: 'BASS', voice: 'bass' },
  { key: 'Enter', label: 'ENT', name: 'CHORD', voice: 'chord' },
];

const NOTES = ['C5', 'D5', 'E5', 'G4', 'A4', 'C5', 'C4', 'D4', 'E4', 'G3', 'A3', 'C3'];
const MAX_VOLUME = 11;

export class Sampler {
  #root;
  #engine = new AudioEngine();
  #looper = new Looper(this.#engine, 'demo-loop.wav');
  #display;
  #groups;
  #knobs;
  #padKeys = [];
  #groupKeys = [];
  #group = 0;
  #volume = 7;

  constructor(root) {
    this.#root = root;
    this.#display = new Display(root);
    const instrument = new Instrument(this.#engine);
    this.#groups = [
      new DrumGroup('A', 'DRUMS', instrument),
      new DrumGroup('B', 'PERC', instrument, 1.6),
      new DrumGroup('C', 'LO-FI', instrument, 0.6),
      new NoteGroup('D', 'SYNTH', instrument, NOTES),
    ];
    this.#knobs = {
      filter: new Knob(root.querySelector('[data-knob="filter"]'), 1),
      pitch: new Knob(root.querySelector('[data-knob="pitch"]'), 0.5),
    };
  }

  init() {
    this.#renderPads();
    this.#renderGroups();
    this.#bindControls();
    this.#bindKnobs();
    this.#bindLooper();
    this.#bindKeyboard();
    this.#meter();
    return this;
  }

  get #pitch() {
    return 2 ** ((this.#knobs.pitch.value - 0.5) * 2);
  }

  trigger(index) {
    const now = this.#engine.now;
    this.#sound(index, this.#group, now);
    this.#flash(index);
    this.#looper.record({ index, group: this.#group }, now);
  }

  async togglePlay() {
    if (this.#looper.playing) {
      this.#looper.stop();
      this.#display.setStep(-1, 0);
      this.#display.show(this.#looper.hits ? `${this.#looper.hits} HITS` : 'PRESS PLAY');
    } else {
      this.#display.show('LOADING');
      await this.#looper.play();
      this.#display.show('DEMO LOOP');
    }
    this.#updateStatus();
  }

  async toggleRecord() {
    if (this.#looper.recording) {
      this.#looper.recording = false;
      this.#display.show(`${this.#looper.hits} HITS`);
    } else {
      if (!this.#looper.playing) await this.togglePlay();
      this.#looper.recording = true;
      this.#display.show('TAP PADS');
    }
    this.#updateStatus();
  }

  erase() {
    this.#looper.erase();
    this.#display.show('ERASED');
  }

  changeVolume(step) {
    this.#volume = Math.min(MAX_VOLUME, Math.max(0, this.#volume + step));
    this.#engine.setGain(this.#volume / 10);
    this.#display.setVolume(this.#volume);
    this.#display.show(this.#volume === MAX_VOLUME ? 'GOES TO 11' : `VOLUME ${this.#volume}`);
  }

  selectGroup(index) {
    const group = this.#groups[index];
    this.#group = index;
    this.#groupKeys.forEach((el, i) => el.setAttribute('aria-pressed', String(i === index)));
    this.#padKeys.forEach((el, i) => (el.querySelector('.pad_name').textContent = group.label(PADS[i], i)));
    this.#display.setGroup(group.id);
    this.#display.show(group.name);
  }

  #sound(index, groupIndex, when) {
    this.#groups[groupIndex].play(PADS[index], index, when, this.#pitch);
  }

  #flash(index, delay = 0) {
    const el = this.#padKeys[index];
    setTimeout(() => {
      el.classList.add('is-hit');
      this.#display.show(el.querySelector('.pad_name').textContent);
      setTimeout(() => el.classList.remove('is-hit'), 110);
    }, delay * 1000);
  }

  #updateStatus() {
    const { playing, recording } = this.#looper;
    this.#root.querySelector('[data-action="play"]').setAttribute('aria-pressed', String(playing));
    this.#root.querySelector('[data-action="record"]').setAttribute('aria-pressed', String(recording));
    this.#display.setStatus({ playing, recording });
  }

  #key(className, html) {
    const wrap = document.createElement('div');
    wrap.className = 'btn';
    wrap.innerHTML = `<button class="key ${className}">${html}</button>`;
    return wrap;
  }

  #renderPads() {
    const container = this.#root.querySelector('#pads');
    PADS.forEach((pad, i) => {
      const wrap = this.#key('pad', `<span class="pad_num">${pad.label ?? pad.key}</span><span class="pad_name">${pad.name}</span>`);
      const button = wrap.firstChild;
      button.addEventListener('pointerdown', () => this.trigger(i));
      this.#padKeys.push(button);
      container.append(wrap);
    });
  }

  #renderGroups() {
    const container = this.#root.querySelector('#groups');
    this.#groups.forEach((group, i) => {
      const wrap = this.#key('group', `<span class="key_label">${group.id}</span>`);
      const button = wrap.firstChild;
      button.setAttribute('aria-pressed', String(i === this.#group));
      button.addEventListener('click', () => this.selectGroup(i));
      this.#groupKeys.push(button);
      container.append(wrap);
    });
  }

  #bindControls() {
    const actions = {
      play: () => this.togglePlay(),
      record: () => this.toggleRecord(),
      erase: () => this.erase(),
      up: () => this.changeVolume(1),
      down: () => this.changeVolume(-1),
    };
    this.#root.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', () => actions[el.dataset.action]());
    });
  }

  #bindKnobs() {
    const { filter, pitch } = this.#knobs;
    filter.addEventListener('change', () => {
      this.#engine.setCutoff(150 * 2 ** (filter.value * 7));
      this.#display.show(`FILTER ${Math.round(filter.value * 100)}`);
    });
    pitch.addEventListener('change', () => {
      const semis = Math.round((pitch.value - 0.5) * 24);
      this.#display.show(`PITCH ${semis > 0 ? '+' : ''}${semis}`);
    });
  }

  #bindLooper() {
    this.#looper.addEventListener('hit', ({ detail: { hit, when } }) => {
      this.#sound(hit.index, hit.group, when);
      this.#flash(hit.index, when - this.#engine.now);
    });
    this.#looper.addEventListener('step', ({ detail: { step, bar } }) => this.#display.setStep(step, bar));
  }

  #bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const pad = PADS.findIndex((p) => p.key === e.key);
      if (pad >= 0) {
        e.preventDefault();
        return this.trigger(pad);
      }
      const key = e.key.toLowerCase();
      const group = this.#groups.findIndex((g) => g.id.toLowerCase() === key);
      if (group >= 0) return this.selectGroup(group);
      if (e.key === ' ') {
        e.preventDefault();
        this.togglePlay();
      }
      if (key === 'r') this.toggleRecord();
      if (key === 'e') this.erase();
    });
  }

  #meter() {
    this.#display.setLevel(this.#engine.peak());
    requestAnimationFrame(() => this.#meter());
  }
}
