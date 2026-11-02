import {
  ArrowLeftRight,
  Circle,
  Code2,
  FileJson2,
  MonitorPlay,
  Server,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useInteractiveGuide } from '@/components/interactive-guide-context';
import {
  WorkspaceMode,
  kindMeta,
  collectionFor,
} from '@/components/interactive-guide/shared';

export function WorkspaceTabs({
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

export function ServerSummary({ readOnly = false }: { readOnly?: boolean }) {
  const { state, dispatch, runtimeBusy, claimConflict } = useInteractiveGuide();
  return (
    <section className="interactive-server-summary">
      <header>
        <span className="interactive-server-icon">
          <Server aria-hidden="true" />
        </span>
        <div>
          <strong>{state.server.name}</strong>
          <small>
            {state.server.created
              ? 'Runtime workspace ready'
              : 'Not created yet'}
          </small>
        </div>
        <span className="interactive-status">
          <Circle aria-hidden="true" /> Live runtime
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
                            disabled={runtimeBusy || claimConflict}
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
