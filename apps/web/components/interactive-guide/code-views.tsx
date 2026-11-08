import { useMemo, type ReactNode } from 'react';

export function JsonPanel({ value, label }: { value: unknown; label: string }) {
  return (
    <section className="interactive-json-panel">
      <span>{label}</span>
      <pre>
        <JsonCode value={value} />
      </pre>
    </section>
  );
}

export function JsonCode({ value }: { value: unknown }) {
  const json = useMemo(() => JSON.stringify(value, null, 2) ?? '', [value]);
  const tokens = useMemo(() => {
    const pattern =
      /"(?:[^"\\]|\\.)*"(?=\s*:)|"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b|[{}\[\],:]/g;
    const output: ReactNode[] = [];
    let cursor = 0;

    for (const match of json.matchAll(pattern)) {
      const index = match.index ?? 0;
      if (index > cursor) output.push(json.slice(cursor, index));
      const token = match[0];
      const remainder = json.slice(index + token.length);
      const className = token.startsWith('"')
        ? /^\s*:/.test(remainder)
          ? 'token-json-key'
          : 'token-json-string'
        : /^-?\d/.test(token)
          ? 'token-json-number'
          : /^(?:true|false|null)$/.test(token)
            ? 'token-json-literal'
            : 'token-json-punctuation';
      output.push(
        <span className={className} key={`${index}-${token}`}>
          {token}
        </span>,
      );
      cursor = index + token.length;
    }
    if (cursor < json.length) output.push(json.slice(cursor));
    return output;
  }, [json]);

  return <code>{tokens}</code>;
}

export function TypeScriptCode({ code }: { code: string }) {
  const tokens = useMemo(
    () =>
      code.split('\n').map((line, lineIndex) => {
        const commentIndex = line.indexOf('//');
        const codePart = commentIndex >= 0 ? line.slice(0, commentIndex) : line;
        const comment = commentIndex >= 0 ? line.slice(commentIndex) : '';
        const parts = codePart.split(
          /(\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:import|from|const|function|return|async|await|new|if|void|type|as)\b|\b\d+(?:\.\d+)?\b)/g,
        );
        return (
          <span
            className={`interactive-code-line ${line.includes('server.register') ? 'is-generated-change' : ''}`}
            key={`${lineIndex}-${line}`}
          >
            <span className="interactive-code-number">{lineIndex + 1}</span>
            <span>
              {parts.map((part, index) => {
                const className = /^(?:\"|'|`)/.test(part)
                  ? 'token-string'
                  : /^(?:import|from|const|function|return|async|await|new|if|void|type|as)$/.test(
                        part,
                      )
                    ? 'token-keyword'
                    : /^\d/.test(part)
                      ? 'token-number'
                      : undefined;
                return (
                  <span className={className} key={`${part}-${index}`}>
                    {part}
                  </span>
                );
              })}
              {comment && <span className="token-comment">{comment}</span>}
            </span>
          </span>
        );
      }),
    [code],
  );
  return <code>{tokens}</code>;
}
