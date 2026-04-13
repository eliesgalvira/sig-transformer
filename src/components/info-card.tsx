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
        className="wb-focus-ring wb-panel relative flex h-full w-full flex-col overflow-hidden border px-5 py-5 backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_18px_var(--wb-accent-ghost)]"
      >
        <h2 className="m-0 font-mono text-sm font-bold tracking-widest uppercase wb-accent transition-colors duration-300 group-hover:text-[var(--wb-accent-strong)]">
          [{title}]
          <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-2 wb-text-soft group-hover:text-[var(--wb-accent)]">&gt;&gt;</span>
        </h2>
        <p className="mt-3 mb-0 border-l-2 border-[var(--wb-border)] pl-3 font-mono text-xs leading-relaxed wb-text-muted transition-colors group-hover:border-[var(--wb-accent)]">
          {body}
        </p>
      </Link>
    </li>
  );
}
