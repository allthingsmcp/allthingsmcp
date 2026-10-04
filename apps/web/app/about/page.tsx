import { InfoPage } from '@/components/info-page';

export default function AboutPage() {
  return (
    <InfoPage
      title="About All Things MCP"
      description="An independent field guide to MCP and the ecosystem taking shape around it, built in public with the community."
    >
      <h2>Why this exists</h2>
      <p>
        MCP has grown into more than a protocol specification. Around it is an
        expanding ecosystem of servers, clients, interactive apps, extensions,
        registries, infrastructure, and web-facing interfaces. Developers need a
        place that explains how these pieces fit together—without reducing the
        subject to code snippets, product announcements, or unverified claims.
      </p>
      <h2>What we publish</h2>
      <p>
        All Things MCP covers the core protocol, official extensions, SDKs and
        implementations, MCP Apps, security and operations, registries and
        developer tooling, and adjacent work such as WebMCP when it directly
        affects how agents interact with software. Every technical page records
        its applicable specification version and verification date.
      </p>
      <h2>Built with the community</h2>
      <p>
        All Things MCP is designed to be contributed to, not just consumed.
        Developers, researchers, maintainers, and practitioners can contribute
        guides, articles, examples, corrections, and platform improvements.
        Content lives in Git, and contributions arrive through pull requests so
        the community can help shape both what the project teaches and how it
        works.
      </p>
      <h2>How we work</h2>
      <p>
        Technical claims are reviewed against primary sources. We distinguish
        final specifications from drafts, official extensions from community
        projects, and documented support from behavior we have verified.
      </p>
    </InfoPage>
  );
}
