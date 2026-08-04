import Image from 'next/image';
import Link from 'next/link';

export function Logo({ inverse = false }: { inverse?: boolean }) {
  const src = inverse
    ? '/brand/all-things-mcp-logo-dark.svg'
    : '/brand/all-things-mcp-logo.svg';

  return (
    <Link href="/" className="logo-link" aria-label="All Things MCP home">
      <Image
        src={src}
        alt="All Things MCP"
        width={198}
        height={47}
        priority
        className="logo-image"
      />
    </Link>
  );
}
