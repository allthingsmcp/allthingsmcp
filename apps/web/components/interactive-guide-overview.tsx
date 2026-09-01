import {
  CheckCircle2,
  Database,
  MessageSquareText,
  MonitorPlay,
  Server,
  Wrench,
} from 'lucide-react';

export function InteractiveGuideEnhancement() {
  return (
    <section className="shell interactive-guide-enhancement">
      <div className="interactive-overview-outcome">
        <header>
          <span>
            <Server aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">You’ll build</p>
            <h2>A configurable weather MCP server</h2>
          </div>
          <p className="interactive-enhancement-note">
            <MonitorPlay aria-hidden="true" /> Browser simulation
          </p>
        </header>
        <div className="interactive-enhancement-grid">
          <div
            className="interactive-overview-diagram"
            role="img"
            aria-label="An ATM client connects over Streamable HTTP to a weather MCP server with tools, resources, and prompts."
          >
            <span className="interactive-node is-client">
              <MonitorPlay aria-hidden="true" /> ATM client
            </span>
            <i>Streamable HTTP →</i>
            <span className="interactive-node is-server">
              <Server aria-hidden="true" /> Weather MCP server
            </span>
            <div>
              <span className="is-tool">
                <Wrench aria-hidden="true" /> Tools
              </span>
              <span className="is-resource">
                <Database aria-hidden="true" /> Resources
              </span>
              <span className="is-prompt">
                <MessageSquareText aria-hidden="true" /> Prompts
              </span>
            </div>
          </div>
          <section className="interactive-overview-learn">
            <h3>You’ll learn</h3>
            {[
              'How MCP participants fit together',
              'How tools, resources, and prompts differ',
              'How current protocol messages flow',
              'How to test and export a real TypeScript project',
            ].map((item) => (
              <p key={item}>
                <CheckCircle2 aria-hidden="true" /> {item}
              </p>
            ))}
          </section>
        </div>
      </div>
    </section>
  );
}
