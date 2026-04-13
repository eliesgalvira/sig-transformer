import Link from 'next/link';
import { WaveformGenerator } from '@/components/waveform-generator';
import { SignalChart } from '@/components/signal-chart';
import { InfoCard } from '@/components/info-card';
import { WorkbenchHeaderMenu } from '@/components/workbench-header-menu';

export default function Home() {
  return (
    <div className="min-h-screen bg-workbench relative overflow-hidden">
      {/* Background Signal Design */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" aria-hidden="true">
        <svg preserveAspectRatio="none" viewBox="0 0 1440 1000" className="h-full w-full text-[var(--wb-wave)]">
          {/* Upper criss-crossing exotic signal */}
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            d="M0 160 Q 40 80, 80 160 T 160 160 T 240 160 T 320 160 T 400 160 T 480 160 T 560 160 T 640 160 T 720 160 T 800 160 T 880 160 T 960 160 T 1040 160 T 1120 160 T 1200 160 T 1280 160 T 1360 160 T 1440 160"
            className="opacity-40"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            d="M0 160 Q 60 250, 120 160 T 240 160 T 360 160 T 480 160 T 600 160 T 720 160 T 840 160 T 960 160 T 1080 160 T 1200 160 T 1320 160 T 1440 160"
            className="opacity-30"
          />

          {/* Original mid-section waves */}
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            d="M0 400C120 400 240 200 360 200s240 400 360 400 240-400 360-400 240 200 360 200"
            className="opacity-40"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            d="M0 400C120 400 240 300 360 300s240 200 360 200 240-200 360-200 240 100 360 100"
            className="opacity-30"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            d="M0 600c150 0 200-300 350-300s200 300 350 300 200-300 350-300 200 300 350 300"
            className="opacity-15"
          />

          {/* Bottom low frequency signal */}
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            d="M0 880 C 200 800, 400 960, 720 880 S 1240 960, 1440 880"
            className="opacity-40"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            d="M0 900 C 300 980, 500 820, 720 900 S 1140 820, 1440 900"
            className="opacity-20"
          />
        </svg>
      </div>

      <header className="wb-header relative z-10 w-full border-b px-4 py-5 backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/0 via-purple-400/50 to-purple-500/0"></div>
        <div className="mx-auto flex w-full max-w-[90rem] justify-end">
          <WorkbenchHeaderMenu />
        </div>
        <div className="mx-auto mt-3 flex w-full max-w-[90rem] flex-col items-center px-12 text-center sm:px-20">
          <h1 className="wb-title relative mb-2 text-4xl font-mono font-bold leading-none tracking-tighter uppercase md:text-5xl">
            <span className="absolute -inset-1 rounded-full bg-[var(--wb-accent-soft)] blur-xl"></span>
            <span className="relative">Signal Workbench</span>
          </h1>
          <p className="wb-subtitle text-sm font-mono tracking-widest uppercase md:text-base">
            {'// signal transformer tool by Elies'}
          </p>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[90rem] flex-col items-center justify-start px-4 pb-12 pt-8 text-base leading-relaxed wb-text">
        {/* Main content grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Left column - Challenge card and Form */}
          <div className="md:col-span-4 flex flex-col justify-start">
            <div className="wb-panel relative flex h-full min-h-[620px] flex-col overflow-hidden border p-1 shadow-[0_0_20px_rgba(0,0,0,0.18)] backdrop-blur-md md:min-h-[720px]">
               {/* Techy corner accents */}
               <div className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-[var(--wb-accent)]"></div>
               <div className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-[var(--wb-accent)]"></div>
               <div className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-[var(--wb-accent)]"></div>
               <div className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-[var(--wb-accent)]"></div>
               <WaveformGenerator />
            </div>
          </div>

          {/* Right column - Chart */}
          <div className="md:col-span-8 relative min-h-[500px] md:min-h-0">
            <div className="wb-chart-shell z-10 flex h-full w-full flex-col justify-start border p-1 shadow-[0_0_30px_rgba(0,0,0,0.18),inset_0_0_40px_var(--wb-accent-ghost)] backdrop-blur-md md:absolute md:inset-0">
              <div className="absolute left-4 top-0 z-20 rounded-b-md border-x border-b border-[var(--wb-border)] bg-[var(--wb-accent-soft)] px-2 py-1 font-mono text-xs font-bold tracking-widest wb-accent">
                OSCILLOSCOPE VIEW
              </div>
              <div className="w-full flex-1 relative z-10 flex flex-col overflow-hidden min-h-0">
                 {/* CRT Scanline effect overlaid on chart container */}
                 <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.12)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.02),rgba(0,0,255,0.04))] bg-[length:100%_4px,3px_100%] opacity-25"></div>
                 <SignalChart />
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="w-full mt-12 mb-8 relative">
          <div className="flex items-center gap-4 mb-6">
             <div className="h-px flex-1 bg-[var(--wb-border)]"></div>
             <h2 className="font-mono text-sm font-bold tracking-widest wb-accent">DOCUMENTATION MODULES</h2>
             <div className="h-px flex-1 bg-[var(--wb-border)]"></div>
          </div>
          <ul role="list" className="w-full max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 p-0">
            <InfoCard
              href="https://en.wikipedia.org/wiki/Discrete_Fourier_transform"
              title="DFT Analysis"
              body="Mathematical framework for discrete signals."
            />
            <InfoCard
              href="https://www.youtube.com/watch?v=h7apO7q16V0"
              title="FFT Implementation"
              body="Algorithm visual reference and data processing details."
            />
          </ul>
        </div>

        {/* Footer credits */}
        <footer className="mt-12 mb-4 flex w-full items-center justify-center border-t px-4 pt-8 text-center font-mono text-xs wb-text-muted [border-color:var(--wb-border)]">
          <span>
            Charts made with{' '}
            <Link href="https://www.tradingview.com/lightweight-charts/" target="_blank" rel="noopener noreferrer" className="transition-colors wb-accent hover:text-[var(--wb-accent-strong)]">
              lightweight-charts
            </Link>
          </span>
        </footer>
      </main>
    </div>
  );
}
