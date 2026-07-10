"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as Effect from "effect/Effect";
import type { OutputType, SignalData, SignalParams } from "@/lib/types/signal";
import {
  describeWorkbenchError,
  isWorkbenchError,
  runSignalWorkbench,
  signalWorkbench,
  type SignalDraft,
  type SignalWorkbenchState,
} from "@/features/signal-workbench";

interface SignalContextValue {
  draft: SignalDraft;
  signalParams: SignalParams;
  signalData: SignalData;
  hasCommittedSignal: boolean;
  isLoading: boolean;
  status: SignalWorkbenchState["status"];
  outputType: OutputType;
  updateVersion: number;
  errorMessage: string | null;
  updateDraft: (updates: Partial<SignalDraft>) => void;
  submitDraft: () => Promise<void>;
  setOutputType: (type: OutputType) => void;
}

const SignalContext = createContext<SignalContextValue | null>(null);

interface SignalProviderProps {
  children: ReactNode;
}

function getWorkbenchMessage(error: unknown): string {
  if (isWorkbenchError(error)) {
    return describeWorkbenchError(error);
  }
  return "An unexpected signal workbench error occurred.";
}

export function SignalProvider({ children }: SignalProviderProps) {
  const [workbenchState, setWorkbenchState] = useState<SignalWorkbenchState>(
    signalWorkbench.initialState,
  );
  const stateRef = useRef(workbenchState);

  const commitState = useCallback((nextState: SignalWorkbenchState) => {
    stateRef.current = nextState;
    setWorkbenchState(nextState);
  }, []);

  useEffect(() => {
    let isActive = true;

    void runSignalWorkbench(signalWorkbench.bootstrap()).then(
      (readyState) => {
        if (isActive) {
          commitState(readyState);
        }
      },
      (error: unknown) => {
        if (!isActive) {
          return;
        }

        Effect.runFork(
          Effect.logError("[signal-workbench] bootstrap failed", error),
        );
        commitState(
          signalWorkbench.transition(stateRef.current, {
            type: "failed",
            message: getWorkbenchMessage(error),
          }),
        );
      },
    );

    return () => {
      isActive = false;
    };
  }, [commitState]);

  const updateDraft = useCallback(
    (updates: Partial<SignalDraft>) => {
      const nextState = signalWorkbench.transition(stateRef.current, {
        type: "draftEdited",
        updates,
      });
      commitState(nextState);

      void runSignalWorkbench(signalWorkbench.persistDraft(nextState.draft)).catch(
        (error: unknown) => {
          Effect.runFork(
            Effect.logError(
              "[signal-workbench] draft persistence failed",
              error,
            ),
          );
        },
      );
    },
    [commitState],
  );

  const submitDraft = useCallback(() => {
    const generatingState = signalWorkbench.transition(stateRef.current, {
      type: "generationStarted",
    });
    commitState(generatingState);

    return runSignalWorkbench(signalWorkbench.generate(generatingState)).then(
      (readyState) => {
        commitState(readyState);
      },
      (error: unknown) => {
        Effect.runFork(
          Effect.logError("[signal-workbench] submit failed", error),
        );
        commitState(
          signalWorkbench.transition(stateRef.current, {
            type: "failed",
            message: getWorkbenchMessage(error),
          }),
        );
      },
    );
  }, [commitState]);

  const setOutputType = useCallback(
    (outputType: OutputType) => {
      commitState(
        signalWorkbench.transition(stateRef.current, {
          type: "outputSelected",
          outputType,
        }),
      );
    },
    [commitState],
  );

  const signalData = useMemo(
    () => signalWorkbench.chartData(workbenchState),
    [workbenchState],
  );

  const value = useMemo<SignalContextValue>(
    () => ({
      draft: workbenchState.draft,
      signalParams: workbenchState.committedSignal,
      signalData,
      hasCommittedSignal: workbenchState.rows.length > 0,
      isLoading:
        workbenchState.status === "booting" ||
        workbenchState.status === "generating",
      status: workbenchState.status,
      outputType: workbenchState.outputType,
      updateVersion: workbenchState.revision,
      errorMessage: workbenchState.errorMessage,
      updateDraft,
      submitDraft,
      setOutputType,
    }),
    [workbenchState, signalData, setOutputType, submitDraft, updateDraft],
  );

  return (
    <SignalContext.Provider value={value}>{children}</SignalContext.Provider>
  );
}

export function useSignal() {
  const context = useContext(SignalContext);

  if (context === null) {
    throw new Error("useSignal must be used within a SignalProvider");
  }

  return context;
}
