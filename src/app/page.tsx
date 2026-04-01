import Link from 'next/link';
import { WaveformGenerator } from '@/components/waveform-generator';
import { SignalChart } from '@/components/signal-chart';
import { InfoCard } from '@/components/info-card';

function GithubIcon() {
  return (
    <svg 
      viewBox="-25.6 -25.6 307.20 307.20" 
      xmlns="http://www.w3.org/2000/svg" 
      preserveAspectRatio="xMinYMin meet" 
      fill="#000000" 
      className="w-full h-full"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0" transform="translate(23.040000000000006,23.040000000000006), scale(0.82)">
        <rect x="-25.6" y="-25.6" width="307.20" height="307.20" rx="153.6" fill="#ffffff" strokeWidth="0" />
      </g>
      <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
      <g id="SVGRepo_iconCarrier">
        <g fill="#161614">
          <path d="M127.505 0C57.095 0 0 57.085 0 127.505c0 56.336 36.534 104.13 87.196 120.99 6.372 1.18 8.712-2.766 8.712-6.134 0-3.04-.119-13.085-.173-23.739-35.473 7.713-42.958-15.044-42.958-15.044-5.8-14.738-14.157-18.656-14.157-18.656-11.568-7.914.872-7.752.872-7.752 12.804.9 19.546 13.14 19.546 13.14 11.372 19.493 29.828 13.857 37.104 10.6 1.144-8.242 4.449-13.866 8.095-17.05-28.32-3.225-58.092-14.158-58.092-63.014 0-13.92 4.981-25.295 13.138-34.224-1.324-3.212-5.688-16.18 1.235-33.743 0 0 10.707-3.427 35.073 13.07 10.17-2.826 21.078-4.242 31.914-4.29 10.836.048 21.752 1.464 31.942 4.29 24.337-16.497 35.029-13.07 35.029-13.07 6.94 17.563 2.574 30.531 1.25 33.743 8.175 8.929 13.122 20.303 13.122 34.224 0 48.972-29.828 59.756-58.22 62.912 4.573 3.957 8.648 11.717 8.648 23.612 0 17.06-.148 30.791-.148 34.991 0 3.393 2.295 7.369 8.759 6.117 50.634-16.879 87.122-64.656 87.122-120.973C255.009 57.085 197.922 0 127.505 0" />
          <path d="M47.755 181.634c-.28.633-1.278.823-2.185.389-.925-.416-1.445-1.28-1.145-1.916.275-.652 1.273-.834 2.196-.396.927.415 1.455 1.287 1.134 1.923M54.027 187.23c-.608.564-1.797.302-2.604-.589-.834-.889-.99-2.077-.373-2.65.627-.563 1.78-.3 2.616.59.834.899.996 2.08.36 2.65M58.33 194.39c-.782.543-2.06.034-2.849-1.1-.781-1.133-.781-2.493.017-3.038.792-.545 2.05-.055 2.85 1.07.78 1.153.78 2.513-.019 3.069M65.606 202.683c-.699.77-2.187.564-3.277-.488-1.114-1.028-1.425-2.487-.724-3.258.707-.772 2.204-.555 3.302.488 1.107 1.026 1.445 2.496.7 3.258M75.01 205.483c-.307.998-1.741 1.452-3.185 1.028-1.442-.437-2.386-1.607-2.095-2.616.3-1.005 1.74-1.478 3.195-1.024 1.44.435 2.386 1.596 2.086 2.612M85.714 206.67c.036 1.052-1.189 1.924-2.705 1.943-1.525.033-2.758-.818-2.774-1.852 0-1.062 1.197-1.926 2.721-1.951 1.516-.03 2.758.815 2.758 1.86M96.228 206.267c.182 1.026-.872 2.08-2.377 2.36-1.48.27-2.85-.363-3.039-1.38-.184-1.052.89-2.105 2.367-2.378 1.508-.262 2.857.355 3.049 1.398" />
        </g>
      </g>
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-workbench relative overflow-hidden">
      {/* Background Signal Design */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" aria-hidden="true">
        <svg preserveAspectRatio="none" viewBox="0 0 1440 1000" className="w-full h-full text-purple-500">
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

      <header className="w-full flex flex-col items-center justify-center px-4 relative z-10 py-6 border-b border-purple-500/20 bg-neutral-900/60 backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.05)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/0 via-purple-400/50 to-purple-500/0"></div>
        <h1 className="mt-4 text-neutral-100 md:text-5xl text-4xl font-mono font-bold leading-none text-center mb-2 tracking-tighter uppercase relative">
          <span className="absolute -inset-1 blur-xl bg-purple-500/20 rounded-full"></span>
          <span className="relative">Signal Workbench</span>
        </h1>
        <p className="text-purple-400/80 md:text-base text-sm font-mono tracking-widest mb-2 uppercase text-sm">
          // frequency domain analysis tool
        </p>
        <Link
          href="https://www.github.com/eliesgalvira/sig-transformer"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 bg-neutral-800 border border-purple-500/30 rounded shadow-[0_0_10px_rgba(168,85,247,0.1)] transition-all duration-200 hover:scale-105 hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center p-2 text-purple-400"
        >
          <GithubIcon />
        </Link>
      </header>

      <main className="flex flex-col w-full items-center justify-start mx-auto px-4 pb-12 pt-8 max-w-[90rem] text-base leading-relaxed relative z-10">
        {/* Main content grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Left column - Challenge card and Form */}
          <div className="md:col-span-4 flex flex-col justify-start">
            <div className="bg-neutral-900/80 border border-purple-500/30 p-1 shadow-[0_0_20px_rgba(0,0,0,0.4)] backdrop-blur-md relative overflow-hidden flex flex-col h-full min-h-[620px] md:min-h-[720px]">
               {/* Techy corner accents */}
               <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-purple-400"></div>
               <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-purple-400"></div>
               <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-purple-400"></div>
               <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-purple-400"></div>
               <WaveformGenerator />
            </div>
          </div>

          {/* Right column - Chart */}
          <div className="md:col-span-8 relative min-h-[500px] md:min-h-0">
            <div className="w-full h-full md:absolute md:inset-0 flex flex-col justify-start bg-[#171717] border border-purple-500/30 p-1 shadow-[0_0_30px_rgba(0,0,0,0.6),inset_0_0_40px_rgba(168,85,247,0.03)] backdrop-blur-md z-10">
              <div className="absolute top-0 left-4 px-2 py-1 bg-purple-500/20 border-x border-b border-purple-500/40 text-purple-400 text-xs font-mono font-bold tracking-widest z-20 rounded-b-md">
                OSCILLOSCOPE VIEW
              </div>
              <div className="w-full flex-1 relative z-10 flex flex-col overflow-hidden min-h-0">
                 {/* CRT Scanline effect overlaid on chart container */}
                 <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20 opacity-30"></div>
                 <SignalChart />
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="w-full mt-12 mb-8 relative">
          <div className="flex items-center gap-4 mb-6">
             <div className="h-px bg-purple-500/30 flex-1"></div>
             <h2 className="text-purple-400/80 font-mono text-sm tracking-widest font-bold">DOCUMENTATION MODULES</h2>
             <div className="h-px bg-purple-500/30 flex-1"></div>
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
        <footer className="w-full text-center text-xs text-neutral-600 mt-12 mb-4 px-4 font-mono border-t border-purple-500/20 pt-8 flex items-center justify-center">
          <span>
            Charts made with{' '}
            <Link href="https://www.tradingview.com/lightweight-charts/" target="_blank" rel="noopener noreferrer" className="text-purple-500/70 hover:text-purple-400 transition-colors">
              lightweight-charts
            </Link>
          </span>
        </footer>
      </main>
    </div>
  );
}
