'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { getDB } from '@/lib/db';
import type { ChartDataPoint, SignalData, OutputType } from '@/lib/types/signal';

export function useSignalData() {
  const dbRef = useRef<ReturnType<typeof getDB> | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const initializeDB = async () => {
      try {
        const db = getDB();
        if (isMounted) {
          dbRef.current = db;
          setIsDbReady(true);
        }
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
      }
    };
    
    initializeDB();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const getData = useCallback(
    async (frequencyLimit: number, outputType: OutputType = 'modulus'): Promise<SignalData> => {
      if (!isDbReady || !dbRef.current) {
        console.warn('IndexedDB not initialized yet.');
        return { inputSignal: [], outputSignal: [], outputSignalSliced: [] };
      }

      let outputFunction: 're(FFT)' | 'im(FFT)' | 'abs(FFT)' = 'abs(FFT)';
      switch (outputType) {
        case 'real':
          outputFunction = 're(FFT)';
          break;
        case 'imaginary':
          outputFunction = 'im(FFT)';
          break;
        case 'modulus':
        default:
          outputFunction = 'abs(FFT)';
          break;
      }

      try {
        const data = await dbRef.current.signals.toArray();
        const inputSignal: ChartDataPoint[] = [];
        const outputSignal: ChartDataPoint[] = [];

        data.forEach((row) => {
          const freq = row.Freq;
          const inputTime = row.input;
          const inputVal = row['re(signal)'];
          const outputVal = row[outputFunction];

          if (!isNaN(inputTime) && !isNaN(inputVal)) {
            inputSignal.push({ time: inputTime, value: inputVal });
          }
          if (!isNaN(freq) && !isNaN(outputVal)) {
            outputSignal.push({ time: freq, value: outputVal });
          }
        });

        // Sort just in case data isn't ordered (Lightweight Charts expects ascending time)
        inputSignal.sort((a, b) => a.time - b.time);
        outputSignal.sort((a, b) => a.time - b.time);

        const outputSignalSliced = outputSignal.filter(
          (point) => point.time >= -frequencyLimit && point.time <= frequencyLimit
        );

        return { inputSignal, outputSignal, outputSignalSliced };
      } catch (error) {
        console.error('Error fetching data from IndexedDB:', error);
        return { inputSignal: [], outputSignal: [], outputSignalSliced: [] };
      }
    },
    [isDbReady]
  );

  return { getData, isDbReady };
}

