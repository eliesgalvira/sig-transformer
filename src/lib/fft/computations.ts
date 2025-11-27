import FFT from 'fft.js';
import type { SignalParams, FFTDataRow } from '@/lib/types/signal';

function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function fftShiftIndex(idx: number, size: number): number {
  const center = Math.floor(size / 2);
  return (idx + center) % size;
}

function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return value;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

interface FFTResult {
  rows: FFTDataRow[];
  totalSamples: number;
  paddedSize: number;
}

function processFFTOutput(
  out: number[],
  paddedSize: number,
  totalSamples: number,
  interval: number,
  timeValues: Float64Array,
  signalValues: Float64Array
): FFTDataRow[] {
  const center = Math.floor(paddedSize / 2);
  const rows: FFTDataRow[] = [];

  for (let k = 0; k < paddedSize; k++) {
    const srcIdx = fftShiftIndex(k, paddedSize);
    const reRaw = out[2 * srcIdx];
    const imRaw = out[2 * srcIdx + 1];
    const reScaled = reRaw * interval;
    const imScaled = imRaw * interval;
    const absScaled = Math.hypot(reScaled, imScaled);
    const freq = (k - center) / (paddedSize * interval);

    const inputTime = k < totalSamples ? timeValues[k] : NaN;
    const inputVal = k < totalSamples ? signalValues[k] : NaN;

    const freqRounded = roundTo(freq, 2);
    const reRounded = roundTo(reScaled, 5);
    const imRounded = roundTo(imScaled, 5);
    const absRounded = roundTo(absScaled, 5);
    const inputTimeRounded = Number.isFinite(inputTime) ? roundTo(inputTime, 5) : inputTime;
    const inputValRounded = Number.isFinite(inputVal) ? roundTo(inputVal, 5) : inputVal;

    rows.push({
      Freq: freqRounded,
      're(FFT)': reRounded,
      'im(FFT)': imRounded,
      'abs(FFT)': absRounded,
      input: inputTimeRounded,
      're(signal)': inputValRounded,
    });
  }

  return rows;
}

export async function computeFFTSquare(params: SignalParams): Promise<FFTDataRow[]> {
  const { a, b, amplitude: amp, frequency: pulseLength, phase, interval } = params;

  if (!(b - a > 0)) {
    throw new Error('Invalid interval: b - a must be > 0');
  }

  const totalSamples = Math.ceil((b - a) / interval) + 1;
  const paddedSize = nextPowerOfTwo(totalSamples);

  const realInput = new Float64Array(paddedSize);
  const timeValues = new Float64Array(totalSamples);
  const signalValues = new Float64Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = a + i * interval;
    timeValues[i] = t;
    if (Math.abs(t - phase) < pulseLength / 2 + interval / 2) {
      signalValues[i] = amp;
    } else {
      signalValues[i] = 0;
    }
    realInput[i] = signalValues[i];
  }

  const fft = new FFT(paddedSize);
  const out = fft.createComplexArray();
  fft.realTransform(out, realInput);
  fft.completeSpectrum(out);

  return processFFTOutput(out, paddedSize, totalSamples, interval, timeValues, signalValues);
}

export async function computeFFTSin(params: SignalParams): Promise<FFTDataRow[]> {
  const { a, b, amplitude: amp, frequency: f0, phase, interval } = params;

  if (!(b - a > 0)) {
    throw new Error('Invalid interval: b - a must be > 0');
  }

  const totalSamples = Math.ceil((b - a) / interval) + 1;
  const paddedSize = nextPowerOfTwo(totalSamples);

  const realInput = new Float64Array(paddedSize);
  const timeValues = new Float64Array(totalSamples);
  const signalValues = new Float64Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = a + i * interval;
    timeValues[i] = t;
    signalValues[i] = amp * Math.sin(f0 * 2 * Math.PI * t - phase);
    realInput[i] = signalValues[i];
  }

  const fft = new FFT(paddedSize);
  const out = fft.createComplexArray();
  fft.realTransform(out, realInput);
  fft.completeSpectrum(out);

  return processFFTOutput(out, paddedSize, totalSamples, interval, timeValues, signalValues);
}

export async function computeFFTExp(params: SignalParams): Promise<FFTDataRow[]> {
  const { a, b, amplitude: amp, interval } = params;

  if (!(b - a > 0)) {
    throw new Error('Invalid interval: b - a must be > 0');
  }

  const totalSamples = Math.ceil((b - a) / interval) + 1;
  const paddedSize = nextPowerOfTwo(totalSamples);

  const realInput = new Float64Array(paddedSize);
  const timeValues = new Float64Array(totalSamples);
  const signalValues = new Float64Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = a + i * interval;
    timeValues[i] = t;
    signalValues[i] = amp * Math.exp(t);
    realInput[i] = signalValues[i];
  }

  const fft = new FFT(paddedSize);
  const out = fft.createComplexArray();
  fft.realTransform(out, realInput);
  fft.completeSpectrum(out);

  return processFFTOutput(out, paddedSize, totalSamples, interval, timeValues, signalValues);
}

export async function computeFFTSign(params: SignalParams): Promise<FFTDataRow[]> {
  const { a, b, interval } = params;

  if (!(b - a > 0)) {
    throw new Error('Invalid interval: b - a must be > 0');
  }

  const totalSamples = Math.ceil((b - a) / interval) + 1;
  const paddedSize = nextPowerOfTwo(totalSamples);

  const realInput = new Float64Array(paddedSize);
  const timeValues = new Float64Array(totalSamples);
  const signalValues = new Float64Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = a + i * interval;
    timeValues[i] = t;
    if (i === 0) {
      signalValues[i] = 0;
    } else if (i < Math.ceil(totalSamples / 2) + 1) {
      signalValues[i] = 1;
    } else {
      signalValues[i] = -1;
    }
    realInput[i] = signalValues[i];
  }

  const fft = new FFT(paddedSize);
  const out = fft.createComplexArray();
  fft.realTransform(out, realInput);
  fft.completeSpectrum(out);

  return processFFTOutput(out, paddedSize, totalSamples, interval, timeValues, signalValues);
}

export async function computeFFTSinc(params: SignalParams): Promise<FFTDataRow[]> {
  const { a, b, amplitude: amp, frequency: f0, phase, interval } = params;

  if (!(b - a > 0)) {
    throw new Error('Invalid interval: b - a must be > 0');
  }

  const totalSamples = Math.ceil((b - a) / interval) + 1;
  const paddedSize = nextPowerOfTwo(totalSamples);

  const realInput = new Float64Array(paddedSize);
  const timeValues = new Float64Array(totalSamples);
  const signalValues = new Float64Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = a + i * interval;
    timeValues[i] = t;
    const denom = f0 * Math.PI * t - phase;
    if (t !== 0) {
      signalValues[i] = amp * Math.sin(denom) / denom;
    } else {
      signalValues[i] = phase === 0 ? amp : amp * Math.sin(denom) / denom;
    }
    realInput[i] = signalValues[i];
  }

  const fft = new FFT(paddedSize);
  const out = fft.createComplexArray();
  fft.realTransform(out, realInput);
  fft.completeSpectrum(out);

  return processFFTOutput(out, paddedSize, totalSamples, interval, timeValues, signalValues);
}

export async function computeFFTCos(params: SignalParams): Promise<FFTDataRow[]> {
  const { a, b, amplitude: amp, frequency: f0, phase, interval } = params;

  if (!(b - a > 0)) {
    throw new Error('Invalid interval: b - a must be > 0');
  }

  const totalSamples = Math.ceil((b - a) / interval) + 1;
  const paddedSize = nextPowerOfTwo(totalSamples);

  const realInput = new Float64Array(paddedSize);
  const timeValues = new Float64Array(totalSamples);
  const signalValues = new Float64Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = a + i * interval;
    timeValues[i] = t;
    signalValues[i] = amp * Math.cos(f0 * 2 * Math.PI * t - phase);
    realInput[i] = signalValues[i];
  }

  const fft = new FFT(paddedSize);
  const out = fft.createComplexArray();
  fft.realTransform(out, realInput);
  fft.completeSpectrum(out);

  return processFFTOutput(out, paddedSize, totalSamples, interval, timeValues, signalValues);
}

export async function computeFFTTriangle(params: SignalParams): Promise<FFTDataRow[]> {
  const { a, b, amplitude: amp, frequency: pulseLength, phase, interval } = params;

  if (!(b - a > 0)) {
    throw new Error('Invalid interval: b - a must be > 0');
  }

  const totalSamples = Math.ceil((b - a) / interval) + 1;
  const paddedSize = nextPowerOfTwo(totalSamples);

  const realInput = new Float64Array(paddedSize);
  const timeValues = new Float64Array(totalSamples);
  const signalValues = new Float64Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = a + i * interval;
    timeValues[i] = t;
    if (Math.abs(t - phase) < pulseLength + interval / 2) {
      signalValues[i] = amp * (pulseLength - Math.abs(t - phase)) / pulseLength;
    } else {
      signalValues[i] = 0;
    }
    realInput[i] = signalValues[i];
  }

  const fft = new FFT(paddedSize);
  const out = fft.createComplexArray();
  fft.realTransform(out, realInput);
  fft.completeSpectrum(out);

  return processFFTOutput(out, paddedSize, totalSamples, interval, timeValues, signalValues);
}

export async function computeFFT(params: SignalParams): Promise<FFTDataRow[]> {
  switch (params.signalShape) {
    case 'square':
      return computeFFTSquare(params);
    case 'sinc':
      return computeFFTSinc(params);
    case 'cos':
      return computeFFTCos(params);
    case 'triangle':
      return computeFFTTriangle(params);
    case 'sin':
      return computeFFTSin(params);
    case 'exp':
      return computeFFTExp(params);
    case 'sign':
      return computeFFTSign(params);
    default:
      throw new Error(`Unsupported waveform shape: ${params.signalShape}`);
  }
}

