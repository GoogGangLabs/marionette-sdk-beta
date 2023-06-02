/* Legacy */

class LowPassFilter {
  private a: number;
  private y: number;
  private s: number;
  private initialized: boolean;

  private setAlpha(alpha: number) {
    this.a = alpha;
  }

  constructor(alpha: number, initval: number = 0.0) {
    this.y = this.s = initval;
    this.setAlpha(alpha);
    this.initialized = false;
  }

  private filter(value: number): number {
    let result: number;
    if (this.initialized) result = this.a * value + (1.0 - this.a) * this.s;
    else {
      result = value;
      this.initialized = true;
    }
    this.y = value;
    this.s = result;
    return result;
  }

  public filterWithAlpha(value: number, alpha: number): number {
    this.setAlpha(alpha);
    return this.filter(value);
  }

  public hasLastRawValue(): boolean {
    return this.initialized;
  }

  public lastRawValue(): number {
    return this.y;
  }

  public reset() {
    this.initialized = false;
  }
}

export class OneEuroFilter {
  private freq: number;
  private mincutoff: number;
  private beta: number;
  private dcutoff: number;
  private x: LowPassFilter;
  private dx: LowPassFilter;
  private lasttime: number;

  private alpha(cutoff: number): number {
    let te = 1.0 / this.freq;
    let tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / te);
  }

  private setFrequency(f: number) {
    this.freq = f;
  }

  private setMinCutoff(mc: number) {
    this.mincutoff = mc;
  }

  private setBeta(b: number) {
    this.beta = b;
  }

  private setDerivateCutoff(dc: number) {
    this.dcutoff = dc;
  }

  constructor(freq: number = 20, mincutoff: number = 1.0, beta: number = 0.0, dcutoff: number = 1.0) {
    this.setFrequency(freq);
    this.setMinCutoff(mincutoff);
    this.setBeta(beta);
    this.setDerivateCutoff(dcutoff);
    this.x = new LowPassFilter(this.alpha(mincutoff));
    this.dx = new LowPassFilter(this.alpha(dcutoff));
    this.lasttime = undefined;
  }

  public reset() {
    this.x.reset();
    this.dx.reset();
    this.lasttime = undefined;
  }

  public filter(value: number, timestamp: number = undefined): number {
    if (this.lasttime != undefined && timestamp != undefined) this.freq = 1.0 / (timestamp - this.lasttime);
    this.lasttime = timestamp;
    let dvalue = this.x.hasLastRawValue() ? (value - this.x.lastRawValue()) * this.freq : 0.0;
    let edvalue = this.dx.filterWithAlpha(dvalue, this.alpha(this.dcutoff));
    let cutoff = this.mincutoff + this.beta * Math.abs(edvalue);
    return this.x.filterWithAlpha(value, this.alpha(cutoff));
  }
}
