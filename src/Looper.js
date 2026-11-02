const LOOKAHEAD = 0.3;
const STEPS = 64;

export class Looper extends EventTarget {
  #engine;
  #url;
  #buffer = null;
  #source = null;
  #start = 0;
  #scheduledCycle = -1;
  #takes = [];
  recording = false;

  constructor(engine, url) {
    super();
    this.#engine = engine;
    this.#url = url;
  }

  get playing() {
    return this.#source !== null;
  }

  get hits() {
    return this.#takes.length;
  }

  async play() {
    this.#buffer ??= await this.#engine.loadBuffer(this.#url);
    const ctx = this.#engine.context;
    this.#source = ctx.createBufferSource();
    this.#source.buffer = this.#buffer;
    this.#source.loop = true;
    this.#source.connect(this.#engine.output);
    this.#start = ctx.currentTime + 0.05;
    this.#scheduledCycle = 0;
    this.#source.start(this.#start);
    this.#tick();
  }

  stop() {
    this.#source?.stop();
    this.#source = null;
    this.recording = false;
  }

  record(hit, now) {
    if (!this.recording || !this.playing) return;
    const length = this.#buffer.duration;
    const offset = Math.max(0, now - this.#start) % length;
    this.#takes.push({ ...hit, offset });
    // The next cycle may already be scheduled, so the new hit has to join it directly.
    if (this.#scheduledCycle > this.#cycleAt(now)) {
      this.#emitHit(hit, this.#start + this.#scheduledCycle * length + offset);
    }
  }

  erase() {
    this.#takes = [];
    if (this.playing) this.#scheduledCycle = this.#cycleAt(this.#engine.now);
  }

  #cycleAt(time) {
    return Math.floor((time - this.#start) / this.#buffer.duration);
  }

  #emitHit(hit, when) {
    this.dispatchEvent(new CustomEvent('hit', { detail: { hit, when } }));
  }

  #tick() {
    if (!this.playing) return;
    const length = this.#buffer.duration;
    const elapsed = this.#engine.now - this.#start;
    const next = Math.floor(elapsed / length) + 1;
    if (next > this.#scheduledCycle && elapsed > next * length - LOOKAHEAD) {
      this.#takes.forEach((hit) => this.#emitHit(hit, this.#start + next * length + hit.offset));
      this.#scheduledCycle = next;
    }
    const step = Math.max(0, Math.floor(((elapsed % length) / length) * STEPS));
    this.dispatchEvent(new CustomEvent('step', { detail: { step: step % 16, bar: Math.floor(step / 16) + 1 } }));
    requestAnimationFrame(() => this.#tick());
  }
}
