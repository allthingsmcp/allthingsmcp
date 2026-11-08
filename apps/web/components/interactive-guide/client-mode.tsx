import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Database,
  MessageSquareText,
  MonitorPlay,
  Play,
  Server,
} from 'lucide-react';
import { useInteractiveGuide } from '@/components/interactive-guide-context';
import { type InteractiveGuideScene } from '@/lib/interactive-guides';
import { JsonPanel } from '@/components/interactive-guide/code-views';

export function ClientMode({ scene }: { scene: InteractiveGuideScene }) {
  const { state, dispatch, runtimeBusy, runtimeStatus, claimConflict } =
    useInteractiveGuide();
  const [location, setLocation] = useState('London');
  const [unit, setUnit] = useState('celsius');
  const [day, setDay] = useState('Monday');
  const [toolId, setToolId] = useState('');
  const tool =
    state.server.tools.find((item) => item.id === toolId) ??
    state.server.tools[0];
  const prompt = state.server.prompts[0];
  const disabled =
    runtimeBusy ||
    runtimeStatus === 'paused' ||
    runtimeStatus === 'expired' ||
    claimConflict;
  const connect = () => dispatch({ type: 'connect-client' });
  const run = () => {
    if (!tool) return;
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
            {state.clientConnected
              ? 'Connected to Guide Runtime'
              : 'Disconnected'}
          </span>
        </header>
        {!state.clientConnected ? (
          <div className="interactive-client-connect">
            <MonitorPlay aria-hidden="true" />
            <p>
              Connect to discover the capabilities currently exposed by your MCP
              server.
            </p>
            <button
              className="button button--primary"
              disabled={!state.server.created || disabled}
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
              {state.server.resources.map((resource) => (
                <button
                  key={resource.id}
                  disabled={disabled}
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
              ))}
              {prompt && (
                <button
                  disabled={disabled || !location.trim() || !day.trim()}
                  onClick={() =>
                    dispatch({
                      type: 'get-prompt',
                      promptName: prompt.name,
                      arguments: { city: location.trim(), day: day.trim() },
                    })
                  }
                  type="button"
                >
                  <MessageSquareText aria-hidden="true" /> Get {prompt.name}
                </button>
              )}
            </div>
            {(scene === 'test-server' || state.lastResult || prompt) && (
              <div className="interactive-command-form">
                {state.server.tools.length > 1 && (
                  <label>
                    <span>Tool</span>
                    <select
                      value={tool?.id ?? ''}
                      onChange={(event) => setToolId(event.target.value)}
                    >
                      {state.server.tools.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  <span>
                    {tool?.name === 'search_locations'
                      ? 'Search query'
                      : 'Location'}
                  </span>
                  <input
                    onChange={(event) => setLocation(event.target.value)}
                    value={location}
                  />
                </label>
                {tool?.fields.some((field) => field.name === 'unit') && (
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
                )}
                {prompt && (
                  <label>
                    <span>Day</span>
                    <input
                      value={day}
                      onChange={(event) => setDay(event.target.value)}
                    />
                  </label>
                )}
                <button
                  className="button button--primary"
                  disabled={!tool || disabled || !location.trim()}
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
