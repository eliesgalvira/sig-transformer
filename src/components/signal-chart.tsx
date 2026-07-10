"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSignal } from "@/contexts/signal-context";
import { useWorkbenchTheme } from "@/hooks/use-workbench-theme";
import { useLightweightChart } from "@/hooks/use-lightweight-chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createSignalChartOptions,
  createSignalSeriesOptions,
  getSignalChartLegend,
  normalizeOutputType,
} from "@/features/signal-workbench";

export function SignalChart() {
  const container1Ref = useRef<HTMLDivElement>(null);
  const container2Ref = useRef<HTMLDivElement>(null);
  const inputLegendRef = useRef<HTMLDivElement>(null);
  const outputLegendRef = useRef<HTMLDivElement>(null);

  const inputSymbolNameRef = useRef("");
  const outputSymbolNameRef = useRef("");
  const {
    signalParams,
    signalData,
    hasCommittedSignal,
    isLoading,
    outputType,
    updateVersion,
    setOutputType,
  } = useSignal();
  const { theme } = useWorkbenchTheme();
  const chartKey = `${theme}:${outputType}:${updateVersion}:${signalParams.signalShape}:${signalParams.freqrange}`;
  const isCreamTheme = theme === "cream";

  const chartPalette = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        text: isCreamTheme ? "#352c29" : "#ffffff",
        background: isCreamTheme ? "#f7efe2" : "#17181f",
        line: isCreamTheme ? "#8e5d76" : "#d5b8f9",
        fill: isCreamTheme
          ? "rgba(142, 93, 118, 0.22)"
          : "rgba(213, 184, 249, 0.5)",
        fillStrong: isCreamTheme
          ? "rgba(142, 93, 118, 0.16)"
          : "rgba(143, 67, 234, 0.33)",
      };
    }

    const styles = window.getComputedStyle(document.documentElement);

    return {
      text: styles.getPropertyValue("--wb-chart-text").trim() || "#ffffff",
      background: styles.getPropertyValue("--wb-chart-bg").trim() || "#17181f",
      line: styles.getPropertyValue("--wb-chart-line").trim() || "#d5b8f9",
      fill:
        styles.getPropertyValue("--wb-chart-fill").trim() ||
        "rgba(213, 184, 249, 0.5)",
      fillStrong:
        styles.getPropertyValue("--wb-chart-fill-strong").trim() ||
        "rgba(143, 67, 234, 0.33)",
    };
  }, [isCreamTheme]);

  const commonChartOptions = useMemo(
    () =>
      createSignalChartOptions({
        palette: chartPalette,
        isSmallScreen:
          typeof window !== "undefined" && window.innerWidth < 640,
      }),
    [chartPalette],
  );

  const inputSeriesOptions = useMemo(
    () => createSignalSeriesOptions(chartPalette, "input"),
    [chartPalette],
  );

  const outputSeriesOptions = useMemo(
    () => createSignalSeriesOptions(chartPalette, "output"),
    [chartPalette],
  );

  const { setData: setInputChartData, updateLegend: updateInputLegendManual } =
    useLightweightChart(
      container1Ref,
      inputLegendRef,
      inputSymbolNameRef,
      commonChartOptions,
      inputSeriesOptions,
    );

  const {
    setData: setOutputChartData,
    updateLegend: updateOutputLegendManual,
  } = useLightweightChart(
    container2Ref,
    outputLegendRef,
    outputSymbolNameRef,
    commonChartOptions,
    outputSeriesOptions,
  );

  useEffect(() => {
    const { inputSymbolName, outputSymbolName } = getSignalChartLegend(
      signalParams,
      outputType,
    );
    inputSymbolNameRef.current = inputSymbolName;
    outputSymbolNameRef.current = outputSymbolName;
    setInputChartData(signalData.inputSignal);
    setOutputChartData(signalData.outputSignalSliced);

    const frame = requestAnimationFrame(() => {
      updateInputLegendManual(undefined);
      updateOutputLegendManual(undefined);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [
    signalParams,
    signalData,
    outputType,
    updateVersion,
    chartKey,
    setInputChartData,
    setOutputChartData,
    updateInputLegendManual,
    updateOutputLegendManual,
  ]);

  const handleTabChange = (value: string) => {
    if (value !== outputType) {
      setOutputType(normalizeOutputType(value));
    }
  };

  return (
    <div
      id="chart-root"
      className="relative w-full h-full flex flex-col p-4 pt-10 gap-4 overflow-hidden"
    >
      {isLoading && !hasCommittedSignal ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[var(--wb-chart-bg)]">
          <p
            className="font-mono text-xs font-medium uppercase tracking-widest wb-text-muted"
            aria-live="polite"
          >
            Preparing signal data...
          </p>
        </div>
      ) : null}

      <div
        id="container1"
        ref={container1Ref}
        className="flex-1 min-h-0 w-full relative"
      >
        <div
          id="inputLegend"
          ref={inputLegendRef}
          className="pointer-events-none absolute left-0 top-0 z-10 max-w-[80vw] break-words rounded p-2 font-mono text-xs font-light wb-text md:max-w-xl"
        />
      </div>

      <Tabs
        value={outputType}
        onValueChange={handleTabChange}
        className="w-fit z-10 my-2 shrink-0"
      >
        <TabsList className="wb-panel flex h-8 border p-0.5">
          <TabsTrigger
            value="real"
            className="h-7 px-3 font-mono text-xs font-medium uppercase tracking-wider wb-text-muted data-[state=active]:bg-[var(--wb-accent-soft)] data-[state=active]:text-[var(--wb-accent-strong)] data-[state=active]:border-[var(--wb-border)] transition-colors"
          >
            Real
          </TabsTrigger>
          <TabsTrigger
            value="imaginary"
            className="h-7 px-3 font-mono text-xs font-medium uppercase tracking-wider wb-text-muted data-[state=active]:bg-[var(--wb-accent-soft)] data-[state=active]:text-[var(--wb-accent-strong)] data-[state=active]:border-[var(--wb-border)] transition-colors"
          >
            Imaginary
          </TabsTrigger>
          <TabsTrigger
            value="modulus"
            className="h-7 px-3 font-mono text-xs font-medium uppercase tracking-wider wb-text-muted data-[state=active]:bg-[var(--wb-accent-soft)] data-[state=active]:text-[var(--wb-accent-strong)] data-[state=active]:border-[var(--wb-border)] transition-colors"
          >
            Modulus
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div
        id="container2"
        ref={container2Ref}
        className="flex-1 min-h-0 w-full relative"
      >
        <div
          id="outputLegend"
          ref={outputLegendRef}
          className="pointer-events-none absolute left-0 top-0 z-10 max-w-[80vw] break-words rounded p-2 font-mono text-xs font-light wb-text md:max-w-xl"
        />
      </div>
    </div>
  );
}
