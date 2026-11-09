import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Code2,
  Database,
  MessageSquare,
  Monitor,
  Server,
  User,
  Wrench,
} from 'lucide-react';

const primitives = [
  { icon: Wrench, name: 'Tools', note: 'do things' },
  { icon: Database, name: 'Resources', note: 'supply data' },
  { icon: MessageSquare, name: 'Prompts', note: 'reusable requests' },
];

export function McpExchangeVisual() {
  return (
    <div
      className="mcp-exchange"
      role="img"
      aria-label="A user asks an AI app a question. Inside the app, an MCP client sends a tools/call request to an MCP server and receives a result. The server exposes tools, resources and prompts."
    >
      <div className="mcp-exchange__grid" aria-hidden="true">
        <section className="mcp-card mcp-card--host">
          <header>
            <span className="mcp-card__icon">
              <Monitor />
            </span>
            <strong>AI app</strong>
            <small>the host</small>
          </header>
          <p className="mcp-prompt">
            <span>
              <User />
            </span>
            “What’s the weather in Lagos?”
          </p>
          <ArrowDown className="mcp-drop" />
          <div className="mcp-client">
            <span className="mcp-client__icon">
              <Code2 />
            </span>
            <div>
              <strong>MCP client</strong>
              <small>Lives inside the host, one per server</small>
            </div>
          </div>
        </section>

        <div className="mcp-link">
          <div className="mcp-link__row">
            <i />
            <span>
              <ArrowRight className="mcp-link__h" />
              <ArrowDown className="mcp-link__v" />
              tools/call
            </span>
            <i className="mcp-link__head mcp-link__head--right" />
          </div>
          <div className="mcp-link__row">
            <i className="mcp-link__head mcp-link__head--left" />
            <span>
              <ArrowLeft className="mcp-link__h" />
              <ArrowUp className="mcp-link__v" />
              result
            </span>
            <i />
          </div>
        </div>

        <section className="mcp-card mcp-card--server">
          <header>
            <span className="mcp-card__icon">
              <Server />
            </span>
            <strong>MCP server</strong>
            <small>exposes primitives</small>
          </header>
          <ul>
            {primitives.map(({ icon: Icon, name, note }) => (
              <li key={name}>
                <span>
                  <Icon />
                </span>
                <div>
                  <strong>{name}</strong>
                  <small>{note}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <p className="mcp-exchange__caption" aria-hidden="true">
        Requests and results travel as JSON-RPC messages over one MCP
        connection.
      </p>
    </div>
  );
}
