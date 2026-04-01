import Link from 'next/link';

interface InfoCardProps {
  href: string;
  title: string;
  body: string;
}

export function InfoCard({ href, title, body }: InfoCardProps) {
  return (
    <li className="group list-none h-full">
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex flex-col w-full h-full py-5 px-5 bg-neutral-900/60 border border-purple-500/20 backdrop-blur-sm transition-all duration-300 ease-out hover:bg-neutral-800/80 hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] focus-visible:outline-none focus-visible:border-purple-400/60 overflow-hidden"
      >
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-purple-500/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <h2 className="m-0 text-sm font-mono font-bold tracking-widest uppercase text-purple-500 transition-colors duration-300 group-hover:text-purple-300">
          [{title}]
          <span className="inline-block ml-2 text-purple-500/50 transition-transform duration-300 group-hover:translate-x-2 group-hover:text-purple-400">&gt;&gt;</span>
        </h2>
        <p className="mt-3 mb-0 text-xs font-mono text-neutral-400 leading-relaxed border-l-2 border-purple-500/30 pl-3 group-hover:border-purple-400 transition-colors">
          {body}
        </p>
      </Link>
    </li>
  );
}

