import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Blocks,
  BookOpen,
  Box,
  Bug,
  Check,
  Cloud,
  Code2,
  Database,
  KeyRound,
  Landmark,
  LockKeyhole,
  MessageCircle,
  Monitor,
  Network,
  Package,
  Plug,
  RefreshCw,
  Rocket,
  Route,
  Scale,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  alert: AlertTriangle,
  arrow: ArrowRight,
  blocks: Blocks,
  book: BookOpen,
  box: Box,
  bug: Bug,
  chart: BarChart3,
  check: Check,
  cloud: Cloud,
  code: Code2,
  cycle: RefreshCw,
  database: Database,
  key: KeyRound,
  landmark: Landmark,
  lock: LockKeyhole,
  message: MessageCircle,
  monitor: Monitor,
  network: Network,
  package: Package,
  plug: Plug,
  rocket: Rocket,
  route: Route,
  scale: Scale,
  server: Server,
  settings: Settings,
  shield: ShieldCheck,
  spark: Sparkles,
  users: Users,
  wrench: Wrench,
};

export function Icon({
  name,
  className = 'size-5',
}: {
  name: string;
  className?: string;
}) {
  const Component = iconMap[name] ?? Blocks;
  return (
    <Component aria-hidden="true" className={className} strokeWidth={1.8} />
  );
}
