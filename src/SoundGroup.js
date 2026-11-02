const FREQ = { C: 261.63, D: 293.66, E: 329.63, G: 392, A: 440 };

export class SoundGroup {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  label(pad) {
    return pad.name;
  }

  play() {
    throw new Error(`${this.constructor.name} must implement play()`);
  }
}

export class DrumGroup extends SoundGroup {
  #instrument;
  #tune;

  constructor(id, name, instrument, tune = 1) {
    super(id, name);
    this.#instrument = instrument;
    this.#tune = tune;
  }

  play(pad, index, when, pitch) {
    this.#instrument[pad.voice](when, this.#tune * pitch);
  }
}

export class NoteGroup extends SoundGroup {
  #instrument;
  #notes;

  constructor(id, name, instrument, notes) {
    super(id, name);
    this.#instrument = instrument;
    this.#notes = notes;
  }

  label(pad, index) {
    return this.#notes[index];
  }

  play(pad, index, when, pitch) {
    const note = this.#notes[index];
    this.#instrument.pluck(when, FREQ[note[0]] * 2 ** (Number(note[1]) - 4) * pitch);
  }
}
