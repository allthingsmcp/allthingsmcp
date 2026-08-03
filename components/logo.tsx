import Image from 'next/image';
import Link from 'next/link';

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className="logo-link" aria-label="All Things MCP home">
      <Image
        src="/brand/all-things-mcp-logo.svg"
        alt="All Things MCP"
        width={198}
        height={47}
        priority
        className={inverse ? 'logo-image logo-image--inverse' : 'logo-image'}
      />
    </Link>
  );
}
