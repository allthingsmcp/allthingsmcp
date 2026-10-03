import Image from 'next/image';

export type ArticleAuthor = {
  name: string;
  role: string;
  image: string;
  url?: string;
};

export function ArticleAuthors({ authors }: { authors: ArticleAuthor[] }) {
  if (!authors.length) return null;

  return (
    <div className="article-authors" aria-label="Article authors">
      {authors.map((author) => {
        const profile = (
          <>
            <Image
              src={author.image}
              alt=""
              width={48}
              height={48}
              sizes="48px"
            />
            <span>
              <small>Written by</small>
              <strong>{author.name}</strong>
              <span>{author.role}</span>
            </span>
          </>
        );

        return author.url ? (
          <a href={author.url} key={author.name}>
            {profile}
          </a>
        ) : (
          <div key={author.name}>{profile}</div>
        );
      })}
    </div>
  );
}
