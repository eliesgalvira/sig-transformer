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
        className="relative flex flex-col w-full h-full py-5 px-5 rounded-lg bg-neutral-800/60 border border-neutral-700/50 backdrop-blur-sm transition-all duration-300 ease-out hover:bg-neutral-800/80 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] focus-visible:outline-none focus-visible:border-purple-500/60 focus-visible:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
      >
        <h2 className="m-0 text-lg font-medium text-neutral-200 transition-colors duration-300 group-hover:text-purple-200">
          {title}
          <span className="inline-block ml-1.5 transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
        </h2>
        <p className="mt-2 mb-0 text-sm text-neutral-400 leading-relaxed">
          {body}
        </p>
      </Link>
    </li>
  );
}

