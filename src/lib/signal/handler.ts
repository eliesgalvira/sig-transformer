import type { SignalParams, SignalParamsRaw, DEFAULT_PARAMS } from '@/lib/types/signal';

const STORAGE_KEY = 'signalParams';

export function saveSignalParamsToLocalStorage(params: SignalParams): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    return true;
  } catch (error) {
    console.error('Error saving to LocalStorage:', error);
    return false;
  }
}

export function loadSignalParamsFromLocalStorage(): SignalParams {
  const defaultParams: SignalParams = {
    a: -20,
    b: 20,
    signalShape: 'sinc',
    amplitude: 1,
    frequency: 1,
    phase: 0,
    interval: 0.01,
    freqrange: 4,
  };

  try {
    const storedParams = localStorage.getItem(STORAGE_KEY);
    if (!storedParams) {
      saveSignalParamsToLocalStorage(defaultParams);
      return defaultParams;
    }
    return JSON.parse(storedParams) as SignalParams;
  } catch (error) {
    console.error('Error reading from LocalStorage:', error);
    return defaultParams;
  }
}

export function parseSignalParams(raw: SignalParamsRaw): SignalParams {
  return {
    a: parseFloat(raw.a),
    b: parseFloat(raw.b),
    signalShape: raw.signalShape,
    amplitude: parseFloat(raw.amplitude),
    frequency: parseFloat(raw.frequency),
    phase: parseFloat(raw.phase),
    interval: parseFloat(raw.interval),
    freqrange: parseFloat(raw.freqrange),
  };
}

export function getWaveformLabel(shape: SignalParams['signalShape']): string {
  const labels: Record<SignalParams['signalShape'], string> = {
    square: 'Square',
    triangle: 'Triangle',
    sinc: 'Sinc',
    cos: 'Cosine',
    sin: 'Sine',
    exp: 'exp',
    sign: 'sign',
  };
  return labels[shape];
}

export function getFrequencyLabel(shape: SignalParams['signalShape']): string {
  switch (shape) {
    case 'square':
      return 'Duration (P):';
    case 'triangle':
      return 'Duration (2P):';
    default:
      return 'Frequency (f₀):';
  }
}

export function getPhaseLabel(shape: SignalParams['signalShape']): string {
  switch (shape) {
    case 'square':
    case 'triangle':
      return 'Translate (X):';
    default:
      return 'Phase (ϕ):';
  }
}

export function calculateDynamicMax(a: number, b: number, interval: number): number {
  const totalSamples = Math.ceil((b - a) / interval);
  const dynamicMax = Math.floor(10 * (totalSamples - Math.round(totalSamples / 2)) / (totalSamples * interval)) / 10;
  return dynamicMax;
}

