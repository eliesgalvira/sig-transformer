import {
  ColorType,
  type AreaSeriesOptions,
  type ChartOptions,
  type DeepPartial,
} from "lightweight-charts";
import type { OutputType, SignalParams } from "@/lib/types/signal";

export interface SignalChartPalette {
  readonly text: string;
  readonly background: string;
  readonly line: string;
  readonly fill: string;
  readonly fillStrong: string;
}

export function getSignalChartLegend(
  signal: SignalParams,
  outputType: OutputType,
) {
  const { b, signalShape, amplitude, phase } = signal;
  const input: Record<SignalParams["signalShape"], string> = {
    square: String.raw`\( \textbf{x}[n] = A \cdot \Pi \left(\frac{nT-X}{P}\right) \)`,
    triangle: String.raw`\( \textbf{x}[n] = A \cdot \Lambda \left(\frac{nT-X}{2P}\right) \)`,
    sinc: String.raw`\( \textbf{x}[n] = A \cdot \text{sinc}(f_0nT - \varphi ) = A \cdot \frac{\sin(f_0 \pi nT - \varphi )}{f_0 \pi nT - \varphi } \)`,
    sin: String.raw`\( \textbf{x}[n] = A \cdot \sin(2\pi f_0nT + \varphi ) \)`,
    cos: String.raw`\( \textbf{x}[n] = A \cdot \cos(2\pi f_0nT + \varphi ) \)`,
    exp: String.raw`\( \textbf{x}[n] = ${amplitude}\cdot e^{nT} \)`,
    sign: String.raw`\( \textbf{x}[n] = \frac{nT}{|nT|} \forall n \neq 0 \)`,
  };
  const output: Record<
    OutputType,
    Record<SignalParams["signalShape"], string>
  > = {
    modulus: {
      square: String.raw`\( |\mathcal{F}| = |A| \cdot P|\text{sinc}(Pf)| \)`,
      triangle: String.raw`\( |\mathcal{F}| = |A| \cdot P\text{sinc}^2(Pf) \)`,
      sinc: String.raw`\( |\mathcal{F}| = |A| \cdot \Pi \left(\frac{f}{f_0}\right) \)`,
      cos: String.raw`\( |\mathcal{F}| = \frac{|A|}{2}[\delta (f + f_0) + \delta (f - f_0)] \)`,
      sin: String.raw`\( |\mathcal{F}| = \frac{|A|}{2}[\delta (f + f_0) + \delta (f - f_0)] \)`,
      exp: String.raw`\( |\mathcal{F}| = e^{${b}}\cdot \frac{1}{2\pi |f|+1} \)`,
      sign: String.raw`\( |\mathcal{F}| = \left| \frac{2}{f} \right| \)`,
    },
    real: {
      square:
        phase === 0
          ? String.raw`\( \Re(\mathcal{F}) = A \cdot P\text{sinc}(Pf) \)`
          : String.raw`\( \Re(\mathcal{F}) = A \cdot P\text{sinc}(Pf)\cos(2\pi f X) \)`,
      triangle:
        phase === 0
          ? String.raw`\( \Re(\mathcal{F}) = A \cdot P\text{sinc}^2(Pf) \)`
          : String.raw`\( \Re(\mathcal{F}) = A \cdot P\text{sinc}^2(Pf)\cos(2\pi f X) \)`,
      sinc:
        phase === 0
          ? String.raw`\( \Re(\mathcal{F}) = A \cdot \Pi\left(\frac{f}{f_0}\right) \)`
          : String.raw`\( \Re(\mathcal{F}) = A \cdot \Pi\left(\frac{f}{f_0}\right)\cos(2\pi f \varphi) \)`,
      cos:
        phase === 0
          ? String.raw`\( \Re(\mathcal{F}) = \frac{A}{2}[\delta (f + f_0) + \delta (f - f_0)] \)`
          : String.raw`\( \Re(\mathcal{F}) = \frac{A}{2}[\delta (f + f_0) + \delta (f - f_0)]\cos(\varphi) \)`,
      sin:
        phase === 0
          ? String.raw`\( \Re(\mathcal{F}) = 0 \)`
          : String.raw`\( \Im(\mathcal{F}) = - \frac{A}{2}[\delta (f - f_0) - \delta (f + f_0)]\cos(\varphi) \)`,
      exp: String.raw`\( \Re(\mathcal{F}) \)`,
      sign: String.raw`\( \Re(\mathcal{F}) = 0 \)`,
    },
    imaginary: {
      square:
        phase === 0
          ? String.raw`\( \Im(\mathcal{F}) = 0 \)`
          : String.raw`\( \Im(\mathcal{F}) = -A \cdot P\text{sinc}(Pf)\sin(2\pi f X) \)`,
      triangle:
        phase === 0
          ? String.raw`\( \Im(\mathcal{F}) = 0 \)`
          : String.raw`\( \Im(\mathcal{F}) = -A \cdot P\text{sinc}^2(Pf)\sin(2\pi f X) \)`,
      sinc:
        phase === 0
          ? String.raw`\( \Im(\mathcal{F}) = 0 \)`
          : String.raw`\( \Im(\mathcal{F}) = -A \cdot \Pi\left(\frac{f}{f_0}\right)\sin(2\pi f \varphi) \)`,
      cos:
        phase === 0
          ? String.raw`\( \Im(\mathcal{F}) = 0 \)`
          : String.raw`\( \Re(\mathcal{F}) = \frac{A}{2}[\delta (f + f_0) + \delta (f - f_0)]\sin(\varphi) \)`,
      sin:
        phase === 0
          ? String.raw`\( \Im(\mathcal{F}) = - \frac{A}{2}[\delta (f - f_0) - \delta (f + f_0)] \)`
          : String.raw`\( \Im(\mathcal{F}) = - \frac{A}{2}[\delta (f - f_0) - \delta (f + f_0)]\sin(\varphi) \)`,
      exp: String.raw`\( \Im(\mathcal{F}) \)`,
      sign: String.raw`\( \Im(\mathcal{F}) = -\frac{2}{f} \)`,
    },
  };

  return {
    inputSymbolName: input[signalShape],
    outputSymbolName: output[outputType][signalShape],
  };
}

function formatTick(value: number | string): string {
  const number = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(number)) {
    return String(value);
  }
  return (Math.round(number * 100) / 100).toFixed(2);
}

export function createSignalChartOptions(options: {
  readonly palette: SignalChartPalette;
  readonly isSmallScreen: boolean;
}): DeepPartial<ChartOptions> {
  const { palette, isSmallScreen } = options;

  return {
    autoSize: true,
    layout: {
      textColor: palette.text,
      background: { type: ColorType.Solid, color: palette.background },
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
}

export function createSignalSeriesOptions(
  palette: SignalChartPalette,
  series: "input" | "output",
): DeepPartial<AreaSeriesOptions> {
  return {
    topColor: palette.line,
    bottomColor: series === "input" ? palette.fill : palette.fillStrong,
    lineColor: palette.line,
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: false,
    priceFormat: { type: "price", precision: 3, minMove: 0.001 },
  };
}
