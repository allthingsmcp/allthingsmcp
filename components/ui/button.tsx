import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Button({
  href,
  children,
  variant = 'primary',
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'text';
  className?: string;
}) {
  return (
    <Link className={cn('button', `button--${variant}`, className)} href={href}>
      {children}
    </Link>
  );
}
