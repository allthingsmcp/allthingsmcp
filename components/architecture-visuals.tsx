import {
  Activity,
  AppWindow,
  Braces,
  Database,
  KeyRound,
  Network,
  Server,
  ShieldCheck,
} from 'lucide-react';

export function KnowledgeBridgeVisual() {
  return (
    <figure className="knowledge-bridge">
      <div
        role="img"
        aria-label="The MCP specification is translated by All Things MCP into practical working systems"
      >
        <div className="bridge-node bridge-node--source">
          <Braces />
          <span>Specification</span>
          <small>Normative protocol</small>
        </div>
        <span className="bridge-arrow" aria-hidden="true">
          →
        </span>
        <div className="bridge-node bridge-node--brand">
          <Network />
          <span>All Things MCP</span>
          <small>Explanation and guidance</small>
        </div>
        <span className="bridge-arrow" aria-hidden="true">
          →
        </span>
        <div className="bridge-node bridge-node--result">
          <AppWindow />
          <span>Working system</span>
          <small>Secure and operable</small>
        </div>
      </div>
      <figcaption>
        We connect protocol requirements to architecture and implementation
        decisions.
      </figcaption>
    </figure>
  );
}

const productionNodes = [
  {
    label: 'Host / application',
    detail: 'Policy and user experience',
    icon: AppWindow,
    tone: 'neutral',
  },
  {
    label: 'MCP client',
    detail: 'Self-contained requests',
    icon: Braces,
    tone: 'blue',
  },
  {
    label: 'Gateway',
    detail: 'Routing and limits',
    icon: Network,
    tone: 'violet',
  },
  {
    label: 'MCP server',
    detail: 'Resources · prompts · tools',
    icon: Server,
    tone: 'green',
  },
] as const;

export function ProductionArchitectureVisual() {
  return (
    <figure className="production-architecture">
      <div
        className="production-flow"
        role="img"
        aria-label="A host uses an MCP client through a gateway to reach an MCP server, which is supported by authorization, observability, and external data services"
      >
        {productionNodes.map(({ label, detail, icon: Icon, tone }, index) => (
          <div className="production-flow__item" key={label}>
            <div className={`architecture-node architecture-node--${tone}`}>
              <Icon />
              <strong>{label}</strong>
              <span>{detail}</span>
            </div>
            {index < productionNodes.length - 1 && (
              <div className="architecture-edge" aria-hidden="true">
                <span>request / response</span>
                <b>→</b>
              </div>
            )}
          </div>
        ))}
      </div>
      <div
        className="architecture-services"
        aria-label="Production supporting services"
      >
        <div>
          <KeyRound />
          <span>Authorization</span>
        </div>
        <div>
          <Activity />
          <span>Observability</span>
        </div>
        <div>
          <Database />
          <span>Data and APIs</span>
        </div>
        <div>
          <ShieldCheck />
          <span>Policy controls</span>
        </div>
      </div>
      <figcaption>
        Production MCP is a system of protocol, trust, routing, telemetry, and
        data boundaries.
      </figcaption>
    </figure>
  );
}
