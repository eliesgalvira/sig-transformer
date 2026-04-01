'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useSignal } from '@/contexts/signal-context';
import { useSignalData } from '@/hooks/use-signal-data';
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

  const { signalParams, isLoading, outputType, updateVersion, setOutputType } = useSignal();
  const { getData, isDbReady } = useSignalData();

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
        textColor: 'white',
        background: { type: ColorType.Solid, color: '#171717' },
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
  }, []);

  const inputSeriesOptions = useMemo<DeepPartial<AreaSeriesOptions>>(
    () => ({
      topColor: '#d5b8f9',
      bottomColor: 'rgba(213, 184, 249, 0.5)',
      lineColor: '#d5b8f9',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: { type: 'price', precision: 3, minMove: 0.001 },
    }),
    []
  );

  const outputSeriesOptions = useMemo<DeepPartial<AreaSeriesOptions>>(
    () => ({
      topColor: '#d5b8f9',
      bottomColor: 'rgba(143, 67, 234, 0.33)',
      lineColor: '#d5b8f9',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: { type: 'price', precision: 3, minMove: 0.001 },
    }),
    []
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
    if (!signalParams || !isDbReady) return;

    const updateCharts = async () => {
      try {
        const { inputSymbolName, outputSymbolName } = formatLegend(signalParams, outputType);
        inputSymbolNameRef.current = inputSymbolName;
        outputSymbolNameRef.current = outputSymbolName;

        const frequencyLimit = signalParams.freqrange || 10;
        const { inputSignal, outputSignalSliced } = await getData(frequencyLimit, outputType);

        setInputChartData(inputSignal);
        setOutputChartData(outputSignalSliced);

        requestAnimationFrame(() => {
          updateInputLegendManual(undefined);
          updateOutputLegendManual(undefined);
        });
      } catch (error) {
        console.error('Error updating chart data:', error);
      }
    };

    updateCharts();
  }, [
    signalParams,
    isDbReady,
    outputType,
    updateVersion,
    getData,
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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-sm z-20 rounded-lg pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-t-purple-400 border-purple-400/20 rounded-full animate-spin"></div>
            <p className="text-purple-400/80 text-xs font-mono font-bold tracking-widest uppercase">Processing signal data...</p>
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
          className="absolute left-0 top-0 z-10 font-mono text-xs font-light text-neutral-300 p-2 rounded pointer-events-none max-w-[80vw] md:max-w-xl break-words"
        />
      </div>

      <Tabs value={outputType} onValueChange={handleTabChange} className="w-fit z-10 my-2 shrink-0">
        <TabsList className="h-8 bg-neutral-900/50 border border-purple-500/20 p-0.5">
          <TabsTrigger value="real" className="h-7 px-3 text-xs font-mono font-medium text-neutral-500 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 data-[state=active]:border-purple-500/30 transition-colors uppercase tracking-wider">Real</TabsTrigger>
          <TabsTrigger value="imaginary" className="h-7 px-3 text-xs font-mono font-medium text-neutral-500 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 data-[state=active]:border-purple-500/30 transition-colors uppercase tracking-wider">Imaginary</TabsTrigger>
          <TabsTrigger value="modulus" className="h-7 px-3 text-xs font-mono font-medium text-neutral-500 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 data-[state=active]:border-purple-500/30 transition-colors uppercase tracking-wider">Modulus</TabsTrigger>
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
          className="absolute left-0 top-0 z-10 font-mono text-xs font-light text-neutral-300 p-2 rounded pointer-events-none max-w-[80vw] md:max-w-xl break-words"
        />
      </div>
    </div>
  );
}
