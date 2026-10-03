import { Code2, Monitor, Server, ShieldCheck } from 'lucide-react';
import { ProtocolVisual } from '@/components/protocol-visual';

export function GuidesOverviewVisual() {
  return (
    <div
      className="guides-overview-visual"
      role="img"
      aria-label="A developer journey from understanding MCP hosts, clients, and servers, through building a server, to operating it behind a gateway."
    >
      <div className="guides-overview-visual__content" aria-hidden="true">
        <section className="guide-visual-stage guide-visual-stage--understand">
          <small>Understand</small>
          <div className="guide-visual-nodes">
            <span>
              <Monitor />
              Host
            </span>
            <b>→</b>
            <span className="is-blue">
              <Code2 />
              Client
            </span>
            <b>→</b>
            <span className="is-green">
              <Server />
              Server
            </span>
          </div>
        </section>
        <span className="guide-visual-connector">→</span>
        <section className="guide-visual-stage guide-visual-stage--build">
          <small>Build</small>
          <ProtocolVisual type="code" />
        </section>
        <span className="guide-visual-connector">→</span>
        <section className="guide-visual-stage guide-visual-stage--operate">
          <small>Operate</small>
          <div className="guide-gateway">
            <span>
              <ShieldCheck /> MCP gateway
            </span>
            <b>Routing</b>
            <b>Auth &amp; policy</b>
            <b>Observability</b>
          </div>
          <div className="guide-server-row">
            <span>
              <Server />
            </span>
            <span>
              <Server />
            </span>
            <span>
              <Server />
            </span>
          </div>
        </section>
      </div>
      <div className="guide-visual-legend" aria-hidden="true">
        <span>— Request / response</span>
        <span>-- Discovery / routing</span>
      </div>
    </div>
  );
}
