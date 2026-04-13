import type { ChartDataPoint, FFTDataRow, OutputType, SignalData } from '@/lib/types/signal';

function getOutputColumn(outputType: OutputType): 're(FFT)' | 'im(FFT)' | 'abs(FFT)' {
  switch (outputType) {
    case 'real':
      return 're(FFT)';
    case 'imaginary':
      return 'im(FFT)';
    case 'modulus':
    default:
      return 'abs(FFT)';
  }
}

export function rowsToSignalData(
  rows: readonly FFTDataRow[],
  frequencyLimit: number,
  outputType: OutputType
): SignalData {
  const outputColumn = getOutputColumn(outputType);
  const inputSignal: ChartDataPoint[] = [];
  const outputSignal: ChartDataPoint[] = [];

  for (const row of rows) {
    if (Number.isFinite(row.input) && Number.isFinite(row['re(signal)'])) {
      inputSignal.push({
        time: row.input,
        value: row['re(signal)'],
      });
    }

    if (Number.isFinite(row.Freq) && Number.isFinite(row[outputColumn])) {
      outputSignal.push({
        time: row.Freq,
        value: row[outputColumn],
      });
    }
  }

  inputSignal.sort((left, right) => left.time - right.time);
  outputSignal.sort((left, right) => left.time - right.time);

  return {
    inputSignal,
    outputSignal,
    outputSignalSliced: outputSignal.filter(
      (point) => point.time >= -frequencyLimit && point.time <= frequencyLimit
    ),
  };
}
