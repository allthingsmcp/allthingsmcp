import { cn } from '@/lib/utils';

export function StatusBadge({
  children,
  tone = 'blue',
}: {
  children: React.ReactNode;
  tone?: 'blue' | 'green' | 'violet' | 'orange' | 'neutral';
}) {
  return (
    <span className={cn('status-badge', `status-badge--${tone}`)}>
      {children}
    </span>
  );
}
