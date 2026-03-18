import { DEFAULT_PARAMS, type SignalParams, type SignalParamsRaw } from '@/lib/types/signal';

export const STORAGE_KEY = 'signalParams';

export function saveSignalParamsToLocalStorage(params: SignalParams): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    window.dispatchEvent(new StorageEvent('local-storage', { key: STORAGE_KEY }));
    return true;
  } catch (error) {
    console.error('Error saving to LocalStorage:', error);
    return false;
  }
}

export function loadSignalParamsFromLocalStorage(): SignalParams {
  try {
    const storedParams = localStorage.getItem(STORAGE_KEY);
    if (!storedParams) {
      saveSignalParamsToLocalStorage(DEFAULT_PARAMS);
      return DEFAULT_PARAMS;
    }
    return parseSignalParams(JSON.parse(storedParams) as SignalParamsRaw);
  } catch (error) {
    console.error('Error reading from LocalStorage:', error);
    return DEFAULT_PARAMS;
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
