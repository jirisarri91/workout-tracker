'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { format } from 'date-fns';

const today = format(new Date(), 'yyyy-MM-dd');

const navItems = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: `/workout/${today}`,
    label: 'Today',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" />
        <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" />
        <line x1="10" y1="9" x2="8" y2="9" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/planner',
    label: 'Planner',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
        <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
        <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/exercises',
    label: 'Exercises',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="6" y1="1" x2="6" y2="4" strokeLinecap="round" />
        <line x1="10" y1="1" x2="10" y2="4" strokeLinecap="round" />
        <line x1="14" y1="1" x2="14" y2="4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/ai',
    label: 'AI Coach',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="M12 2a5 5 0 1 1-4.546 7.128L3 12l4.454 2.872A5 5 0 1 1 12 22a5 5 0 0 1-4.546-2.872L3 22l4.454-7.128A5 5 0 0 1 12 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/workout/')) return pathname.startsWith('/workout/');
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 pb-safe">
      <div className="flex items-stretch max-w-lg mx-auto">
        {navItems.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-xs font-medium transition-colors ${
                active ? 'text-orange-500' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
