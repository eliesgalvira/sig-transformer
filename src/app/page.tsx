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
    <div className="min-h-screen bg-[#171717]">
      <header className="w-full flex flex-col items-center justify-center px-4 relative">
        <h1 className="mt-12 text-neutral-100 md:text-6xl text-5xl font-bold leading-none text-center mb-4 tracking-tight">
          Signal{' '}
          <span className="bg-gradient-to-r from-purple-300 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Transformer
          </span>{' '}
          Tool
        </h1>
        <p className="text-neutral-500 md:text-lg text-base font-normal tracking-wide mb-10">
          by Elies
        </p>
        <Link
          href="https://www.github.com/eliesgalvira/sig-transformer"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 transition-all duration-200 hover:scale-105 opacity-80 hover:opacity-100"
        >
          <GithubIcon />
        </Link>
      </header>

      <main className="flex flex-col w-full items-center justify-start mx-auto px-4 pb-4 max-w-7xl text-base leading-relaxed">
        <div className="mb-10 px-5 py-4 rounded-lg bg-neutral-800/40 border border-neutral-700/40 backdrop-blur-sm w-full max-w-3xl">
          <p className="text-neutral-300 text-sm sm:text-base m-0">
            Generate your signal and observe its{' '}
            <code className="text-xs sm:text-sm font-mono font-medium bg-purple-500/15 text-purple-300 rounded px-1.5 py-0.5">
              DFT
            </code>{' '}
            (Discrete Fourier Transform)
          </p>
          <p className="text-neutral-400 text-sm mt-2 m-0">
            <span className="text-purple-400 font-medium">Challenge:</span> Guess the shape of the transform beforehand.
          </p>
        </div>

        {/* Main content grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-5 md:gap-x-8 lg:gap-x-12 gap-y-8 items-start">
          {/* Left column - Form */}
          <div className="md:col-span-2 flex flex-col justify-start px-4 md:px-0">
            <WaveformGenerator />
          </div>

          {/* Right column - Chart */}
          <div className="md:col-span-3 flex flex-col justify-start min-w-0 rounded-lg min-h-[760px] relative bg-[#171717]">
            <SignalChart />
          </div>
        </div>

        {/* Info Cards */}
        <ul role="list" className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4 p-0 mt-12 mb-8">
          <InfoCard
            href="https://en.wikipedia.org/wiki/Discrete_Fourier_transform"
            title="DFT"
            body="Learn more about the DFT and its properties."
          />
          <InfoCard
            href="https://www.youtube.com/watch?v=h7apO7q16V0"
            title="FFT Algorithm"
            body="This video visually explains the algorithm that is used to transform the input signals."
          />
        </ul>

        {/* Footer credits */}
        <footer className="text-center text-xs text-neutral-500 mt-4 mb-8 px-4">
          Charts made with{' '}
          <Link
            href="https://www.tradingview.com/lightweight-charts/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400/80 hover:text-purple-300 transition-colors"
          >
            lightweight-charts
          </Link>{' '}
          · FFT algorithm from{' '}
          <Link
            href="https://www.fftw.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400/80 hover:text-purple-300 transition-colors"
          >
            fftw3
          </Link>
        </footer>
      </main>
    </div>
  );
}
