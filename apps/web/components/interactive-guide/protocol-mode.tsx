import { CheckCircle2, FileJson2, Info, Radio } from 'lucide-react';
import { useInteractiveGuide } from '@/components/interactive-guide-context';
import { type ProtocolEvent } from '@/lib/interactive-guides';
import { JsonPanel } from '@/components/interactive-guide/code-views';

export type ProtocolLesson = {
  summary: string;
  notices: Array<{ label: string; detail: string }>;
};

export function protocolLesson(event: ProtocolEvent): ProtocolLesson {
  if (event.status === 'error') {
    return {
      summary:
        'The server could not complete this request, so it returned a JSON-RPC error instead of a result.',
      notices: [
        {
          label: 'Method',
          detail: `The request still identifies the intended operation as ${event.method}.`,
        },
        {
          label: 'Error',
          detail:
            'The response contains an error code and a message that the client can inspect.',
        },
        {
          label: 'Request ID',
          detail:
            'The matching ID lets the client associate this error with its original request.',
        },
      ],
    };
  }

  const lessons: Record<string, ProtocolLesson> = {
    'server/discover': {
      summary:
        'The ATM client discovers the server identity, protocol version, and capability families before making feature requests.',
      notices: [
        {
          label: 'Method',
          detail:
            'server/discover identifies this as a modern protocol discovery request.',
        },
        {
          label: 'Metadata',
          detail:
            'The request identifies the client and the protocol version it understands.',
        },
        {
          label: 'Capabilities',
          detail:
            'The result advertises which server feature families the client may use.',
        },
      ],
    },
    'tools/list': {
      summary:
        'The client asks which callable tools the server currently exposes.',
      notices: [
        {
          label: 'Method',
          detail: 'tools/list requests the server’s current tool catalogue.',
        },
        {
          label: 'Descriptors',
          detail:
            'A real listing describes each tool and its input schema, not merely its name.',
        },
        {
          label: 'No execution',
          detail:
            'Listing a tool only discovers it; the client has not invoked anything yet.',
        },
      ],
    },
    'resources/list': {
      summary:
        'The client asks which readable resources are available from the server.',
      notices: [
        {
          label: 'Method',
          detail: 'resources/list discovers the server’s resource catalogue.',
        },
        {
          label: 'URI',
          detail:
            'Each resource is addressed by a URI that can later be passed to resources/read.',
        },
        {
          label: 'Read boundary',
          detail:
            'Discovery describes resources; their content is returned only when one is read.',
        },
      ],
    },
    'prompts/list': {
      summary:
        'The client discovers reusable prompt templates offered by the server.',
      notices: [
        {
          label: 'Method',
          detail: 'prompts/list requests the available prompt templates.',
        },
        {
          label: 'Arguments',
          detail:
            'Prompt descriptors tell clients which values a template expects.',
        },
        {
          label: 'Template',
          detail:
            'The populated messages are returned later through prompts/get.',
        },
      ],
    },
    'tools/call': {
      summary:
        'The client invokes one named tool with explicit arguments, and the server returns the handler result.',
      notices: [
        {
          label: 'Method',
          detail: 'tools/call tells the server to invoke a tool.',
        },
        {
          label: 'Arguments',
          detail:
            'The params identify the tool and provide values that match its input schema.',
        },
        {
          label: 'Result',
          detail:
            'The response contains model-readable content and a structured result for the client.',
        },
      ],
    },
    'resources/read': {
      summary:
        'The client reads one resource by URI and receives its content and media type.',
      notices: [
        {
          label: 'Method',
          detail:
            'resources/read requests the content behind one resource URI.',
        },
        {
          label: 'Address',
          detail:
            'The URI in params identifies exactly which resource to read.',
        },
        {
          label: 'Contents',
          detail:
            'The result can contain one or more content entries with their URI and MIME type.',
        },
      ],
    },
    'prompts/get': {
      summary:
        'The client supplies prompt arguments and receives the populated messages.',
      notices: [
        {
          label: 'Method',
          detail: 'prompts/get selects one prompt template by name.',
        },
        {
          label: 'Arguments',
          detail:
            'Runtime values are passed separately from the reusable template definition.',
        },
        {
          label: 'Messages',
          detail:
            'The result contains the messages the client can present or send to a model.',
        },
      ],
    },
  };

  return (
    lessons[event.method] ?? {
      summary:
        'This JSON-RPC exchange pairs one client request with the server response that carries the same request ID.',
      notices: [
        {
          label: 'Method',
          detail: `${event.method} identifies the operation the client requested.`,
        },
        {
          label: 'Request',
          detail:
            'The request contains the method and any operation parameters.',
        },
        {
          label: 'Response',
          detail: 'The response returns either a result or a structured error.',
        },
      ],
    }
  );
}

export function ProtocolLearningPanel({ event }: { event: ProtocolEvent }) {
  const lesson = protocolLesson(event);

  return (
    <aside
      aria-label="Protocol exchange explanation"
      aria-live="polite"
      className="interactive-learning-panel"
    >
      <header>
        <div>
          <p className="eyebrow">About this exchange</p>
          <h3>{event.method}</h3>
        </div>
        <Info aria-hidden="true" />
      </header>
      <p>{lesson.summary}</p>

      <section>
        <h4>What to notice</h4>
        <div className="interactive-learning-list">
          {lesson.notices.map((notice, index) => (
            <div key={notice.label}>
              <span className="is-protocol" aria-hidden="true">
                {index + 1}
              </span>
              <span>
                <strong>{notice.label}</strong>
                <small>{notice.detail}</small>
              </span>
            </div>
          ))}
        </div>
      </section>

      <a
        href="https://modelcontextprotocol.io/specification/2026-07-28"
        rel="noreferrer"
        target="_blank"
      >
        View the 2026-07-28 specification
        <FileJson2 aria-hidden="true" />
      </a>
    </aside>
  );
}

export function ProtocolMode() {
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
    <div className="interactive-protocol-shell">
      <div className="interactive-protocol-layout">
        <nav aria-label="Protocol messages">
          <span>{state.protocolEvents.length} messages</span>
          {state.protocolEvents.map((item) => (
            <button
              className={item.id === event.id ? 'is-active' : undefined}
              key={item.id}
              onClick={() =>
                dispatch({ type: 'select-event', eventId: item.id })
              }
              type="button"
            >
              <b>{item.sequence}</b>
              <span>
                <strong>{item.method}</strong>
                <small>{item.durationMs.toFixed(1)} ms · Guide Runtime</small>
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
              {event.status === 'error' ? (
                <Info aria-hidden="true" />
              ) : (
                <CheckCircle2 aria-hidden="true" />
              )}{' '}
              {event.status === 'error' ? 'Error' : 'Success'}
            </span>
          </header>
          <div className="interactive-json-grid">
            <JsonPanel label="Request" value={event.request} />
            <JsonPanel label="Response" value={event.response} />
          </div>
        </section>
      </div>
      <ProtocolLearningPanel event={event} />
    </div>
  );
}
