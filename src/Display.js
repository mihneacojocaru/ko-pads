export class Display {
  #root;
  #readout;
  #icons;
  #bar;
  #steps;
  #leds;

  constructor(root) {
    this.#root = root;
    this.#readout = root.querySelector('#readout');
    this.#bar = root.querySelector('#bar');
    this.#icons = {
      play: root.querySelector('#icon-play'),
      rec: root.querySelector('#icon-rec'),
      group: root.querySelector('#icon-group'),
      volume: root.querySelector('#icon-vol'),
    };
    const steps = root.querySelector('#steps');
    for (let i = 0; i < 16; i++) steps.append(document.createElement('i'));
    this.#steps = [...steps.children];
    this.#leds = [...root.querySelectorAll('#meter i')];
  }

  show(text) {
    this.#readout.textContent = text;
  }

  setStatus({ playing, recording }) {
    this.#icons.play.classList.toggle('is-on', playing);
    this.#icons.rec.classList.toggle('is-on', recording);
    this.#root.classList.toggle('is-recording', recording);
  }

  setVolume(volume) {
    this.#icons.volume.textContent = `VOL ${volume}`;
  }

  setGroup(id) {
    this.#icons.group.textContent = `GRP ${id}`;
  }

  setStep(step, bar) {
    this.#steps.forEach((el, i) => el.classList.toggle('is-on', i === step));
    this.#bar.textContent = bar ? `BAR ${bar}` : 'BAR -';
    this.#bar.classList.toggle('is-on', Boolean(bar));
  }

  setLevel(level) {
    const lit = Math.round(level * this.#leds.length);
    this.#leds.forEach((el, i) => el.classList.toggle('is-on', i < lit));
  }
}
