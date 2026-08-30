'use client';

import Link from 'next/link';
import { Menu, Search, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Logo } from '@/components/logo';
import { primaryNav } from '@/lib/site-data';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const toggleMenu = () => setOpen((value) => !value);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="shell header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(isActive(item.href) && 'is-active')}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link
            className="search-trigger"
            href="/search"
            aria-label="Search All Things MCP"
          >
            <Search aria-hidden="true" className="size-4" />
            <span>Search</span>
            <kbd>⌘K</kbd>
          </Link>
          <Link
            className="button button--primary newsletter-button"
            href="/#newsletter"
          >
            Newsletter
          </Link>
          <button
            className="menu-button"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            onClick={toggleMenu}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleMenu();
              }
            }}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          <div className="shell mobile-nav__inner">
            {[
              ...primaryNav,
              { label: 'Newsletter', href: '/#newsletter' },
              { label: 'Search', href: '/search' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(isActive(item.href) && 'is-active')}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
