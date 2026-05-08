import { nextPowerOfTwo } from "pragma-dsp/core";
import { FFT } from "pragma-dsp/xform/fourier";
import type { SignalParams, FFTDataRow } from "@/lib/types/signal";

type SignalSampler = (time: number, params: SignalParams) => number;

type SampledSignal = {
  readonly paddedSize: number;
  readonly totalSamples: number;
  readonly realInput: Float64Array;
  readonly timeValues: Float64Array;
  readonly signalValues: Float64Array;
};

function approximatelyZero(value: number): boolean {
  return Math.abs(value) <= 1e-12;
}

function validateBounds(params: SignalParams): void {
  if (!(params.b - params.a > 0)) {
    throw new Error("Invalid interval: b - a must be > 0");
  }
}

function fftShiftIndex(idx: number, size: number): number {
  const center = Math.floor(size / 2);
  return (idx + center) % size;
}

function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) {
    return value;
  }
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function applyTimeOriginCorrection(
  real: number,
  imag: number,
  frequency: number,
  startTime: number
) {
  const angle = -2 * Math.PI * frequency * startTime;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    real: real * cos - imag * sin,
    imag: real * sin + imag * cos,
  };
}

function sampleSignal(params: SignalParams, sampler: SignalSampler): SampledSignal {
  const totalSamples = Math.ceil((params.b - params.a) / params.interval) + 1;
  const paddedSize = nextPowerOfTwo(totalSamples);
  const realInput = new Float64Array(paddedSize);
  const timeValues = new Float64Array(totalSamples);
  const signalValues = new Float64Array(totalSamples);

  for (let index = 0; index < totalSamples; index += 1) {
    const time = params.a + index * params.interval;
    const sample = sampler(time, params);
    timeValues[index] = time;
    signalValues[index] = sample;
    realInput[index] = sample;
  }

  return {
    paddedSize,
    totalSamples,
    realInput,
    timeValues,
    signalValues,
  };
}

function processFFTOutput(
  spectrum: { readonly real: Float64Array; readonly imag: Float64Array },
  sample: SampledSignal,
  params: SignalParams
): FFTDataRow[] {
  const center = Math.floor(sample.paddedSize / 2);
  const rows: FFTDataRow[] = [];

  for (let k = 0; k < sample.paddedSize; k += 1) {
    const srcIdx = fftShiftIndex(k, sample.paddedSize);
    const frequency = (k - center) / (sample.paddedSize * params.interval);
    const corrected = applyTimeOriginCorrection(
      spectrum.real[srcIdx] ?? 0,
      spectrum.imag[srcIdx] ?? 0,
      frequency,
      params.a
    );

    const real = corrected.real * params.interval;
    const imag = corrected.imag * params.interval;
    const inputTime = k < sample.totalSamples ? sample.timeValues[k] : Number.NaN;
    const inputValue = k < sample.totalSamples ? sample.signalValues[k] : Number.NaN;

    rows.push({
      Freq: roundTo(frequency, 2),
      "re(FFT)": roundTo(real, 5),
      "im(FFT)": roundTo(imag, 5),
      "abs(FFT)": roundTo(Math.hypot(real, imag), 5),
      input: Number.isFinite(inputTime) ? roundTo(inputTime, 5) : inputTime,
      "re(signal)": Number.isFinite(inputValue) ? roundTo(inputValue, 5) : inputValue,
    });
  }

  return rows;
}

async function computeFFTFromSignal(
  params: SignalParams,
  sampler: SignalSampler
): Promise<FFTDataRow[]> {
  validateBounds(params);

  const sampledSignal = sampleSignal(params, sampler);
  const fft = new FFT(sampledSignal.paddedSize);
  const spectrum = fft.forward(sampledSignal.realInput);

  return processFFTOutput(spectrum, sampledSignal, params);
}

function sampleSquare(time: number, params: SignalParams): number {
  const distance = time - params.phase;

  if (params.frequency <= 0) {
    return approximatelyZero(distance) ? params.amplitude : 0;
  }

  return Math.abs(distance) <= params.frequency / 2 + params.interval / 2
    ? params.amplitude
    : 0;
}

function sampleTriangle(time: number, params: SignalParams): number {
  const distance = Math.abs(time - params.phase);

  if (params.frequency <= 0) {
    return approximatelyZero(distance) ? params.amplitude : 0;
  }

  return params.amplitude * Math.max(0, 1 - distance / params.frequency);
}

function sampleSine(time: number, params: SignalParams): number {
  return params.amplitude * Math.sin(2 * Math.PI * params.frequency * time + params.phase);
}

function sampleExponential(time: number, params: SignalParams): number {
  return params.amplitude * Math.exp(time);
}

function sampleSign(time: number): number {
  return approximatelyZero(time) ? 0 : Math.sign(time);
}

function sampleSinc(time: number, params: SignalParams): number {
  const denominator = params.frequency * Math.PI * time - params.phase;

  return approximatelyZero(denominator)
    ? params.amplitude
    : (params.amplitude * Math.sin(denominator)) / denominator;
}

function sampleCosine(time: number, params: SignalParams): number {
  return params.amplitude * Math.cos(2 * Math.PI * params.frequency * time + params.phase);
}

export async function computeFFTSquare(params: SignalParams): Promise<FFTDataRow[]> {
  return computeFFTFromSignal(params, sampleSquare);
}

export async function computeFFTSin(params: SignalParams): Promise<FFTDataRow[]> {
  return computeFFTFromSignal(params, sampleSine);
}

export async function computeFFTExp(params: SignalParams): Promise<FFTDataRow[]> {
  return computeFFTFromSignal(params, sampleExponential);
}

export async function computeFFTSign(params: SignalParams): Promise<FFTDataRow[]> {
  return computeFFTFromSignal(params, (time) => sampleSign(time));
}

export async function computeFFTSinc(params: SignalParams): Promise<FFTDataRow[]> {
  return computeFFTFromSignal(params, sampleSinc);
}

export async function computeFFTCos(params: SignalParams): Promise<FFTDataRow[]> {
  return computeFFTFromSignal(params, sampleCosine);
}

export async function computeFFTTriangle(params: SignalParams): Promise<FFTDataRow[]> {
  return computeFFTFromSignal(params, sampleTriangle);
}

export async function computeFFT(params: SignalParams): Promise<FFTDataRow[]> {
  switch (params.signalShape) {
    case "square":
      return computeFFTSquare(params);
    case "sinc":
      return computeFFTSinc(params);
    case "cos":
      return computeFFTCos(params);
    case "triangle":
      return computeFFTTriangle(params);
    case "sin":
      return computeFFTSin(params);
    case "exp":
      return computeFFTExp(params);
    case "sign":
      return computeFFTSign(params);
    default:
      throw new Error(`Unsupported waveform shape: ${params.signalShape}`);
  }
}
