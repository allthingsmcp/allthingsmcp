import { authors as authorProfiles } from 'collections/server';
import {
  ArticleAuthors,
  type ArticleAuthor,
} from '@/components/article-authors';

function localProfileUrl(url: string | undefined) {
  if (!url) return undefined;
  const parsed = new URL(url);
  return parsed.hostname === 'www.allthingsmcp.com'
    ? `${parsed.pathname}${parsed.search}${parsed.hash}`
    : url;
}

export function ContentAuthors({
  names,
  label,
}: {
  names: string[];
  label: string;
}) {
  const authors: ArticleAuthor[] = names.map((name) => {
    const profile = authorProfiles.find((author) => author.name === name);
    return profile
      ? {
          name,
          role: profile.role,
          bio: profile.bio,
          image: profile.image,
          github: profile.github,
          linkedin: profile.linkedin,
          x: profile.x,
          website: profile.website,
          url: localProfileUrl(profile.url),
        }
      : { name };
  });

  return <ArticleAuthors authors={authors} label={label} />;
}
