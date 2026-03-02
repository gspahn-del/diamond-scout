'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/opponents', label: 'Opponents' },
  { href: '/games', label: 'Games' },
  { href: '/stats', label: 'Analytics' },
  { href: '/spray-charts', label: 'Spray Charts' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="hidden md:flex items-center justify-between px-6 py-3 bg-[#1e293b] border-b border-[#334155] sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-2xl">⚾</span>
        <span className="text-xl font-bold text-white tracking-tight">
          Diamond<span className="text-blue-400">Scout</span>
        </span>
      </Link>

      <nav className="flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                ? 'bg-blue-600 text-white'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#334155]'
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Link
          href="/data"
          className="text-xs text-[#94a3b8] hover:text-white px-3 py-1.5 rounded-md hover:bg-[#334155] transition-colors"
        >
          Data
        </Link>
        <Link
          href="/seasons"
          className="text-xs text-[#94a3b8] hover:text-white px-3 py-1.5 rounded-md hover:bg-[#334155] transition-colors"
        >
          Seasons
        </Link>
        <Link
          href="/games/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New Game
        </Link>
      </div>
    </header>
  );
}
