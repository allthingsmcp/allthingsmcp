import {
  Code2,
  Database,
  MessageCircle,
  Monitor,
  Server,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

function Node({
  label,
  tone = 'blue',
  children,
}: {
  label: string;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`protocol-node protocol-node--${tone}`}>
      {children}
      <span>{label}</span>
    </div>
  );
}

export function ProtocolVisual({
  type = 'topology',
}: {
  type?: 'topology' | 'radial' | 'code' | 'gateway' | 'trust';
}) {
  if (type === 'code') {
    return (
      <div className="code-window" aria-label="Example MCP server code">
        <div className="code-window__bar">
          <span />
          <span />
          <span />
          <b>server.py</b>
        </div>
        <pre>
          <code>
            <span className="code-pink">from</span> mcp.server{' '}
            <span className="code-pink">import</span> Server{`\n`}
            <span className="code-pink">from</span> mcp.tools{' '}
            <span className="code-pink">import</span> tool{`\n\n`}server =
            Server(<span className="code-yellow">&quot;example&quot;</span>)
            {`\n\n`}@tool(){`\n`}
            <span className="code-pink">def</span> add(a: int, b: int) -&gt;
            int:{`\n`} <span className="code-pink">return</span> a + b{`\n\n`}
            server.run(transport=
            <span className="code-yellow">&quot;stdio&quot;</span>)
          </code>
        </pre>
        <span className="code-label">Python</span>
      </div>
    );
  }

  if (type === 'radial') {
    return (
      <div
        className="radial-diagram"
        role="img"
        aria-label="MCP connects clients, servers, tools, prompts, resources, and hosts"
      >
        <div className="radial-ring radial-ring--outer" />
        <div className="radial-ring radial-ring--inner" />
        <Node label="MCP" tone="solid">
          <ShieldCheck />
        </Node>
        <span className="radial-item radial-item--one">
          <Code2 />
          Clients
        </span>
        <span className="radial-item radial-item--two">
          <Server />
          Servers
        </span>
        <span className="radial-item radial-item--three">
          <Wrench />
          Tools
        </span>
        <span className="radial-item radial-item--four">
          <MessageCircle />
          Prompts
        </span>
        <span className="radial-item radial-item--five">
          <Database />
          Resources
        </span>
        <span className="radial-item radial-item--six">
          <Monitor />
          Hosts
        </span>
      </div>
    );
  }

  if (type === 'gateway') {
    return (
      <div
        className="flow-diagram"
        role="img"
        aria-label="Clients connect through an MCP gateway to servers and data services"
      >
        <div className="flow-group">
          <Node label="Clients">
            <Monitor />
          </Node>
        </div>
        <span className="flow-arrow">→</span>
        <div className="gateway-stack">
          <b>MCP Gateway</b>
          <span>Routing</span>
          <span>Auth & policy</span>
          <span>Rate limiting</span>
          <span>Observability</span>
        </div>
        <span className="flow-arrow">↔</span>
        <div className="flow-group flow-group--servers">
          <Node label="MCP servers" tone="green">
            <Server />
          </Node>
          <Node label="Data" tone="neutral">
            <Database />
          </Node>
        </div>
      </div>
    );
  }

  if (type === 'trust') {
    return (
      <div
        className="trust-diagram"
        role="img"
        aria-label="MCP trust model from user through host and client to authorization, server, and resource systems"
      >
        {[
          'User',
          'Host',
          'MCP client',
          'Authorization',
          'MCP server',
          'Resource',
        ].map((label, index) => (
          <div
            key={label}
            className={
              index === 3
                ? 'trust-node trust-node--violet'
                : index >= 4
                  ? 'trust-node trust-node--green'
                  : 'trust-node'
            }
          >
            {index > 0 && <span className="trust-edge">→</span>}
            <ShieldCheck aria-hidden="true" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="topology-diagram"
      role="img"
      aria-label="A host application connects through an MCP client and gateway to three MCP servers"
    >
      <div className="topology-column">
        <Node label="Host / application">
          <Monitor />
        </Node>
        <span>↓</span>
        <Node label="MCP client">
          <Code2 />
        </Node>
        <span>↓</span>
        <Node label="MCP gateway" tone="violet">
          <ShieldCheck />
        </Node>
      </div>
      <div className="topology-branch">
        {['Data', 'Code', 'Cloud'].map((label) => (
          <Node label={`MCP server · ${label}`} tone="green" key={label}>
            <Server />
          </Node>
        ))}
      </div>
    </div>
  );
}
