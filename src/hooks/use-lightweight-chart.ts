'use client';

import { useRef, useEffect, useCallback, type RefObject, type MutableRefObject } from 'react';
import { createChart, type IChartApi, type ISeriesApi, type SeriesType, AreaSeries, type AreaSeriesOptions, type DeepPartial, type ChartOptions, type LineData, type Time } from 'lightweight-charts';
import type { ChartDataPoint } from '@/lib/types/signal';

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
      Hub?: {
        Queue: (...args: unknown[]) => void;
      };
    };
  }
}

const renderMathJax = (element: HTMLElement, callback?: () => void): void => {
  if (window.MathJax && element) {
    try {
      if (window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([element])
          .then(() => {
            if (callback) callback();
          })
          .catch((error: Error) => {
            console.error('MathJax typesetPromise error:', error);
          });
      } else if (window.MathJax.Hub?.Queue) {
        window.MathJax.Hub.Queue(
          ['Typeset', window.MathJax.Hub, element],
          [() => { if (callback) callback(); }]
        );
      } else {
        console.warn('MathJax typeset method not found');
      }
    } catch (error) {
      console.error('Error triggering MathJax:', error);
    }
  }
};

const setTooltipHtml = (legend: HTMLElement, name: string, time: string, value: string): void => {
  let formulaDiv = legend.querySelector<HTMLElement>('.mathjax-formula');
  let valueDiv = legend.querySelector<HTMLElement>('.value-display');
  let timeDiv = legend.querySelector<HTMLElement>('.time-display');

  if (!formulaDiv) {
    legend.innerHTML = `
      <div class="mathjax-formula text-base md:text-lg my-0">${name}</div>
      <div class="value-display text-sm md:text-base my-0">${value}</div>
      <div class="time-display text-xs md:text-sm my-0">${time}</div>
    `;

    formulaDiv = legend.querySelector<HTMLElement>('.mathjax-formula');
    valueDiv = legend.querySelector<HTMLElement>('.value-display');
    timeDiv = legend.querySelector<HTMLElement>('.time-display');
  }

  if (valueDiv) valueDiv.innerHTML = value;
  if (timeDiv) timeDiv.innerHTML = time;

  if (formulaDiv) {
    formulaDiv.style.visibility = 'hidden';
    formulaDiv.innerHTML = name;

    renderMathJax(formulaDiv, () => {
      if (formulaDiv) formulaDiv.style.visibility = 'visible';
    });
  }
};

const formatPrice = (price: number): string => price.toFixed(3);

const formatTime = (t: number | string): string => {
  const n = typeof t === 'number' ? t : parseFloat(t);
  if (!Number.isFinite(n)) return String(t);
  return (Math.round(n * 100) / 100).toFixed(2);
};

const getLastBar = (series: ISeriesApi<SeriesType>): LineData<Time> | null => {
  if (!series) return null;
  const data = series.data() as LineData<Time>[];
  return data.length > 0 ? data[data.length - 1] : null;
};

export interface ChartHookOptions {
  layout?: DeepPartial<ChartOptions['layout']>;
  crosshair?: DeepPartial<ChartOptions['crosshair']>;
  grid?: DeepPartial<ChartOptions['grid']>;
  timeScale?: DeepPartial<ChartOptions['timeScale']>;
  rightPriceScale?: DeepPartial<ChartOptions['rightPriceScale']>;
  handleScroll?: boolean;
  handleScale?: boolean;
}

export interface SeriesOptions {
  topColor?: string;
  bottomColor?: string;
  lineColor?: string;
  lineWidth?: number;
  priceLineVisible?: boolean;
  lastValueVisible?: boolean;
}

export function useLightweightChart(
  containerRef: RefObject<HTMLDivElement | null>,
  legendRef: RefObject<HTMLDivElement | null>,
  symbolNameRef: MutableRefObject<string>,
  chartOptions: DeepPartial<ChartOptions>,
  seriesOptions: DeepPartial<AreaSeriesOptions>
) {
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);

  const updateLegend = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (param?: any) => {
      if (!seriesRef.current || !legendRef.current || !symbolNameRef.current) return;

      const validCrosshairPoint = !(
        param === undefined ||
        param.time === undefined ||
        (param.point && (param.point.x < 0 || param.point.y < 0))
      );

      let bar: LineData<Time> | null = null;
      if (validCrosshairPoint && param) {
        if (param.seriesData && param.seriesData.has(seriesRef.current)) {
          bar = param.seriesData.get(seriesRef.current) as LineData<Time>;
        } else {
          console.warn('Could not get series data from crosshair event. Falling back to last bar.');
          bar = getLastBar(seriesRef.current as ISeriesApi<SeriesType>);
        }
      } else {
        bar = getLastBar(seriesRef.current as ISeriesApi<SeriesType>);
      }

      if (!bar) return;

      const time = bar.time ?? 'N/A';
      const price = bar.value ?? 0;
      const formattedPrice = formatPrice(price);
      const symbolName = symbolNameRef.current;

      setTooltipHtml(legendRef.current, symbolName, formatTime(time as number), formattedPrice);
    },
    [legendRef, symbolNameRef]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, chartOptions);
    const series = chart.addSeries(AreaSeries, seriesOptions);

    chartRef.current = chart;
    seriesRef.current = series;

    chart.subscribeCrosshairMove(updateLegend);
    updateLegend(undefined);

    return () => {
      chart.unsubscribeCrosshairMove(updateLegend);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [containerRef, chartOptions, seriesOptions, updateLegend]);

  const setData = useCallback((data: ChartDataPoint[]) => {
    if (seriesRef.current && chartRef.current) {
      seriesRef.current.setData(data as LineData<Time>[]);
      chartRef.current.timeScale().fitContent();
      requestAnimationFrame(() => updateLegend(undefined));
    }
  }, [updateLegend]);

  const fitContent = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, []);

  return { setData, fitContent, updateLegend };
}

