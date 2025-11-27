import Link from 'next/link';

interface InfoCardProps {
  href: string;
  title: string;
  body: string;
}

export function InfoCard({ href, title, body }: InfoCardProps) {
  return (
    <li className="list-none flex p-[1px] bg-neutral-800 bg-none bg-[length:400%] rounded-lg bg-[position:100%] transition-[background-position] duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] hover:bg-[position:0%] hover:bg-gradient-to-r from-purple-300 to-purple-600 focus-within:bg-[position:0%] focus-within:bg-gradient-to-r focus-within:from-purple-400 focus-within:to-purple-600">
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full no-underline leading-tight py-6 px-6 rounded-lg text-white bg-neutral-800 opacity-80 hover:opacity-100 active:opacity-60 transition-opacity"
      >
        <h2 className="m-0 text-xl transition-colors duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-purple-200 group-focus-within:text-purple-200">
          {title}
          <span className="ml-1">&rarr;</span>
        </h2>
        <p className="mt-2 mb-0 text-neutral-300">
          {body}
        </p>
      </Link>
    </li>
  );
}

