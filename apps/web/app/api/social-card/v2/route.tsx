import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import type { ContentFrontmatter } from '@/lib/content-schema';
import { source } from '@/lib/source';
import type { SocialCardKind } from '@/lib/social-card';

export const runtime = 'nodejs';

const labels: Record<SocialCardKind, string> = {
  article: 'ATM field note',
  guide: 'Practical guide',
  'guide-step': 'Guide step',
};

function resolveCard(kind: SocialCardKind, slug: string) {
  const page = source.getPages().find((candidate) => {
    const data = candidate.data as ContentFrontmatter;
    if (kind === 'article') {
      return data.contentType === 'article' && candidate.slugs.at(-1) === slug;
    }
    if (kind === 'guide') {
      return data.contentType === 'guide' && candidate.slugs.at(-1) === slug;
    }
    const [guideSlug, stepId] = slug.split('/');
    return (
      data.contentType === 'guide-step' &&
      data.guideSlug === guideSlug &&
      data.guideStepId === stepId
    );
  });

  if (!page) return null;
  return {
    label: labels[kind],
    title: page.data.title,
  };
}

function topology() {
  const nodes = [
    [0, 0],
    [116, 0],
    [232, 0],
    [116, 116],
    [232, 232],
    [348, 232],
  ];

  return (
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        right: -28,
        bottom: -42,
        width: 440,
        height: 360,
        opacity: 0.72,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 46,
          top: 54,
          width: 348,
          height: 232,
          borderLeft: '2px solid #2563EB',
          borderTop: '2px solid #2563EB',
          transform: 'skewY(-45deg)',
          opacity: 0.42,
        }}
      />
      {nodes.map(([x, y], index) => (
        <div
          key={`${x}-${y}`}
          style={{
            display: 'flex',
            position: 'absolute',
            left: 36 + x,
            top: 44 + y,
            width: index === 3 ? 30 : 16,
            height: index === 3 ? 30 : 16,
            borderRadius: 999,
            border: index === 3 ? '5px solid #60A5FA' : 'none',
            background: index === 3 ? '#0F172A' : '#60A5FA',
            boxShadow: '0 0 0 10px rgba(96,165,250,0.08)',
          }}
        />
      ))}
    </div>
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get('kind') as SocialCardKind | null;
  const slug = url.searchParams.get('slug');
  if (!kind || !slug || !(kind in labels)) {
    return new Response('Not found', { status: 404 });
  }

  const card = resolveCard(kind, slug);
  if (!card) return new Response('Not found', { status: 404 });

  const logo = await readFile(
    path.join(
      process.cwd(),
      'public/brand/open-junction/svg/horizontal-dark.svg',
    ),
  );
  const logoUrl = `data:image/svg+xml;base64,${logo.toString('base64')}`;
  const titleSize =
    card.title.length > 64 ? 54 : card.title.length > 42 ? 62 : 70;

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#0F172A',
        color: '#FFFFFF',
        fontFamily: 'Geist, Arial, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: 18,
          right: 18,
          bottom: 18,
          left: 18,
          border: '2px solid rgba(96,165,250,0.32)',
          borderRadius: 24,
        }}
      />
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: 72,
          top: 62,
          width: 338,
          height: 63,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="" width={338} height={63} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'absolute',
          left: 72,
          top: 182,
          width: 930,
        }}
      >
        <div
          style={{
            display: 'flex',
            color: '#60A5FA',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 3.2,
            textTransform: 'uppercase',
          }}
        >
          {card.label}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 22,
            maxWidth: 960,
            fontSize: titleSize,
            fontWeight: 700,
            letterSpacing: -1.5,
            lineHeight: 1.04,
          }}
        >
          {card.title}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: 72,
          bottom: 58,
          alignItems: 'center',
          color: '#94A3B8',
          fontSize: 22,
          letterSpacing: 0.4,
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 10,
            height: 10,
            marginRight: 12,
            border: '2px solid #60A5FA',
            transform: 'rotate(45deg)',
          }}
        />
        allthingsmcp.com
      </div>
      {topology()}
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  );
}
