class LowPassFilter {
  cutoff: number;
  value: number;
  isInitialized: boolean;

  constructor(cutoff: number) {
    this.cutoff = cutoff;
    this.value = null;
    this.isInitialized = false;
  }

  alpha(cutoff) {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau);
  }

  update(value, alpha = this.alpha(this.cutoff)) {
    if (this.value === null) {
      this.value = value;
      return this.value;
    }

    this.value = alpha * value + (1 - alpha) * this.value;
    return this.value;
  }

  reset() {
    this.value = null;
  }
}

export class OneEuroFilter {
  minCutoff: number;
  beta: number;
  dCutoff: number;
  freq: number;

  x: LowPassFilter;
  dx: LowPassFilter;
  lastTime: number;

  constructor(minCutoff = 1.0, beta = 0.0, dCutoff = 1.0, freq = 60) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.freq = freq;

    this.x = new LowPassFilter(minCutoff);
    this.dx = new LowPassFilter(dCutoff);
    this.lastTime = null;
  }

  alpha(cutoff: number) {
    const te = 1.0 / this.freq;
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / te);
  }

  filter(value: number, timestamp = Date.now()) {
    if (this.lastTime === null) {
      this.lastTime = timestamp;
      this.x.update(value, this.alpha(this.minCutoff));
      return this.x.value;
    }

    const duration = (timestamp - this.lastTime) / 1000;
    this.freq = 1 / duration;
    this.lastTime = timestamp;

    const prevX = this.x.value;
    this.x.update(value, this.alpha(this.minCutoff));
    const dx = (this.x.value - prevX) / duration;
    const edx = this.dx.update(dx, this.alpha(this.dCutoff));
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);

    return this.x.update(value, this.alpha(cutoff));
  }

  reset() {
    this.x.reset();
    this.dx.reset();
    this.lastTime = null;
  }
}
