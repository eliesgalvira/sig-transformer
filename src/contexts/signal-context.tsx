'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { OutputType, SignalData, SignalParams } from '@/lib/types/signal';
import { DEFAULT_PARAMS } from '@/lib/types/signal';
import {
  DEFAULT_SIGNAL_DRAFT,
  bootstrapSignalWorkbench,
  describeWorkbenchError,
  loadSignalChartData,
  mergeSignalDraft,
  persistSignalDraft,
  runSignalWorkbench,
  submitSignalDraft,
  toSignalDraft,
  type SignalDraft,
} from '@/features/signal-workbench';

type SignalWorkbenchStatus = 'booting' | 'ready' | 'generating' | 'error';

interface SignalContextValue {
  draft: SignalDraft;
  signalParams: SignalParams;
  isLoading: boolean;
  status: SignalWorkbenchStatus;
  outputType: OutputType;
  updateVersion: number;
  errorMessage: string | null;
  updateDraft: (updates: Partial<SignalDraft>) => void;
  submitDraft: () => Promise<void>;
  setOutputType: (type: OutputType) => void;
  loadSignalData: (type?: OutputType) => Promise<SignalData>;
}

const SignalContext = createContext<SignalContextValue | null>(null);

interface SignalProviderProps {
  children: ReactNode;
}

function getWorkbenchMessage(error: unknown): string {
  if (error && typeof error === 'object' && '_tag' in error) {
    return describeWorkbenchError(error as never);
  }
  return 'An unexpected signal workbench error occurred.';
}

export function SignalProvider({ children }: SignalProviderProps) {
  const [draft, setDraft] = useState<SignalDraft>(DEFAULT_SIGNAL_DRAFT);
  const [signalParams, setSignalParams] = useState<SignalParams>(DEFAULT_PARAMS);
  const [status, setStatus] = useState<SignalWorkbenchStatus>('booting');
  const [outputType, setOutputType] = useState<OutputType>('modulus');
  const [updateVersion, setUpdateVersion] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    void runSignalWorkbench(bootstrapSignalWorkbench()).then(
      (bootstrap) => {
        if (!isActive) {
          return;
        }

        setDraft(bootstrap.draft);
        setSignalParams(bootstrap.signalParams);
        setStatus('ready');
        setErrorMessage(null);
        if (bootstrap.generatedOnBoot) {
          setUpdateVersion(1);
        }
      },
      (error: unknown) => {
        if (!isActive) {
          return;
        }

        console.error('[signal-workbench] bootstrap failed', error);
        setStatus('error');
        setErrorMessage(getWorkbenchMessage(error));
      }
    );

    return () => {
      isActive = false;
    };
  }, []);

  const updateDraft = useCallback((updates: Partial<SignalDraft>) => {
    setDraft((currentDraft) => {
      const nextDraft = mergeSignalDraft(currentDraft, updates);

      void runSignalWorkbench(persistSignalDraft(nextDraft)).catch((error: unknown) => {
        console.error('[signal-workbench] draft persistence failed', error);
      });

      return nextDraft;
    });
  }, []);

  const submitDraft = useCallback(async () => {
    setStatus('generating');
    setErrorMessage(null);

    try {
      const nextParams = await runSignalWorkbench(submitSignalDraft(draft));

      setDraft(toSignalDraft(nextParams));
      setSignalParams(nextParams);
      setOutputType('modulus');
      setStatus('ready');
      setUpdateVersion((version) => version + 1);
    } catch (error) {
      console.error('[signal-workbench] submit failed', error);
      setStatus('error');
      setErrorMessage(getWorkbenchMessage(error));
    }
  }, [draft]);

  const loadSignalData = useCallback(
    async (type: OutputType = outputType) =>
      runSignalWorkbench(loadSignalChartData(signalParams, type)),
    [outputType, signalParams]
  );

  const value = useMemo<SignalContextValue>(
    () => ({
      draft,
      signalParams,
      isLoading: status === 'booting' || status === 'generating',
      status,
      outputType,
      updateVersion,
      errorMessage,
      updateDraft,
      submitDraft,
      setOutputType,
      loadSignalData,
    }),
    [
      draft,
      signalParams,
      status,
      outputType,
      updateVersion,
      errorMessage,
      updateDraft,
      submitDraft,
      loadSignalData,
    ]
  );

  return <SignalContext.Provider value={value}>{children}</SignalContext.Provider>;
}

export function useSignal() {
  const context = useContext(SignalContext);

  if (!context) {
    throw new Error('useSignal must be used within a SignalProvider');
  }

  return context;
}
