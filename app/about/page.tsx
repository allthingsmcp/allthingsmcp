import { InfoPage } from '@/components/info-page';

export default function AboutPage() {
  return (
    <InfoPage
      title="About All Things MCP"
      description="An independent field guide for developers building with Model Context Protocol."
    >
      <h2>Why this exists</h2>
      <p>
        MCP is becoming an important interface between AI applications and
        external capabilities. Developers need a place that connects protocol
        mechanics to real architecture, security, and operations—without
        reducing the subject to snippets or vendor announcements.
      </p>
      <h2>What we publish</h2>
      <p>
        All Things MCP publishes structured learning paths, practical guides,
        architecture explanations, specification analysis, ecosystem references,
        and carefully scoped tools. Every technical page records its applicable
        specification version and verification date.
      </p>
      <h2>How we work</h2>
      <p>
        The website is built in public. Content lives in Git, community
        contributions arrive through pull requests, and technical claims are
        reviewed against primary sources.
      </p>
    </InfoPage>
  );
}
