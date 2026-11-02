export class Instrument {
  #audio;

  constructor(engine) {
    this.#audio = engine;
  }

  kick(t, p) {
    const o = this.#audio.oscillator(t, 'sine', 160 * p, this.#audio.envelope(t, 1, 0.45), 0.5);
    o.frequency.exponentialRampToValueAtTime(42 * p, t + 0.12);
  }

  snare(t, p) {
    this.#audio.noiseBurst(t, this.#audio.envelope(t, 0.6, 0.2), 0.25, 'highpass', 1200 * p);
    this.#audio.oscillator(t, 'triangle', 190 * p, this.#audio.envelope(t, 0.5, 0.1), 0.15);
  }

  hat(t, p) {
    this.#hat(t, 0.06, p);
  }

  openHat(t, p) {
    this.#hat(t, 0.35, p);
  }

  clap(t, p) {
    [0, 0.012, 0.024].forEach((d) =>
      this.#audio.noiseBurst(t + d, this.#audio.envelope(t + d, 0.5, 0.06), 0.08, 'bandpass', 1500 * p));
    this.#audio.noiseBurst(t + 0.03, this.#audio.envelope(t + 0.03, 0.4, 0.18), 0.22, 'bandpass', 1300 * p);
  }

  tomHi(t, p) {
    this.#tom(t, 220 * p);
  }

  tomLo(t, p) {
    this.#tom(t, 130 * p);
  }

  rim(t, p) {
    this.#audio.oscillator(t, 'square', 1700 * p, this.#audio.envelope(t, 0.3, 0.03), 0.05);
    this.#audio.noiseBurst(t, this.#audio.envelope(t, 0.2, 0.02), 0.04, 'highpass', 3000 * p);
  }

  cowbell(t, p) {
    const out = this.#audio.envelope(t, 0.25, 0.35);
    this.#audio.oscillator(t, 'square', 540 * p, out, 0.4);
    this.#audio.oscillator(t, 'square', 800 * p, out, 0.4);
  }

  zap(t, p) {
    const o = this.#audio.oscillator(t, 'sawtooth', 1800 * p, this.#audio.envelope(t, 0.25, 0.25), 0.3);
    o.frequency.exponentialRampToValueAtTime(60 * p, t + 0.25);
  }

  bass(t, p) {
    const f = this.#audio.sweep(t, 900, 120, 0.3, this.#audio.envelope(t, 0.5, 0.4, 0.005));
    this.#audio.oscillator(t, 'sawtooth', 55 * p, f, 0.45);
  }

  chord(t, p) {
    const out = this.#audio.envelope(t, 0.18, 0.9, 0.01);
    [220, 261.63, 329.63, 392].forEach((freq) => this.#audio.oscillator(t, 'triangle', freq * p, out, 1));
  }

  pluck(t, freq) {
    const f = this.#audio.sweep(t, freq * 6, freq, 0.25, this.#audio.envelope(t, 0.3, 0.5, 0.004));
    this.#audio.oscillator(t, 'sawtooth', freq, f, 0.55);
    this.#audio.oscillator(t, 'square', freq / 2, f, 0.55);
  }

  #hat(t, decay, p) {
    this.#audio.noiseBurst(t, this.#audio.envelope(t, 0.35, decay), decay + 0.05, 'highpass', 7000 * p);
  }

  #tom(t, freq) {
    const o = this.#audio.oscillator(t, 'sine', freq, this.#audio.envelope(t, 0.8, 0.35), 0.4);
    o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.3);
  }
}
