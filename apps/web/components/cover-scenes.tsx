import type { CSSProperties } from 'react';
import type { CoverSceneId } from '@/lib/cover-scene-ids';

const TOTAL_THUMBNAILS = 18;
const DONE_AT_REST = 6;

/**
 * An MCP task in flight: the client starts it with tools/call, the task
 * record reports progress, and the result arrives when it completes.
 * Lays itself out by the cover's width and finishes the batch on hover.
 */
function TasksScene() {
  return (
    <figure className="tasks-scene">
      <span className="tasks-scene__rail" />
      <span className="tasks-scene__node tasks-scene__node--client">
        MCP client
      </span>
      <span className="tasks-scene__edge">tools/call</span>
      <div className="tasks-scene__card">
        <code className="tasks-scene__type">resultType: &quot;task&quot;</code>
        <span className="tasks-scene__status">
          status: <b className="tasks-scene__working">working</b>
          <b className="tasks-scene__completed">completed</b>
        </span>
        <span className="tasks-scene__cells">
          {Array.from({ length: TOTAL_THUMBNAILS }, (_, index) => (
            <i
              key={index}
              className={index < DONE_AT_REST ? 'is-done' : undefined}
              style={
                { '--i': Math.max(0, index - DONE_AT_REST) } as CSSProperties
              }
            />
          ))}
        </span>
        <span className="tasks-scene__message">
          Created <span className="tasks-scene__working">{DONE_AT_REST}</span>
          <span className="tasks-scene__completed">
            {TOTAL_THUMBNAILS}
          </span> of {TOTAL_THUMBNAILS} thumbnails
        </span>
      </div>
      <span className="tasks-scene__edge tasks-scene__edge--result">
        result
      </span>
      <span className="tasks-scene__node tasks-scene__node--done">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 8.5l3.2 3L13 4.5" />
        </svg>
        completed
      </span>
    </figure>
  );
}

/**
 * One MCP tool call: an AI app asks a server's tool a question and the
 * result comes back. The request and result read at rest; hover lands it.
 */
function ToolCallScene() {
  return (
    <figure className="call-scene">
      <span className="call-scene__rail" />
      <span className="call-scene__node call-scene__node--app">AI app</span>
      <span className="call-scene__edge" />
      <div className="call-scene__card">
        <span className="call-scene__row call-scene__row--request">
          <b>→ tools/call</b> get_forecast
        </span>
        <span className="call-scene__args">location: &quot;Lagos&quot;</span>
        <span className="call-scene__row call-scene__row--result">
          <b>
            ← <span className="call-scene__method">result</span>
          </b>{' '}
          &quot;80% chance of rain&quot;
        </span>
      </div>
      <span className="call-scene__edge" />
      <span className="call-scene__node call-scene__node--server">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 1.5l5.6 3.25v6.5L8 14.5l-5.6-3.25v-6.5z" />
        </svg>
        MCP server
      </span>
    </figure>
  );
}

/**
 * Building a first MCP server: the weather server starts with one tool,
 * and hover registers the resource and prompt the guide adds next.
 */
function ServerBuildScene() {
  const rows = [
    { kind: 'tools', name: 'get_forecast', on: true },
    { kind: 'resources', name: 'city_list', on: false },
    { kind: 'prompts', name: 'plan_trip', on: false },
  ];
  return (
    <figure className="build-scene">
      <div className="build-scene__card">
        <code className="build-scene__head">weather-server</code>
        {rows.map((row, index) => (
          <span
            key={row.kind}
            className={row.on ? 'build-scene__row is-on' : 'build-scene__row'}
            style={{ '--i': index } as CSSProperties}
          >
            <i aria-hidden="true" />
            <b>{row.kind}</b>
            {row.name}
          </span>
        ))}
      </div>
    </figure>
  );
}

export const coverScenes: Record<CoverSceneId, () => React.JSX.Element> = {
  tasks: TasksScene,
  'tool-call': ToolCallScene,
  'server-build': ServerBuildScene,
};
