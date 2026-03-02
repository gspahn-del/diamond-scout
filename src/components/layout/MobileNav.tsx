'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const mobileLinks = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/opponents', label: 'Teams', icon: '⚾' },
  { href: '/games', label: 'Games', icon: '📋' },
  { href: '/stats', label: 'Stats', icon: '📊' },
  { href: '/spray-charts', label: 'Charts', icon: '🎯' },
  { href: '/data', label: 'Data', icon: '💾' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1e293b] border-t border-[#334155] z-50">
      <div className="flex items-center justify-around py-1">
        {mobileLinks.map((link) => {
          const isActive = link.href === '/'
            ? pathname === '/'
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-w-[56px] transition-colors',
                isActive ? 'text-blue-400' : 'text-[#64748b]'
              )}
            >
              <span className="text-xl">{link.icon}</span>
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
