import {
  Children,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { FileCode2 } from 'lucide-react';
import { CodeCopyButton } from '@/components/code-copy-button';

type CodeBlockProps = ComponentPropsWithoutRef<'pre'> & {
  title?: string;
};

const languageNames: Record<string, string> = {
  bash: 'Shell',
  css: 'CSS',
  html: 'HTML',
  javascript: 'JavaScript',
  js: 'JavaScript',
  json: 'JSON',
  jsx: 'JSX',
  markdown: 'Markdown',
  md: 'Markdown',
  mdx: 'MDX',
  plaintext: 'Text',
  python: 'Python',
  py: 'Python',
  shell: 'Shell',
  ts: 'TypeScript',
  tsx: 'TSX',
  typescript: 'TypeScript',
  yaml: 'YAML',
  yml: 'YAML',
};

function getText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(getText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getText(node.props.children);
  }
  return '';
}

function getLanguage(node: ReactNode): string | undefined {
  let language: string | undefined;

  Children.forEach(node, (child) => {
    if (!isValidElement<{ className?: string; children?: ReactNode }>(child)) {
      return;
    }
    const match = child.props.className?.match(/(?:^|\s)language-([\w-]+)/);
    if (match?.[1]) language = match[1];
    if (!language && child.props.children) {
      language = getLanguage(child.props.children);
    }
  });

  return language;
}

export function CodeBlock({ children, title, ...props }: CodeBlockProps) {
  const language = getLanguage(children);
  const label =
    title ?? (language ? (languageNames[language] ?? language) : 'Code');
  const code = getText(children).replace(/\n$/, '');

  return (
    <figure className="code-block">
      <figcaption className="code-block__header">
        <span className="code-block__label">
          <FileCode2 aria-hidden="true" />
          {label}
          {title && language && (
            <small>{languageNames[language] ?? language}</small>
          )}
        </span>
        <CodeCopyButton code={code} />
      </figcaption>
      <pre {...props}>{children}</pre>
    </figure>
  );
}
