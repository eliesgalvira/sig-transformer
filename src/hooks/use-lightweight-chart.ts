"use client";

import {
  useRef,
  useEffect,
  useCallback,
  type RefObject,
  type MutableRefObject,
} from "react";
import * as Effect from "effect/Effect";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  AreaSeries,
  type AreaSeriesOptions,
  type DeepPartial,
  type ChartOptions,
  type LineData,
  type MouseEventParams,
  type Time,
} from "lightweight-charts";
import type { ChartDataPoint } from "@/lib/types/signal";

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
      startup?: {
        promise?: Promise<void>;
      };
      Hub?: {
        Queue: (...args: unknown[]) => void;
      };
    };
  }
}

const renderMathJax = (element: HTMLElement, callback?: () => void): void => {
  const mathJax = window.MathJax;

  if (mathJax === undefined) {
    callback?.();
    return;
  }

  try {
    if (mathJax.typesetPromise !== undefined) {
      mathJax.typesetPromise([element])
        .then(() => {
          callback?.();
        })
        .catch((error: Error) => {
          Effect.runFork(Effect.logError("MathJax typesetPromise error:", error));
          callback?.();
        });
      return;
    }

    if (mathJax.startup?.promise !== undefined) {
      mathJax.startup.promise
        .then(() => renderMathJax(element, callback))
        .catch((error: Error) => {
          Effect.runFork(Effect.logError("MathJax startup error:", error));
          callback?.();
        });
      return;
    }

    if (mathJax.Hub?.Queue !== undefined) {
      mathJax.Hub.Queue(["Typeset", mathJax.Hub, element], [callback ?? (() => {})]);
      return;
    }

    callback?.();
  } catch (error) {
    Effect.runFork(Effect.logError("Error triggering MathJax:", error));
    callback?.();
  }
};

function createLegendNode(className: string): HTMLDivElement {
  const element = document.createElement("div");
  element.className = className;
  return element;
}

const setTooltipHtml = (
  legend: HTMLElement,
  name: string,
  time: string,
  value: string,
): void => {
  let formulaDiv = legend.querySelector<HTMLElement>(".mathjax-formula");
  let valueDiv = legend.querySelector<HTMLElement>(".value-display");
  let timeDiv = legend.querySelector<HTMLElement>(".time-display");

  if (formulaDiv === null) {
    legend.replaceChildren(
      createLegendNode("mathjax-formula text-base md:text-lg my-0"),
      createLegendNode("value-display text-sm md:text-base my-0"),
      createLegendNode("time-display text-xs md:text-sm my-0"),
    );

    formulaDiv = legend.querySelector<HTMLElement>(".mathjax-formula");
    valueDiv = legend.querySelector<HTMLElement>(".value-display");
    timeDiv = legend.querySelector<HTMLElement>(".time-display");
  }

  if (valueDiv !== null) valueDiv.textContent = value;
  if (timeDiv !== null) timeDiv.textContent = time;

  if (formulaDiv !== null) {
    formulaDiv.style.visibility = "hidden";
    formulaDiv.textContent = name;

    renderMathJax(formulaDiv, () => {
      if (formulaDiv !== null) formulaDiv.style.visibility = "visible";
    });
  }
};

const formatPrice = (price: number): string => price.toFixed(3);

const formatTime = (t: number | string): string => {
  const n = typeof t === "number" ? t : parseFloat(t);
  if (!Number.isFinite(n)) return String(t);
  return (Math.round(n * 100) / 100).toFixed(2);
};

const getLastBar = (series: ISeriesApi<SeriesType>): LineData<Time> | null => {
  const data = series.data() as LineData<Time>[];
  return data.length > 0 ? data[data.length - 1] : null;
};

export interface ChartHookOptions {
  layout?: DeepPartial<ChartOptions["layout"]>;
  crosshair?: DeepPartial<ChartOptions["crosshair"]>;
  grid?: DeepPartial<ChartOptions["grid"]>;
  timeScale?: DeepPartial<ChartOptions["timeScale"]>;
  rightPriceScale?: DeepPartial<ChartOptions["rightPriceScale"]>;
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
  seriesOptions: DeepPartial<AreaSeriesOptions>,
) {
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  const updateLegend = useCallback(
    (param?: MouseEventParams<Time>) => {
      if (
        seriesRef.current === null ||
        legendRef.current === null ||
        symbolNameRef.current === ""
      ) {
        return;
      }

      const validCrosshairPoint = !(
        param === undefined ||
        param.time === undefined ||
        (param.point !== undefined && (param.point.x < 0 || param.point.y < 0))
      );

      let bar: LineData<Time> | null = null;
      if (validCrosshairPoint && param !== undefined) {
        if (param.seriesData.has(seriesRef.current)) {
          bar = param.seriesData.get(seriesRef.current) as LineData<Time>;
        } else {
          Effect.runFork(
            Effect.logWarning(
              "Could not get series data from crosshair event. Falling back to last bar.",
            ),
          );
          bar = getLastBar(seriesRef.current as ISeriesApi<SeriesType>);
        }
      } else {
        bar = getLastBar(seriesRef.current as ISeriesApi<SeriesType>);
      }

      if (bar === null) return;

      const time = bar.time ?? "N/A";
      const price = bar.value ?? 0;
      const formattedPrice = formatPrice(price);
      const symbolName = symbolNameRef.current;

      setTooltipHtml(
        legendRef.current,
        symbolName,
        formatTime(time as number),
        formattedPrice,
      );
    },
    [legendRef, symbolNameRef],
  );

  useEffect(() => {
    if (containerRef.current === null) return;

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

  const setData = useCallback(
    (data: ChartDataPoint[]) => {
      if (seriesRef.current !== null && chartRef.current !== null) {
        seriesRef.current.setData(data as LineData<Time>[]);
        chartRef.current.timeScale().fitContent();
        requestAnimationFrame(() => updateLegend(undefined));
      }
    },
    [updateLegend],
  );

  const fitContent = useCallback(() => {
    if (chartRef.current !== null) {
      chartRef.current.timeScale().fitContent();
    }
  }, []);

  return { setData, fitContent, updateLegend };
}
