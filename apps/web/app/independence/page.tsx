import { InfoPage } from '@/components/info-page';

export default function IndependencePage() {
  return (
    <InfoPage
      title="Independence and editorial policy"
      description="How we preserve trust, attribute sources, and separate evidence from opinion."
    >
      <h2>Independent by design</h2>
      <p>
        All Things MCP is not the official MCP specification and does not
        represent a protocol steward or vendor. Official sources are linked
        directly. Our role is to explain, test, compare, and connect the
        material for practitioners.
      </p>
      <h2>Claims and corrections</h2>
      <p>
        Protocol requirements are distinguished from common implementation
        patterns and author recommendations. Technical pages carry a version and
        verification date. Corrections are welcome through public issues and
        pull requests.
      </p>
      <h2>Listings and review status</h2>
      <p>
        Presence in the ecosystem directory is not an endorsement. New entries
        begin as “Not yet reviewed.” Any future review program will publish its
        criteria and evidence.
      </p>
      <h2>Commercial relationships</h2>
      <p>
        Sponsorships, affiliate relationships, or provided access will be
        disclosed next to the affected work. Commercial support does not
        purchase technical conclusions or directory review status.
      </p>
    </InfoPage>
  );
}
