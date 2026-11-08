import { describe, expect, it } from 'vitest';
import { validateMdxBody, withoutFencedCode } from '@/lib/mdx-validation';

const allowed = new Set(['Callout', 'Checklist']);

describe('contributed MDX validation', () => {
  it('accepts complete code examples while retaining prose and approved components', () => {
    const body = [
      '<Callout>Read this first.</Callout>',
      '```typescript title="server.ts"',
      'import { McpServer } from "package";',
      'export async function run() { await connect(); }',
      'const element = <Example />;',
      '```',
      'Continue here.',
    ].join('\n');
    expect(validateMdxBody(body, allowed)).toEqual([]);
    expect(withoutFencedCode(body)).toContain('Continue here.');
  });

  it.each([
    ['import thing from "package";', 'MDX imports and exports'],
    ['export const value = 1;', 'MDX imports and exports'],
    ['{await run()}', 'executable JavaScript'],
    ['<Unreviewed />', 'unapproved MDX component'],
  ])('still rejects live syntax after a code fence: %s', (syntax, error) => {
    expect(
      validateMdxBody(
        `\`\`\`js\nconst x = 1;\n\`\`\`\n${syntax}`,
        allowed,
      ).join(),
    ).toContain(error);
  });

  it('supports tilde fences and requires a matching closing marker', () => {
    const body =
      '~~~~jsx\n<Example />\n~~~\n```\nexport const inside = 1;\n~~~~\n<Outside />';
    expect(validateMdxBody(body, allowed)).toEqual([
      'unapproved MDX component <Outside>',
    ]);
  });

  it('does not close a fence on a line with trailing text', () => {
    const body =
      '```js\n``` still code\nexport const inside = 1;\n```\nexport const outside = 2;';
    expect(withoutFencedCode(body).trim()).toBe('export const outside = 2;');
  });

  it('does not treat an invalid backtick info string as an opening fence', () => {
    expect(
      validateMdxBody('```bad`info\nexport const outside = 2;', allowed),
    ).toContain('MDX imports and exports are not allowed');
  });
});
