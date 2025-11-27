export type WaveformShape = 'square' | 'triangle' | 'sinc' | 'cos' | 'sin' | 'exp' | 'sign';

export interface SignalParams {
  a: number;
  b: number;
  signalShape: WaveformShape;
  amplitude: number;
  frequency: number;
  phase: number;
  interval: number;
  freqrange: number;
}

export interface SignalParamsRaw {
  a: string;
  b: string;
  signalShape: WaveformShape;
  amplitude: string;
  frequency: string;
  phase: string;
  interval: string;
  freqrange: string;
}

export interface FFTDataRow {
  Freq: number;
  're(FFT)': number;
  'im(FFT)': number;
  'abs(FFT)': number;
  input: number;
  're(signal)': number;
}

export interface ChartDataPoint {
  time: number;
  value: number;
}

export type OutputType = 'modulus' | 'real' | 'imaginary';

export interface SignalData {
  inputSignal: ChartDataPoint[];
  outputSignal: ChartDataPoint[];
  outputSignalSliced: ChartDataPoint[];
}

export const DEFAULT_PARAMS: SignalParams = {
  a: -20,
  b: 20,
  signalShape: 'sinc',
  amplitude: 1,
  frequency: 1,
  phase: 0,
  interval: 0.01,
  freqrange: 4,
};

