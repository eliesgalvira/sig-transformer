'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSignal } from '@/contexts/signal-context';
import { useWorkbenchTheme } from '@/hooks/use-workbench-theme';
import { useLightweightChart } from '@/hooks/use-lightweight-chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SignalParams, OutputType } from '@/lib/types/signal';
import { ColorType, type DeepPartial, type ChartOptions, type AreaSeriesOptions } from 'lightweight-charts';

const formatLegend = (signalParams: SignalParams | null, outputType: OutputType = 'modulus') => {
  if (!signalParams) {
    return { inputSymbolName: '\\( \\textbf{x}[n] \\)', outputSymbolName: '\\( \\mathcal{F} \\)' };
  }
  
  const { b, signalShape, amplitude, phase } = signalParams;

  const inputFormatters: Record<string, string> = {
    square: `\\( \\textbf{x}[n] = A \\cdot \\Pi \\left(\\frac{nT-X}{P}\\right) \\)`,
    triangle: `\\( \\textbf{x}[n] = A \\cdot \\Lambda \\left(\\frac{nT-X}{2P}\\right) \\)`,
    sinc: `\\( \\textbf{x}[n] = A \\cdot \\text{sinc}(f_0nT - \\varphi ) = A \\cdot \\frac{\\sin(f_0 \\pi nT - \\varphi )}{f_0 \\pi nT - \\varphi } \\)`,
    sin: `\\( \\textbf{x}[n] = A \\cdot \\sin(2\\pi f_0nT + \\varphi ) \\)`,
    cos: `\\( \\textbf{x}[n] = A \\cdot \\cos(2\\pi f_0nT + \\varphi ) \\)`,
    exp: `\\( \\textbf{x}[n] = ${amplitude}\\cdot e^{nT} \\)`,
    sign: `\\( \\textbf{x}[n] = \\frac{nT}{|nT|} \\forall n \\neq 0 \\)`,
  };

  const outputFormatters: Record<OutputType, Record<string, string>> = {
    modulus: {
      square: `\\( |\\mathcal{F}| = |A| \\cdot P|\\text{sinc}(Pf)| \\)`,
      triangle: `\\( |\\mathcal{F}| = |A| \\cdot P\\text{sinc}^2(Pf) \\)`,
      sinc: `\\( |\\mathcal{F}| = |A| \\cdot \\Pi \\left(\\frac{f}{f_0}\\right) \\)`,
      cos: `\\( |\\mathcal{F}| = \\frac{|A|}{2}[\\delta (f + f_0) + \\delta (f - f_0)] \\)`,
      sin: `\\( |\\mathcal{F}| = \\frac{|A|}{2}[\\delta (f + f_0) + \\delta (f - f_0)] \\)`,
      exp: `\\( |\\mathcal{F}| = e^{${b}}\\cdot \\frac{1}{2\\pi |f|+1} \\)`,
      sign: `\\( |\\mathcal{F}| = \\left| \\frac{2}{f} \\right| \\)`,
    },
    real: {
      square: phase === 0
        ? `\\( \\Re(\\mathcal{F}) = A \\cdot P\\text{sinc}(Pf) \\)`
        : `\\( \\Re(\\mathcal{F}) = A \\cdot P\\text{sinc}(Pf)\\cos(2\\pi f X) \\)`,
      triangle: phase === 0
        ? `\\( \\Re(\\mathcal{F}) = A \\cdot P\\text{sinc}^2(Pf) \\)`
        : `\\( \\Re(\\mathcal{F}) = A \\cdot P\\text{sinc}^2(Pf)\\cos(2\\pi f X) \\)`,
      sinc: phase === 0
        ? `\\( \\Re(\\mathcal{F}) = A \\cdot \\Pi\\left(\\frac{f}{f_0}\\right) \\)`
        : `\\( \\Re(\\mathcal{F}) = A \\cdot \\Pi\\left(\\frac{f}{f_0}\\right)\\cos(2\\pi f \\varphi) \\)`,
      cos: phase === 0
        ? `\\( \\Re(\\mathcal{F}) = \\frac{A}{2}[\\delta (f + f_0) + \\delta (f - f_0)] \\)`
        : `\\( \\Re(\\mathcal{F}) = \\frac{A}{2}[\\delta (f + f_0) + \\delta (f - f_0)]\\cos(\\varphi) \\)`,
      sin: phase === 0
        ? `\\( \\Re(\\mathcal{F}) = 0 \\)`
        : `\\( \\Im(\\mathcal{F}) = - \\frac{A}{2}[\\delta (f - f_0) - \\delta (f + f_0)]\\cos(\\varphi) \\)`,
      exp: `\\( \\Re(\\mathcal{F}) \\)`,
      sign: `\\( \\Re(\\mathcal{F}) = 0 \\)`,
    },
    imaginary: {
      square: phase === 0
        ? `\\( \\Im(\\mathcal{F}) = 0 \\)`
        : `\\( \\Im(\\mathcal{F}) = -A \\cdot P\\text{sinc}(Pf)\\sin(2\\pi f X) \\)`,
      triangle: phase === 0
        ? `\\( \\Im(\\mathcal{F}) = 0 \\)`
        : `\\( \\Im(\\mathcal{F}) = -A \\cdot P\\text{sinc}^2(Pf)\\sin(2\\pi f X) \\)`,
      sinc: phase === 0
        ? `\\( \\Im(\\mathcal{F}) = 0 \\)`
        : `\\( \\Im(\\mathcal{F}) = -A \\cdot \\Pi\\left(\\frac{f}{f_0}\\right)\\sin(2\\pi f \\varphi) \\)`,
      cos: phase === 0
        ? `\\( \\Im(\\mathcal{F}) = 0 \\)`
        : `\\( \\Re(\\mathcal{F}) = \\frac{A}{2}[\\delta (f + f_0) + \\delta (f - f_0)]\\sin(\\varphi) \\)`,
      sin: phase === 0
        ? `\\( \\Im(\\mathcal{F}) = - \\frac{A}{2}[\\delta (f - f_0) - \\delta (f + f_0)] \\)`
        : `\\( \\Im(\\mathcal{F}) = - \\frac{A}{2}[\\delta (f - f_0) - \\delta (f + f_0)]\\sin(\\varphi) \\)`,
      exp: `\\( \\Im(\\mathcal{F}) \\)`,
      sign: `\\( \\Im(\\mathcal{F}) = -\\frac{2}{f} \\)`,
    },
  };

  return {
    inputSymbolName: inputFormatters[signalShape] || `\\( \\textbf{x}[n] \\)`,
    outputSymbolName: outputFormatters[outputType]?.[signalShape] || `\\( \\mathcal{F} \\)`,
  };
};

export function SignalChart() {
  const container1Ref = useRef<HTMLDivElement>(null);
  const container2Ref = useRef<HTMLDivElement>(null);
  const inputLegendRef = useRef<HTMLDivElement>(null);
  const outputLegendRef = useRef<HTMLDivElement>(null);

  const inputSymbolNameRef = useRef('');
  const outputSymbolNameRef = useRef('');
  const [renderedChartKey, setRenderedChartKey] = useState<string | null>(null);

  const { signalParams, isLoading, outputType, updateVersion, setOutputType, loadSignalData } = useSignal();
  const { theme } = useWorkbenchTheme();
  const chartKey = `${theme}:${outputType}:${updateVersion}:${signalParams.signalShape}:${signalParams.freqrange}`;
  const isCreamTheme = theme === 'cream';

  const chartPalette = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        text: isCreamTheme ? '#352c29' : '#ffffff',
        background: isCreamTheme ? '#f7efe2' : '#17181f',
        line: isCreamTheme ? '#8e5d76' : '#d5b8f9',
        fill: isCreamTheme ? 'rgba(142, 93, 118, 0.22)' : 'rgba(213, 184, 249, 0.5)',
        fillStrong: isCreamTheme
          ? 'rgba(142, 93, 118, 0.16)'
          : 'rgba(143, 67, 234, 0.33)',
      };
    }

    const styles = window.getComputedStyle(document.documentElement);

    return {
      text: styles.getPropertyValue('--wb-chart-text').trim() || '#ffffff',
      background: styles.getPropertyValue('--wb-chart-bg').trim() || '#17181f',
      line: styles.getPropertyValue('--wb-chart-line').trim() || '#d5b8f9',
      fill: styles.getPropertyValue('--wb-chart-fill').trim() || 'rgba(213, 184, 249, 0.5)',
      fillStrong:
        styles.getPropertyValue('--wb-chart-fill-strong').trim() || 'rgba(143, 67, 234, 0.33)',
    };
  }, [isCreamTheme]);

  const commonChartOptions = useMemo<DeepPartial<ChartOptions>>(() => {
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640;
    const formatTick = (v: number | string): string => {
      const n = typeof v === 'number' ? v : parseFloat(v);
      if (!Number.isFinite(n)) return String(v);
      return (Math.round(n * 100) / 100).toFixed(2);
    };
    
    return {
      autoSize: true,
      layout: {
        textColor: chartPalette.text,
        background: { type: ColorType.Solid, color: chartPalette.background },
        attributionLogo: false,
      },
      localization: {
        timeFormatter: (time: number) => formatTick(time),
      },
      crosshair: {
        horzLine: { visible: false, labelVisible: false },
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      timeScale: {
        minBarSpacing: 0.1,
        fixLeftEdge: true,
        fixRightEdge: true,
        timeVisible: true,
        borderVisible: false,
        tickMarkFormatter: (time: number) => formatTick(time),
      },
      rightPriceScale: {
        visible: !isSmallScreen,
        scaleMargins: { top: 0.4, bottom: 0.15 },
        borderVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    };
  }, [chartPalette]);

  const inputSeriesOptions = useMemo<DeepPartial<AreaSeriesOptions>>(
    () => ({
      topColor: chartPalette.line,
      bottomColor: chartPalette.fill,
      lineColor: chartPalette.line,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: { type: 'price', precision: 3, minMove: 0.001 },
    }),
    [chartPalette]
  );

  const outputSeriesOptions = useMemo<DeepPartial<AreaSeriesOptions>>(
    () => ({
      topColor: chartPalette.line,
      bottomColor: chartPalette.fillStrong,
      lineColor: chartPalette.line,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: { type: 'price', precision: 3, minMove: 0.001 },
    }),
    [chartPalette]
  );

  const {
    setData: setInputChartData,
    updateLegend: updateInputLegendManual,
  } = useLightweightChart(
    container1Ref,
    inputLegendRef,
    inputSymbolNameRef,
    commonChartOptions,
    inputSeriesOptions
  );

  const {
    setData: setOutputChartData,
    updateLegend: updateOutputLegendManual,
  } = useLightweightChart(
    container2Ref,
    outputLegendRef,
    outputSymbolNameRef,
    commonChartOptions,
    outputSeriesOptions
  );

  // Update charts when signal params change
  useEffect(() => {
    let isActive = true;

    const updateCharts = async () => {
      try {
        const { inputSymbolName, outputSymbolName } = formatLegend(signalParams, outputType);
        inputSymbolNameRef.current = inputSymbolName;
        outputSymbolNameRef.current = outputSymbolName;

        const { inputSignal, outputSignalSliced } = await loadSignalData(outputType);

        setInputChartData(inputSignal);
        setOutputChartData(outputSignalSliced);

        requestAnimationFrame(() => {
          if (!isActive) {
            return;
          }
          updateInputLegendManual(undefined);
          updateOutputLegendManual(undefined);
          setRenderedChartKey(chartKey);
        });
      } catch (error) {
        console.error('Error updating chart data:', error);
      }
    };

    void updateCharts();

    return () => {
      isActive = false;
    };
  }, [
    signalParams,
    outputType,
    updateVersion,
    chartKey,
    loadSignalData,
    setInputChartData,
    setOutputChartData,
    updateInputLegendManual,
    updateOutputLegendManual,
  ]);

  const handleTabChange = (value: string) => {
    if (value !== outputType) {
      setOutputType(value as OutputType);
    }
  };

  return (
    <div id="chart-root" className="relative w-full h-full flex flex-col p-4 pt-10 gap-4 overflow-hidden">
      {/* Loading overlay */}
      {(isLoading || renderedChartKey !== chartKey) && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-[var(--wb-chart-bg)] backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--wb-accent-soft)] border-t-[var(--wb-accent)]"></div>
            <p className="font-mono text-xs font-bold tracking-widest uppercase wb-accent">
              Processing signal data...
            </p>
          </div>
        </div>
      )}

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

      <Tabs value={outputType} onValueChange={handleTabChange} className="w-fit z-10 my-2 shrink-0">
        <TabsList className="wb-panel flex h-8 border p-0.5">
          <TabsTrigger value="real" className="h-7 px-3 font-mono text-xs font-medium uppercase tracking-wider wb-text-muted data-[state=active]:bg-[var(--wb-accent-soft)] data-[state=active]:text-[var(--wb-accent-strong)] data-[state=active]:border-[var(--wb-border)] transition-colors">Real</TabsTrigger>
          <TabsTrigger value="imaginary" className="h-7 px-3 font-mono text-xs font-medium uppercase tracking-wider wb-text-muted data-[state=active]:bg-[var(--wb-accent-soft)] data-[state=active]:text-[var(--wb-accent-strong)] data-[state=active]:border-[var(--wb-border)] transition-colors">Imaginary</TabsTrigger>
          <TabsTrigger value="modulus" className="h-7 px-3 font-mono text-xs font-medium uppercase tracking-wider wb-text-muted data-[state=active]:bg-[var(--wb-accent-soft)] data-[state=active]:text-[var(--wb-accent-strong)] data-[state=active]:border-[var(--wb-border)] transition-colors">Modulus</TabsTrigger>
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
