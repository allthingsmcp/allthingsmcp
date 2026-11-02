import { useState } from 'react';
import {
  Check,
  Clipboard,
  Code2,
  Database,
  Info,
  MessageSquareText,
  Server,
  Wrench,
} from 'lucide-react';
import { useInteractiveGuide } from '@/components/interactive-guide-context';
import { generateServerSource } from '@/lib/interactive-guides';
import { TypeScriptCode } from '@/components/interactive-guide/code-views';

export function CodeMode() {
  const { state } = useInteractiveGuide();
  const code = generateServerSource(state);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="interactive-code-layout">
      <section className="interactive-code-panel">
        <header>
          <div>
            <p className="eyebrow">Generated from your configuration</p>
            <h3>src/server.ts</h3>
          </div>
          <div className="interactive-code-actions">
            <button onClick={copy} type="button">
              {copied ? (
                <Check aria-hidden="true" />
              ) : (
                <Clipboard aria-hidden="true" />
              )}
              {copied ? 'Copied' : 'Copy code'}
            </button>
          </div>
        </header>
        <pre>
          <TypeScriptCode code={code} />
        </pre>
        <p>
          <Info aria-hidden="true" /> Read-only in this phase. Use Visual mode
          to change the server.
        </p>
      </section>
      <CodeLearningPanel />
    </div>
  );
}

export function CodeLearningPanel() {
  const { state } = useInteractiveGuide();
  const registrations = [
    {
      label: 'Tools',
      detail: 'Callable actions registered on the server',
      count: state.server.tools.length,
      icon: Wrench,
      className: 'is-tool',
    },
    {
      label: 'Resources',
      detail: 'Data and context exposed by URI',
      count: state.server.resources.length,
      icon: Database,
      className: 'is-resource',
    },
    {
      label: 'Prompts',
      detail: 'Reusable message templates for clients',
      count: state.server.prompts.length,
      icon: MessageSquareText,
      className: 'is-prompt',
    },
  ];

  return (
    <aside
      aria-label="Generated code explanation"
      className="interactive-learning-panel"
    >
      <header>
        <div>
          <p className="eyebrow">About this code</p>
          <h3>Your MCP server</h3>
        </div>
        <Code2 aria-hidden="true" />
      </header>
      <p>
        This TypeScript file is generated from the capabilities you configured
        in Visual mode.
      </p>

      <section className="interactive-code-identity">
        <span className="interactive-server-icon">
          <Server aria-hidden="true" />
        </span>
        <span>
          <strong>{state.server.name}</strong>
          <small>Version {state.server.version}</small>
        </span>
      </section>

      <section>
        <h4>What your code contains</h4>
        <div className="interactive-learning-list">
          {registrations.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <span className={item.className}>
                  <Icon aria-hidden="true" />
                </span>
                <span>
                  <strong>
                    {item.label} <b>{item.count}</b>
                  </strong>
                  <small>{item.detail}</small>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="interactive-learning-note">
        <Info aria-hidden="true" />
        <span>
          <strong>Code stays in sync</strong>
          <small>
            Visual configuration is the source of truth. Every change
            regenerates this read-only preview.
          </small>
        </span>
      </section>
    </aside>
  );
}
