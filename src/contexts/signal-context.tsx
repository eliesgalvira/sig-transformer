'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { SignalParams, OutputType } from '@/lib/types/signal';
import { loadSignalParamsFromLocalStorage, saveSignalParamsToLocalStorage } from '@/lib/signal/handler';
import { computeFFT } from '@/lib/fft/computations';
import { loadJSONToIndexedDB, checkDBHasData } from '@/lib/db';

interface SignalContextValue {
  signalParams: SignalParams | null;
  isLoading: boolean;
  outputType: OutputType;
  updateVersion: number;
  generateSignal: (params: SignalParams) => Promise<void>;
  setOutputType: (type: OutputType) => void;
}

const SignalContext = createContext<SignalContextValue | null>(null);

interface SignalProviderProps {
  children: ReactNode;
}

export function SignalProvider({ children }: SignalProviderProps) {
  const [signalParams, setSignalParams] = useState<SignalParams | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [outputType, setOutputType] = useState<OutputType>('modulus');
  const [updateVersion, setUpdateVersion] = useState(0);

  const generateSignal = useCallback(async (params: SignalParams) => {
    setIsLoading(true);
    try {
      const fftData = await computeFFT(params);
      await loadJSONToIndexedDB(fftData);
      saveSignalParamsToLocalStorage(params);
      setSignalParams(params);
      setOutputType('modulus');
      setUpdateVersion(v => v + 1);
    } catch (error) {
      console.error('Error generating signal:', error);
      alert('Error executing FFT');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount - load from localStorage or generate default
  useEffect(() => {
    const initialize = async () => {
      try {
        const hasData = await checkDBHasData();
        const storedParams = loadSignalParamsFromLocalStorage();
        
        if (!hasData) {
          // DB is empty, generate initial data
          await generateSignal(storedParams);
        } else {
          // DB has data, just load params
          setSignalParams(storedParams);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing signal context:', error);
        setIsLoading(false);
      }
    };

    initialize();
  }, [generateSignal]);

  return (
    <SignalContext.Provider
      value={{
        signalParams,
        isLoading,
        outputType,
        updateVersion,
        generateSignal,
        setOutputType,
      }}
    >
      {children}
    </SignalContext.Provider>
  );
}

export function useSignal() {
  const context = useContext(SignalContext);
  if (!context) {
    throw new Error('useSignal must be used within a SignalProvider');
  }
  return context;
}

