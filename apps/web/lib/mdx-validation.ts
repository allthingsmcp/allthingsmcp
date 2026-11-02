/** Remove literal fenced code before checking contributed MDX syntax. */
export function withoutFencedCode(body: string) {
  let fence: { marker: string; length: number } | undefined;
  return body
    .split('\n')
    .map((line) => {
      const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      if (fence) {
        if (
          marker &&
          marker[1][0] === fence.marker &&
          marker[1].length >= fence.length &&
          marker[2].trim() === ''
        ) {
          fence = undefined;
        }
        return '';
      }
      if (marker && !(marker[1][0] === '`' && marker[2].includes('`'))) {
        fence = { marker: marker[1][0], length: marker[1].length };
        return '';
      }
      return line;
    })
    .join('\n');
}

export function validateMdxBody(body: string, allowedComponents: Set<string>) {
  const executable = withoutFencedCode(body);
  const errors: string[] = [];
  if (/^(?:import|export)\s/m.test(executable))
    errors.push('MDX imports and exports are not allowed');
  for (const match of executable.matchAll(/<\/?([A-Z][A-Za-z0-9]*)\b/g)) {
    if (!allowedComponents.has(match[1]))
      errors.push(`unapproved MDX component <${match[1]}>`);
  }
  const withoutApprovedArrays = executable.replace(
    /items=\{\[[\s\S]*?\]\}/g,
    '',
  );
  if (
    /\{\s*(?:\([^)]*\)\s*=>|function\b|async\b|await\b|new\s+|[A-Za-z_$][\w$]*\s*\()/m.test(
      withoutApprovedArrays,
    )
  ) {
    errors.push('executable JavaScript is not allowed in contributed MDX');
  }
  return errors;
}
