import type { Metadata } from 'next';
import Link from 'next/link';
import { authors } from 'collections/server';
import { ContentAuthors } from '@/components/content-authors';
import { InfoPage } from '@/components/info-page';
import { JsonLd } from '@/components/json-ld';
import type { ContentFrontmatter } from '@/lib/content-schema';
import { siteConfig } from '@/lib/config';
import { source } from '@/lib/source';

const name = 'Gbadebo Bello';
const profile = authors.find((author) => author.name === name);
const profileUrl = new URL(
  '/authors/gbadebo-bello',
  siteConfig.siteUrl,
).toString();

export const metadata: Metadata = {
  title: `${name} — Author`,
  description: profile?.bio,
  alternates: { canonical: '/authors/gbadebo-bello' },
};

export default function AuthorPage() {
  const guides = source
    .getPages()
    .filter((page) => {
      const data = page.data as ContentFrontmatter;
      return (
        data.status === 'published' &&
        data.contentType === 'guide' &&
        data.authors.includes(name)
      );
    })
    .map((page) => ({
      title: page.data.title,
      slug: page.slugs.at(-1),
    }));

  return (
    <>
      {profile && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'ProfilePage',
            '@id': `${profileUrl}#profile`,
            url: profileUrl,
            mainEntity: {
              '@type': 'Person',
              '@id': `${profileUrl}#person`,
              name,
              description: profile.bio,
              url: profileUrl,
              image: new URL(profile.image, siteConfig.siteUrl).toString(),
              sameAs: [
                profile.github,
                profile.linkedin,
                profile.x,
                profile.website,
              ].filter(Boolean),
            },
          }}
        />
      )}
      <InfoPage
        title={name}
        description={profile?.bio ?? 'All Things MCP author.'}
      >
        <ContentAuthors names={[name]} label="Author profile" />
        <h2>Published guides</h2>
        <ul>
          {guides.map((guide) => (
            <li key={guide.slug}>
              <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
            </li>
          ))}
        </ul>
      </InfoPage>
    </>
  );
}
