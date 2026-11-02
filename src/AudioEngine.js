export class AudioEngine {
  #ctx = null;
  #gain;
  #cutoff;
  #master;
  #filter;
  #analyser;
  #samples;
  #noise;

  constructor({ gain = 0.7, cutoff = 19200 } = {}) {
    this.#gain = gain;
    this.#cutoff = cutoff;
  }

  get ready() {
    return this.#ctx !== null;
  }

  // Browsers only allow an AudioContext after a user gesture, so it is created lazily.
  get context() {
    if (!this.#ctx) this.#init();
    if (this.#ctx.state === 'suspended') this.#ctx.resume();
    return this.#ctx;
  }

  get now() {
    return this.context.currentTime;
  }

  get output() {
    this.context;
    return this.#master;
  }

  setGain(value) {
    this.#gain = value;
    if (this.ready) this.#master.gain.setTargetAtTime(value, this.#ctx.currentTime, 0.02);
  }

  setCutoff(hz) {
    this.#cutoff = hz;
    if (this.ready) this.#filter.frequency.setTargetAtTime(hz, this.#ctx.currentTime, 0.02);
  }

  peak() {
    if (!this.ready) return 0;
    this.#analyser.getByteTimeDomainData(this.#samples);
    let peak = 0;
    for (const v of this.#samples) peak = Math.max(peak, Math.abs(v - 128));
    return peak / 128;
  }

  async loadBuffer(url) {
    const res = await fetch(url);
    return this.context.decodeAudioData(await res.arrayBuffer());
  }

  envelope(t, peak, decay, attack = 0.002) {
    const g = this.context.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    g.connect(this.#master);
    return g;
  }

  oscillator(t, type, freq, out, length) {
    const o = this.context.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.connect(out);
    o.start(t);
    o.stop(t + length);
    return o;
  }

  noiseBurst(t, out, length, filterType, freq) {
    const src = this.context.createBufferSource();
    const f = this.#ctx.createBiquadFilter();
    src.buffer = this.#noise;
    f.type = filterType;
    f.frequency.value = freq;
    src.connect(f).connect(out);
    src.start(t);
    src.stop(t + length);
  }

  sweep(t, from, to, time, out) {
    const f = this.context.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + time);
    f.connect(out);
    return f;
  }

  #init() {
    const ctx = new AudioContext();
    this.#ctx = ctx;
    this.#master = ctx.createGain();
    this.#master.gain.value = this.#gain;
    this.#filter = ctx.createBiquadFilter();
    this.#filter.type = 'lowpass';
    this.#filter.Q.value = 4;
    this.#filter.frequency.value = this.#cutoff;
    this.#analyser = ctx.createAnalyser();
    this.#analyser.fftSize = 256;
    this.#samples = new Uint8Array(this.#analyser.fftSize);
    this.#master.connect(this.#filter).connect(this.#analyser).connect(ctx.destination);

    this.#noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = this.#noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
}
