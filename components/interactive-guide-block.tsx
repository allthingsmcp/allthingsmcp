'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeftRight,
  Check,
  CheckCircle2,
  Circle,
  Clipboard,
  Code2,
  Database,
  Download,
  FileJson2,
  Info,
  MessageSquareText,
  MonitorPlay,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Server,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useInteractiveGuide } from '@/components/interactive-guide-context';
import {
  cloneCapability,
  generateProjectFiles,
  generateServerSource,
  getGuideObjectives,
  validateServerName,
  type CapabilityDefinition,
  type CapabilityKind,
  type InteractiveGuideScene,
} from '@/lib/interactive-guides';
import { createZipArchive } from '@/lib/zip';

type WorkspaceMode = 'visual' | 'code' | 'protocol' | 'client';

const kindMeta: Record<
  CapabilityKind,
  { label: string; icon: typeof Wrench; className: string }
> = {
  tool: { label: 'Tools', icon: Wrench, className: 'is-tool' },
  resource: {
    label: 'Resources',
    icon: Database,
    className: 'is-resource',
  },
  prompt: {
    label: 'Prompts',
    icon: MessageSquareText,
    className: 'is-prompt',
  },
};

function collectionFor(
  kind: CapabilityKind,
  server: ReturnType<typeof useInteractiveGuide>['state']['server'],
) {
  return kind === 'tool'
    ? server.tools
    : kind === 'resource'
      ? server.resources
      : server.prompts;
}

function sceneKind(scene: InteractiveGuideScene): CapabilityKind | undefined {
  if (scene === 'add-tools') return 'tool';
  if (scene === 'add-resources') return 'resource';
  if (scene === 'add-prompts') return 'prompt';
  return undefined;
}

function JsonPanel({ value, label }: { value: unknown; label: string }) {
  return (
    <section className="interactive-json-panel">
      <span>{label}</span>
      <pre>
        <JsonCode value={value} />
      </pre>
    </section>
  );
}

function JsonCode({ value }: { value: unknown }) {
  const json = useMemo(() => JSON.stringify(value, null, 2) ?? '', [value]);
  const tokens = useMemo(() => {
    const pattern =
      /"(?:[^"\\]|\\.)*"(?=\s*:)|"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b|[{}\[\],:]/g;
    const output: ReactNode[] = [];
    let cursor = 0;

    for (const match of json.matchAll(pattern)) {
      const index = match.index ?? 0;
      if (index > cursor) output.push(json.slice(cursor, index));
      const token = match[0];
      const remainder = json.slice(index + token.length);
      const className = token.startsWith('"')
        ? /^\s*:/.test(remainder)
          ? 'token-json-key'
          : 'token-json-string'
        : /^-?\d/.test(token)
          ? 'token-json-number'
          : /^(?:true|false|null)$/.test(token)
            ? 'token-json-literal'
            : 'token-json-punctuation';
      output.push(
        <span className={className} key={`${index}-${token}`}>
          {token}
        </span>,
      );
      cursor = index + token.length;
    }
    if (cursor < json.length) output.push(json.slice(cursor));
    return output;
  }, [json]);

  return <code>{tokens}</code>;
}

function TypeScriptCode({ code }: { code: string }) {
  const tokens = useMemo(
    () =>
      code.split('\n').map((line, lineIndex) => {
        const commentIndex = line.indexOf('//');
        const codePart = commentIndex >= 0 ? line.slice(0, commentIndex) : line;
        const comment = commentIndex >= 0 ? line.slice(commentIndex) : '';
        const parts = codePart.split(
          /(\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:import|from|const|function|return|async|await|new|if|void|type|as)\b|\b\d+(?:\.\d+)?\b)/g,
        );
        return (
          <span
            className={`interactive-code-line ${line.includes('server.register') ? 'is-generated-change' : ''}`}
            key={`${lineIndex}-${line}`}
          >
            <span className="interactive-code-number">{lineIndex + 1}</span>
            <span>
              {parts.map((part, index) => {
                const className = /^(?:\"|'|`)/.test(part)
                  ? 'token-string'
                  : /^(?:import|from|const|function|return|async|await|new|if|void|type|as)$/.test(
                        part,
                      )
                    ? 'token-keyword'
                    : /^\d/.test(part)
                      ? 'token-number'
                      : undefined;
                return (
                  <span className={className} key={`${part}-${index}`}>
                    {part}
                  </span>
                );
              })}
              {comment && <span className="token-comment">{comment}</span>}
            </span>
          </span>
        );
      }),
    [code],
  );
  return <code>{tokens}</code>;
}

function WorkspaceTabs({
  mode,
  onChange,
}: {
  mode: WorkspaceMode;
  onChange: (mode: WorkspaceMode) => void;
}) {
  const modes: Array<[WorkspaceMode, string, typeof Wrench]> = [
    ['visual', 'Visual', ArrowLeftRight],
    ['code', 'Code', Code2],
    ['protocol', 'Protocol', FileJson2],
    ['client', 'Client', MonitorPlay],
  ];
  return (
    <div
      className="interactive-mode-tabs"
      role="tablist"
      aria-label="Guide workspace"
    >
      {modes.map(([value, label, Icon]) => (
        <button
          aria-selected={mode === value}
          className={mode === value ? 'is-active' : undefined}
          key={value}
          onClick={() => onChange(value)}
          role="tab"
          type="button"
        >
          <Icon aria-hidden="true" /> {label}
        </button>
      ))}
    </div>
  );
}

function ServerSummary({ readOnly = false }: { readOnly?: boolean }) {
  const { state, dispatch } = useInteractiveGuide();
  return (
    <section className="interactive-server-summary">
      <header>
        <span className="interactive-server-icon">
          <Server aria-hidden="true" />
        </span>
        <div>
          <strong>{state.server.name}</strong>
          <small>
            {state.server.created ? 'Simulation ready' : 'Not created yet'}
          </small>
        </div>
        <span className="interactive-status">
          <Circle aria-hidden="true" /> Simulation
        </span>
      </header>
      <div className="interactive-capability-groups">
        {(['tool', 'resource', 'prompt'] as const).map((kind) => {
          const meta = kindMeta[kind];
          const Icon = meta.icon;
          const items = collectionFor(kind, state.server);
          return (
            <section className={meta.className} key={kind}>
              <div className="interactive-group-heading">
                <span>
                  <Icon aria-hidden="true" /> {meta.label}
                </span>
                <b>{items.length}</b>
              </div>
              {items.length ? (
                <ul>
                  {items.map((item) => (
                    <li key={item.id}>
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.description}</small>
                      </span>
                      {!readOnly && (
                        <span className="interactive-inline-actions">
                          <button
                            aria-label={`Remove ${item.name}`}
                            onClick={() =>
                              dispatch({
                                type: 'remove-capability',
                                kind,
                                id: item.id,
                              })
                            }
                            type="button"
                          >
                            <Trash2 aria-hidden="true" />
                          </button>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No {meta.label.toLowerCase()} added yet.</p>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}

function CreateServerScene() {
  const { state, dispatch } = useInteractiveGuide();
  const [name, setName] = useState(state.server.name);
  const error = validateServerName(name);
  return (
    <div className="interactive-create-layout">
      <section>
        <p className="eyebrow">Weather template</p>
        <h3>Create the server boundary</h3>
        <p>
          Name the MCP server that will own the tools, resources, and prompts
          you configure in this Guide.
        </p>
        <label>
          <span>Server name</span>
          <input
            aria-invalid={!!error}
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
          {error && <small className="field-error">{error}</small>}
        </label>
        <button
          className="button button--primary"
          disabled={!!error}
          onClick={() => dispatch({ type: 'create-server', name })}
          type="button"
        >
          <Plus aria-hidden="true" />
          {state.server.created ? 'Update server' : 'Create server'}
        </button>
        {state.server.created && (
          <span className="interactive-status is-success" role="status">
            <CheckCircle2 aria-hidden="true" /> Simulation ready
          </span>
        )}
      </section>
      <div
        className="interactive-topology"
        role="img"
        aria-label="An ATM client connects to a weather MCP server, which exposes tools, resources, and prompts."
      >
        <span className="interactive-node is-client">
          <MonitorPlay aria-hidden="true" /> ATM client
        </span>
        <i aria-hidden="true">Streamable HTTP →</i>
        <span className="interactive-node is-server">
          <Server aria-hidden="true" /> {name || 'weather-server'}
        </span>
        <div>
          <span>
            <Wrench aria-hidden="true" /> Tools
          </span>
          <span>
            <Database aria-hidden="true" /> Resources
          </span>
          <span>
            <MessageSquareText aria-hidden="true" /> Prompts
          </span>
        </div>
      </div>
    </div>
  );
}

const resourceResponsePreviews: Record<string, Record<string, unknown>> = {
  'supported-cities': {
    type: 'object',
    properties: {
      cities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            country: { type: 'string' },
            lat: { type: 'number' },
            lon: { type: 'number' },
          },
        },
      },
    },
  },
  'station-metadata': {
    type: 'object',
    properties: {
      stationId: { type: 'string' },
      name: { type: 'string' },
      lastUpdated: { type: 'string', format: 'date-time' },
    },
  },
  'api-usage-guide': {
    type: 'string',
    description: 'Markdown usage instructions for the weather API.',
  },
};

function CapabilityDetails({
  capability,
  exists,
  canAdd,
  onAdd,
}: {
  capability: CapabilityDefinition;
  exists: boolean;
  canAdd: boolean;
  onAdd: () => void;
}) {
  const meta = kindMeta[capability.kind];
  const Icon = meta.icon;

  return (
    <section
      aria-live="polite"
      className={`interactive-capability-details ${meta.className}`}
    >
      <header>
        <span>
          <Icon aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">{meta.label.slice(0, -1)} details</p>
          <h4>{capability.name}</h4>
          <p>{capability.description}</p>
        </div>
      </header>

      {capability.kind === 'tool' && (
        <div className="interactive-detail-section">
          <strong>Input schema</strong>
          <div className="interactive-schema-list">
            {capability.fields.map((field) => (
              <div key={field.name}>
                <span>
                  <code>{field.name}</code>
                  <small>{field.description}</small>
                </span>
                <span className="interactive-schema-meta">
                  <b>{field.enumValues?.length ? 'enum' : field.type}</b>
                  <em>{field.required ? 'required' : 'optional'}</em>
                  {field.enumValues?.length && (
                    <small>Values: {field.enumValues.join(', ')}</small>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {capability.kind === 'resource' && (
        <div className="interactive-detail-section">
          <dl className="interactive-resource-details">
            <div>
              <dt>Resource URI</dt>
              <dd>
                <code>{capability.uri}</code>
              </dd>
            </div>
            <div>
              <dt>MIME type</dt>
              <dd>{capability.mimeType}</dd>
            </div>
          </dl>
          <strong>Schema / response preview</strong>
          <pre className="interactive-schema-preview">
            <JsonCode value={resourceResponsePreviews[capability.id]} />
          </pre>
        </div>
      )}

      {capability.kind === 'prompt' && (
        <div className="interactive-detail-section">
          <strong>Arguments</strong>
          <div className="interactive-argument-list">
            {capability.fields.map((field) => (
              <span key={field.name}>
                {field.name} <small>({field.type})</small>
              </span>
            ))}
          </div>
          <strong>Prompt template</strong>
          <pre className="interactive-prompt-preview">
            <code>{capability.template}</code>
          </pre>
        </div>
      )}

      <button
        className="button button--primary interactive-add-capability"
        disabled={!canAdd || exists}
        onClick={onAdd}
        type="button"
      >
        {exists ? (
          <CheckCircle2 aria-hidden="true" />
        ) : (
          <Plus aria-hidden="true" />
        )}
        {!canAdd
          ? 'Create server first'
          : exists
            ? 'Added to server'
            : 'Add to server'}
      </button>
    </section>
  );
}

function CapabilityScene({ kind }: { kind: CapabilityKind }) {
  const { state, definition, dispatch } = useInteractiveGuide();
  const meta = kindMeta[kind];
  const Icon = meta.icon;
  const options = definition.capabilities.filter((item) => item.kind === kind);
  const added = collectionFor(kind, state.server);
  const [selectedId, setSelectedId] = useState(options[0]?.id ?? '');
  const selected =
    options.find((option) => option.id === selectedId) ?? options[0];

  const headings: Record<CapabilityKind, [string, string]> = {
    tool: [
      'Available API capabilities',
      'Choose a predefined tool and review its input schema.',
    ],
    resource: [
      'Available data resources',
      'Choose a predefined resource and review what it exposes.',
    ],
    prompt: [
      'Available prompts',
      'Choose a predefined prompt and review its arguments and template.',
    ],
  };

  return (
    <div className="interactive-builder-layout">
      <ServerSummary />
      <aside className="interactive-library">
        <header>
          <div>
            <h3>{headings[kind][0]}</h3>
            <p>{headings[kind][1]}</p>
          </div>
          <Icon aria-hidden="true" />
        </header>
        {!state.server.created && (
          <div className="interactive-inline-note">
            <Info aria-hidden="true" /> Create your server in step 2 before
            adding capabilities.
          </div>
        )}
        <div className="interactive-library-list">
          {options.map((option) => {
            const exists = added.some((item) => item.id === option.id);
            const isSelected = selected?.id === option.id;
            return (
              <button
                aria-pressed={isSelected}
                className={isSelected ? 'is-selected' : undefined}
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                type="button"
              >
                <span className={meta.className}>
                  <Icon aria-hidden="true" />
                </span>
                <span>
                  <strong>{option.title}</strong>
                  <small>{option.description}</small>
                </span>
                {exists ? (
                  <CheckCircle2 aria-label="Added" />
                ) : isSelected ? (
                  <Circle aria-label="Selected" />
                ) : (
                  <Plus aria-label="Select" />
                )}
              </button>
            );
          })}
        </div>
        {selected && (
          <CapabilityDetails
            capability={selected}
            canAdd={state.server.created}
            exists={added.some((item) => item.id === selected.id)}
            onAdd={() =>
              dispatch({
                type: 'upsert-capability',
                capability: cloneCapability(selected),
              })
            }
          />
        )}
      </aside>
    </div>
  );
}

function CodeMode() {
  const { state } = useInteractiveGuide();
  const code = generateServerSource(state);
  const [copied, setCopied] = useState(false);
  const [formatted, setFormatted] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  const format = () => {
    setFormatted(true);
    window.setTimeout(() => setFormatted(false), 1600);
  };
  return (
    <section className="interactive-code-panel">
      <header>
        <div>
          <p className="eyebrow">Generated from your configuration</p>
          <h3>src/server.ts</h3>
        </div>
        <div className="interactive-code-actions">
          <button onClick={format} type="button">
            <Code2 aria-hidden="true" />
            {formatted ? 'Formatted' : 'Format'}
          </button>
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
        <Info aria-hidden="true" /> Read-only in this phase. Use Visual mode to
        change the server.
      </p>
    </section>
  );
}

function ProtocolMode() {
  const { state, dispatch } = useInteractiveGuide();
  const event =
    state.protocolEvents.find((item) => item.id === state.selectedEventId) ??
    state.protocolEvents[0];
  if (!event) {
    return (
      <section className="interactive-empty-state">
        <Radio aria-hidden="true" />
        <h3>No protocol messages yet</h3>
        <p>
          Connect the ATM learning client to generate a current 2026-07-28
          discovery exchange.
        </p>
      </section>
    );
  }
  return (
    <div className="interactive-protocol-layout">
      <nav aria-label="Protocol messages">
        <span>{state.protocolEvents.length} messages</span>
        {state.protocolEvents.map((item) => (
          <button
            className={item.id === event.id ? 'is-active' : undefined}
            key={item.id}
            onClick={() => dispatch({ type: 'select-event', eventId: item.id })}
            type="button"
          >
            <b>{item.sequence}</b>
            <span>
              <strong>{item.method}</strong>
              <small>{item.durationMs} ms · Simulated</small>
            </span>
          </button>
        ))}
      </nav>
      <section>
        <header>
          <div>
            <p className="eyebrow">Message {event.sequence}</p>
            <h3>{event.label}</h3>
          </div>
          <span className="interactive-status">
            <CheckCircle2 aria-hidden="true" /> Success
          </span>
        </header>
        <div className="interactive-json-grid">
          <JsonPanel label="Request" value={event.request} />
          <JsonPanel label="Response" value={event.response} />
        </div>
      </section>
    </div>
  );
}

function ClientMode({ scene }: { scene: InteractiveGuideScene }) {
  const { state, dispatch } = useInteractiveGuide();
  const [location, setLocation] = useState('London');
  const [unit, setUnit] = useState('celsius');
  const tool = state.server.tools[0];
  const resource = state.server.resources[0];
  const prompt = state.server.prompts[0];
  const connect = () => dispatch({ type: 'connect-client' });
  const run = () => {
    if (!tool) return;
    if (!state.clientConnected) connect();
    dispatch({ type: 'run-tool', toolName: tool.name, location, unit });
  };
  return (
    <div className="interactive-client-layout">
      <section className="interactive-client-conversation">
        <header>
          <div>
            <p className="eyebrow">ATM learning client</p>
            <h3>Test the protocol boundary</h3>
          </div>
          <span
            className={`interactive-status ${state.clientConnected ? 'is-success' : ''}`}
          >
            <Circle aria-hidden="true" />{' '}
            {state.clientConnected ? 'Connected to simulator' : 'Disconnected'}
          </span>
        </header>
        {!state.clientConnected ? (
          <div className="interactive-client-connect">
            <MonitorPlay aria-hidden="true" />
            <p>
              Connect to discover the capabilities currently exposed by your
              simulated server.
            </p>
            <button
              className="button button--primary"
              disabled={!state.server.created}
              onClick={connect}
              type="button"
            >
              Connect ATM client
            </button>
          </div>
        ) : (
          <>
            <div className="interactive-discovery-summary">
              <CheckCircle2 aria-hidden="true" />
              <span>
                <strong>Discovery complete</strong>
                <small>
                  {state.server.tools.length} tools ·{' '}
                  {state.server.resources.length} resources ·{' '}
                  {state.server.prompts.length} prompts
                </small>
              </span>
            </div>
            <div
              className="interactive-guided-commands"
              aria-label="Guided client commands"
            >
              {resource && (
                <button
                  onClick={() =>
                    dispatch({
                      type: 'read-resource',
                      resourceName: resource.name,
                    })
                  }
                  type="button"
                >
                  <Database aria-hidden="true" /> Read {resource.uri}
                </button>
              )}
              {prompt && (
                <button
                  onClick={() =>
                    dispatch({ type: 'get-prompt', promptName: prompt.name })
                  }
                  type="button"
                >
                  <MessageSquareText aria-hidden="true" /> Get {prompt.name}
                </button>
              )}
            </div>
            {(scene === 'test-server' || state.lastResult) && (
              <div className="interactive-command-form">
                <label>
                  <span>Location</span>
                  <input
                    onChange={(event) => setLocation(event.target.value)}
                    value={location}
                  />
                </label>
                <label>
                  <span>Unit</span>
                  <select
                    onChange={(event) => setUnit(event.target.value)}
                    value={unit}
                  >
                    <option value="celsius">Celsius</option>
                    <option value="fahrenheit">Fahrenheit</option>
                  </select>
                </label>
                <button
                  className="button button--primary"
                  disabled={!tool}
                  onClick={run}
                  type="button"
                >
                  <Play aria-hidden="true" /> Call {tool?.name ?? 'a tool'}
                </button>
              </div>
            )}
            {state.lastResult && (
              <div className="interactive-client-result">
                <span>
                  <Server aria-hidden="true" /> {state.server.name} response
                </span>
                <pre>{JSON.stringify(state.lastResult, null, 2)}</pre>
              </div>
            )}
          </>
        )}
      </section>
      <aside className="interactive-client-inspector">
        <p className="eyebrow">Inspector</p>
        <h3>Current exchange</h3>
        {state.protocolEvents.length ? (
          <JsonPanel
            label={state.protocolEvents.at(-1)?.method ?? 'Protocol'}
            value={state.protocolEvents.at(-1)?.response}
          />
        ) : (
          <p>Protocol details appear after the client connects.</p>
        )}
      </aside>
    </div>
  );
}

function downloadProject(
  state: ReturnType<typeof useInteractiveGuide>['state'],
) {
  const archive = createZipArchive(generateProjectFiles(state));
  const buffer = archive.buffer.slice(
    archive.byteOffset,
    archive.byteOffset + archive.byteLength,
  ) as ArrayBuffer;
  const url = URL.createObjectURL(
    new Blob([buffer], { type: 'application/zip' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${state.server.name || 'weather-server'}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function CompletionScene() {
  const { state, dispatch, reset } = useInteractiveGuide();
  const objectives = getGuideObjectives(state);
  const ready = objectives
    .filter((item) => item.stepId !== 'review-and-export')
    .every((item) => item.complete);
  return (
    <div className="interactive-completion">
      <header>
        <span className="interactive-completion-mark">
          <CheckCircle2 aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Review and export</p>
          <h3>Your first MCP server is configured</h3>
          <p>
            Review the browser-local simulation, download the project, and run
            it on your machine.
          </p>
        </div>
      </header>
      <div className="interactive-completion-grid">
        <ServerSummary readOnly />
        <section className="interactive-objectives">
          <h4>Guide objectives</h4>
          {objectives.map((objective) => (
            <p key={objective.stepId}>
              {objective.complete ? (
                <CheckCircle2 aria-hidden="true" />
              ) : (
                <Circle aria-hidden="true" />
              )}{' '}
              {objective.label}
            </p>
          ))}
        </section>
      </div>
      <div className="interactive-completion-actions">
        <button
          className="button button--primary"
          onClick={() => downloadProject(state)}
          type="button"
        >
          <Download aria-hidden="true" /> Download project
        </button>
        <button
          className="button button--secondary"
          disabled
          title="Available when the Workspace API launches"
          type="button"
        >
          Connect external client <span>Coming soon</span>
        </button>
        <button
          className="button button--secondary"
          disabled
          title="Available when the Workspace API launches"
          type="button"
        >
          Create hosted endpoint <span>Coming soon</span>
        </button>
      </div>
      <div className="interactive-finish-row">
        <button className="interactive-reset" onClick={reset} type="button">
          <RotateCcw aria-hidden="true" /> Reset simulation
        </button>
        <button
          className="button button--primary"
          disabled={!ready}
          onClick={() => dispatch({ type: 'finish' })}
          type="button"
        >
          {state.finished ? (
            <CheckCircle2 aria-hidden="true" />
          ) : (
            <Check aria-hidden="true" />
          )}
          {state.finished ? 'Guide complete' : 'Finish guide'}
        </button>
      </div>
    </div>
  );
}

function VisualMode({ scene }: { scene: InteractiveGuideScene }) {
  const kind = sceneKind(scene);
  if (scene === 'create-server') return <CreateServerScene />;
  if (kind) return <CapabilityScene kind={kind} />;
  if (scene === 'connect-client' || scene === 'test-server') {
    return <ClientMode scene={scene} />;
  }
  return <CompletionScene />;
}

export function InteractiveGuideBlock({
  scene,
}: {
  scene: InteractiveGuideScene;
}) {
  const initialMode: WorkspaceMode =
    scene === 'connect-client' || scene === 'test-server' ? 'client' : 'visual';
  const [mode, setMode] = useState<WorkspaceMode>(initialMode);
  const { state } = useInteractiveGuide();

  const content =
    mode === 'code' ? (
      <CodeMode />
    ) : mode === 'protocol' ? (
      <ProtocolMode />
    ) : mode === 'client' ? (
      <ClientMode scene={scene} />
    ) : (
      <VisualMode scene={scene} />
    );

  return (
    <section className="interactive-guide-block" data-scene={scene}>
      <header className="interactive-guide-block__header">
        <div>
          <span className="interactive-simulation-label">
            <Radio aria-hidden="true" /> Browser simulation
          </span>
          <small>{state.server.name} · MCP 2026-07-28</small>
        </div>
        <span>Changes are saved in this browser</span>
      </header>
      <WorkspaceTabs mode={mode} onChange={setMode} />
      <div className="interactive-guide-block__body">{content}</div>
    </section>
  );
}
