import { InfoPage } from '@/components/info-page';

export default function EditorialPolicyPage() {
  return (
    <InfoPage
      title="Editorial policy"
      description="How All Things MCP separates protocol facts, implementation guidance, analysis, and opinion."
    >
      <h2>Accuracy before velocity</h2>
      <p>
        Technical claims identify the specification revision and verification
        date they were reviewed against. Material corrections are made
        transparently.
      </p>
      <h2>Independent interpretation</h2>
      <p>
        All Things MCP is an independent publication. We link to primary
        sources, distinguish normative requirements from our recommendations,
        and do not imply endorsement by MCP maintainers.
      </p>
      <h2>Community review</h2>
      <p>
        Content changes are proposed in public Git pull requests and require
        editorial and technical review before publication.
      </p>
    </InfoPage>
  );
}
