import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Database,
  Info,
  MessageSquareText,
  MonitorPlay,
  Plus,
  Server,
  Wrench,
} from 'lucide-react';
import { useInteractiveGuide } from '@/components/interactive-guide-context';
import {
  cloneCapability,
  validateServerName,
  type CapabilityDefinition,
  type CapabilityKind,
  type InteractiveGuideScene,
} from '@/lib/interactive-guides';
import {
  kindMeta,
  collectionFor,
  sceneKind,
} from '@/components/interactive-guide/shared';
import { JsonCode } from '@/components/interactive-guide/code-views';
import { ServerSummary } from '@/components/interactive-guide/workspace-chrome';
import { ClientMode } from '@/components/interactive-guide/client-mode';
import { CompletionScene } from '@/components/interactive-guide/completion-scene';

export function CreateServerScene() {
  const { state, dispatch, runtimeBusy, claimConflict, runtimeStatus } =
    useInteractiveGuide();
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
          disabled={
            !!error ||
            runtimeBusy ||
            claimConflict ||
            runtimeStatus === 'expired'
          }
          onClick={() => dispatch({ type: 'create-server', name })}
          type="button"
        >
          <Plus aria-hidden="true" />
          {state.server.created ? 'Update server' : 'Create server'}
        </button>
        {state.server.created && (
          <span className="interactive-status is-success" role="status">
            <CheckCircle2 aria-hidden="true" /> Runtime workspace ready
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

export const resourceResponsePreviews: Record<
  string,
  Record<string, unknown>
> = {
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

export function CapabilityDetails({
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
          <pre
            className="interactive-schema-preview"
            tabIndex={0}
            aria-label={`${capability.title} schema and response preview`}
          >
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

export function CapabilityScene({ kind }: { kind: CapabilityKind }) {
  const { state, definition, dispatch, runtimeBusy, claimConflict } =
    useInteractiveGuide();
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
            canAdd={state.server.created && !runtimeBusy && !claimConflict}
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

export function VisualMode({ scene }: { scene: InteractiveGuideScene }) {
  const kind = sceneKind(scene);
  if (scene === 'create-server') return <CreateServerScene />;
  if (kind) return <CapabilityScene kind={kind} />;
  if (scene === 'connect-client' || scene === 'test-server') {
    return <ClientMode scene={scene} />;
  }
  return <CompletionScene />;
}
