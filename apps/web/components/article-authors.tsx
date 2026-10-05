import Image from 'next/image';
import { Globe } from 'lucide-react';
import { useId } from 'react';

const socialLogos = {
  GitHub: [
    { src: '/social/github-black.svg', width: 98, height: 96 },
    { src: '/social/github-white.svg', width: 98, height: 96 },
  ],
  LinkedIn: [
    { src: '/social/linkedin-blue.png', width: 635, height: 540 },
    { src: '/social/linkedin-white.png', width: 840, height: 779 },
  ],
  X: [
    { src: '/social/x-black.svg', width: 1200, height: 1227 },
    { src: '/social/x-white.svg', width: 1200, height: 1227 },
  ],
} as const;

export type ArticleAuthor = {
  name: string;
  role?: string;
  bio?: string;
  image?: string;
  github?: string;
  linkedin?: string;
  x?: string;
  website?: string;
  url?: string;
};

export function ArticleAuthors({
  authors,
  label = 'Article authors',
}: {
  authors: ArticleAuthor[];
  label?: string;
}) {
  const id = useId();
  if (!authors.length) return null;

  return (
    <div className="article-authors" role="group" aria-label={label}>
      {authors.map((author, index) => {
        const bioId = author.bio ? `${id}-author-bio-${index}` : undefined;
        const links = [
          ['GitHub', author.github],
          ['LinkedIn', author.linkedin],
          ['X', author.x],
          ['Website', author.website ?? author.url],
        ] as const;

        return (
          <div className="article-author" key={author.name}>
            {author.image && (
              <Image
                src={author.image}
                alt=""
                width={56}
                height={56}
                sizes="56px"
              />
            )}
            <div className="article-author__details">
              <div
                aria-describedby={bioId}
                className="article-author__identity"
                tabIndex={author.bio ? 0 : undefined}
              >
                {author.url ? (
                  <a className="article-author__name" href={author.url}>
                    <strong>{author.name}</strong>
                  </a>
                ) : (
                  <strong>{author.name}</strong>
                )}
                {author.role && (
                  <span className="article-author__role">{author.role}</span>
                )}
                {author.bio && (
                  <span
                    className="article-author__bio"
                    id={bioId}
                    role="tooltip"
                  >
                    {author.bio}
                  </span>
                )}
              </div>
              {links.some(([, href]) => href) && (
                <div
                  className="article-author__links"
                  role="group"
                  aria-label={`${author.name} links`}
                >
                  {links.map(([label, href]) =>
                    href ? (
                      <a
                        href={href}
                        key={label}
                        aria-label={`${label} — ${author.name}`}
                        title={label}
                        data-platform={label.toLowerCase()}
                      >
                        {label === 'Website' ? (
                          <Globe
                            size={20}
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                        ) : (
                          socialLogos[label].map(
                            ({ src, width, height }, index) => (
                              <Image
                                key={src}
                                src={src}
                                alt=""
                                width={width}
                                height={height}
                                unoptimized
                                className={`article-author__social-logo article-author__social-logo--${index === 0 ? 'light' : 'dark'}`}
                              />
                            ),
                          )
                        )}
                      </a>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
