import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { authors } from 'collections/server';
import { ContentAuthors } from '@/components/content-authors';
import { InfoPage } from '@/components/info-page';
import { JsonLd } from '@/components/json-ld';
import type { ContentFrontmatter } from '@/lib/content-schema';
import { siteConfig } from '@/lib/config';
import { source } from '@/lib/source';

const people = authors.filter((author) => author.kind === 'person');

export function generateStaticParams() {
  return people.map((author) => ({ slug: author.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = people.find((author) => author.slug === slug);
  if (!profile) return {};
  return {
    title: `${profile.name} — Author`,
    description: profile.bio,
    alternates: { canonical: `/authors/${profile.slug}` },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = people.find((author) => author.slug === slug);
  if (!profile) notFound();
  const name = profile.name;
  const profileUrl = new URL(
    `/authors/${profile.slug}`,
    siteConfig.siteUrl,
  ).toString();
  const published = (contentType: ContentFrontmatter['contentType']) =>
    source
      .getPages()
      .filter((page) => {
        const data = page.data as ContentFrontmatter;
        return (
          data.status === 'published' &&
          data.contentType === contentType &&
          data.authors.includes(name)
        );
      })
      .map((page) => ({
        title: page.data.title,
        slug: page.slugs.at(-1),
      }));
  const guides = published('guide');
  const articles = published('article');

  return (
    <>
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
      <InfoPage title={name} description={profile.bio}>
        <ContentAuthors names={[name]} label="Author profile" />
        {guides.length > 0 && (
          <>
            <h2>Published guides</h2>
            <ul>
              {guides.map((guide) => (
                <li key={guide.slug}>
                  <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
                </li>
              ))}
            </ul>
          </>
        )}
        {articles.length > 0 && (
          <>
            <h2>Published articles</h2>
            <ul>
              {articles.map((article) => (
                <li key={article.slug}>
                  <Link href={`/blog/${article.slug}`}>{article.title}</Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </InfoPage>
    </>
  );
}
