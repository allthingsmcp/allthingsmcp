import Image from 'next/image';
import Link from 'next/link';
import { brandAssets } from '@/lib/brand';

export function Logo({ inverse = false }: { inverse?: boolean }) {
  const src = inverse ? brandAssets.logoInverse : brandAssets.logo;

  return (
    <Link href="/" className="logo-link" aria-label="All Things MCP home">
      <Image
        src={src}
        alt="All Things MCP"
        width={950}
        height={176}
        priority
        className="logo-image"
      />
    </Link>
  );
}
