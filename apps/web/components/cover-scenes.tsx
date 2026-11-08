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

export const coverScenes: Record<CoverSceneId, () => React.JSX.Element> = {
  tasks: TasksScene,
};
