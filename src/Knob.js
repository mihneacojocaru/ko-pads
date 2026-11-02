const KEY_STEPS = { ArrowUp: 0.05, ArrowRight: 0.05, ArrowDown: -0.05, ArrowLeft: -0.05 };

export class Knob extends EventTarget {
  #el;
  #cap;
  #value;
  #initial;

  constructor(el, initial) {
    super();
    this.#el = el;
    this.#cap = el.querySelector('.knob_cap');
    this.#initial = initial;
    this.#render(initial);
    this.#bind();
  }

  get name() {
    return this.#el.dataset.knob;
  }

  get value() {
    return this.#value;
  }

  set value(next) {
    this.#render(Math.min(1, Math.max(0, next)));
    this.dispatchEvent(new Event('change'));
  }

  #render(value) {
    this.#value = value;
    this.#cap.style.setProperty('--v', value);
    this.#el.setAttribute('aria-valuenow', Math.round(value * 100));
  }

  #bind() {
    const el = this.#el;
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      const startY = e.clientY;
      const start = this.value;
      const move = (ev) => (this.value = start + (startY - ev.clientY) / 160);
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', () => el.removeEventListener('pointermove', move), { once: true });
    });
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.value -= e.deltaY / 800;
    }, { passive: false });
    el.addEventListener('dblclick', () => (this.value = this.#initial));
    el.addEventListener('keydown', (e) => {
      const step = KEY_STEPS[e.key];
      if (!step) return;
      e.preventDefault();
      e.stopPropagation();
      this.value += step;
    });
  }
}
