'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Books, ChatCircleText, FileText, Users } from '@phosphor-icons/react';
import { LanguageSwitch } from '@/components/language-switch';
import { LogoutButton } from '@/components/logout-button';

const ICONS = { library: Books, accounts: Users, templates: FileText, questions: ChatCircleText };
export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

// Floating pill header shared by the customer and admin areas.
export function AppHeader({ home, brand, items, logout }: { home: string; brand: string; items: NavItem[]; logout: string }) {
  const path = usePathname();
  return (
    <header className="sticky top-3 z-20 px-3 sm:top-5 sm:px-6">
      <nav className="mx-auto flex min-w-0 max-w-6xl items-center gap-1 rounded-full bg-surface/80 p-1.5 shadow-[var(--highlight),var(--shadow)] ring-1 ring-line backdrop-blur-xl">
        <Link href={home} className="group flex shrink-0 items-center gap-2.5 rounded-full py-1 pl-1 pr-1 lg:pr-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-accent text-accent-ink transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-rotate-6">
            <FileText size={17} weight="regular" />
          </span>
          <span className="hidden whitespace-nowrap text-[0.9375rem] font-semibold tracking-tight lg:inline">{brand}</span>
        </Link>
        <div className="flex items-center gap-0.5">
          {items.map(({ href, label, icon }) => {
            const Icon = ICONS[icon];
            const active = path === href || path.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} aria-current={active ? 'page' : undefined} className="nav-link">
                <Icon size={16} weight="light" aria-hidden />
                <span className="hidden md:inline">{label}</span>
                <span className="sr-only md:hidden">{label}</span>
              </Link>
            );
          })}
        </div>
        <div className="ml-auto flex min-w-0 items-center gap-1">
          <LanguageSwitch />
          <LogoutButton label={logout} />
        </div>
      </nav>
    </header>
  );
}
