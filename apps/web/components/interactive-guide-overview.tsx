import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Clock3,
  Database,
  HardDrive,
  MessageSquareText,
  MonitorPlay,
  Server,
  Wrench,
} from 'lucide-react';
import type { ReactNode } from 'react';

function GuideBuildCard({
  title,
  note,
  icon,
  diagram,
  learning,
}: {
  title: string;
  note: ReactNode;
  icon: ReactNode;
  diagram: ReactNode;
  learning: string[];
}) {
  return (
    <section className="shell interactive-guide-enhancement">
      <div className="interactive-overview-outcome">
        <header>
          <span>{icon}</span>
          <div>
            <p className="eyebrow">You’ll build</p>
            <h2>{title}</h2>
          </div>
          <p className="interactive-enhancement-note">{note}</p>
        </header>
        <div className="interactive-enhancement-grid">
          {diagram}
          <section className="interactive-overview-learn">
            <h3>You’ll learn</h3>
            {learning.map((item) => (
              <p key={item}>
                <CheckCircle2 aria-hidden="true" /> {item}
              </p>
            ))}
          </section>
        </div>
      </div>
    </section>
  );
}

export function InteractiveGuideEnhancement() {
  return (
    <GuideBuildCard
      title="A configurable weather MCP server"
      note={
        <>
          <MonitorPlay aria-hidden="true" /> Live MCP workspace
        </>
      }
      icon={<Server aria-hidden="true" />}
      learning={[
        'How MCP participants fit together',
        'How tools, resources, and prompts differ',
        'How current protocol messages flow',
        'How to test and export a real TypeScript project',
      ]}
      diagram={
        <div
          className="interactive-overview-diagram"
          role="img"
          aria-label="An ATM client connects over Streamable HTTP to a weather MCP server with tools, resources, and prompts."
        >
          <span className="interactive-node is-client">
            <MonitorPlay aria-hidden="true" /> ATM client
          </span>
          <i>Streamable HTTP →</i>
          <span className="interactive-node is-server">
            <Server aria-hidden="true" /> Weather MCP server
          </span>
          <div>
            <span className="is-tool">
              <Wrench aria-hidden="true" /> Tools
            </span>
            <span className="is-resource">
              <Database aria-hidden="true" /> Resources
            </span>
            <span className="is-prompt">
              <MessageSquareText aria-hidden="true" /> Prompts
            </span>
          </div>
        </div>
      }
    />
  );
}

export function TasksGuideEnhancement() {
  return (
    <GuideBuildCard
      title="An MCP Task for image batches"
      note={
        <>
          <HardDrive aria-hidden="true" /> Local runnable project
        </>
      }
      icon={<Clock3 aria-hidden="true" />}
      learning={[
        'How the MCP server returns a task handle',
        'How the MCP client polls and reconnects by task ID',
        'Where the worker and local task store fit',
        'How cancellation and tool errors appear',
      ]}
      diagram={
        <div className="tasks-overview-diagram">
          <div
            className="tasks-overview-participant is-client"
            aria-hidden="true"
          >
            <MonitorPlay aria-hidden="true" />
            <strong>MCP client</strong>
            <span>Declares Tasks support</span>
          </div>
          <div className="tasks-overview-exchange" aria-hidden="true">
            <p>
              <span>tools/call</span>
              <ArrowRight className="desktop-arrow" aria-hidden="true" />
              <ArrowDown className="mobile-arrow" aria-hidden="true" />
            </p>
            <p>
              <ArrowLeft className="desktop-arrow" aria-hidden="true" />
              <ArrowUp className="mobile-arrow" aria-hidden="true" />
              <span>task ID</span>
            </p>
            <p>
              <span>tasks/get</span>
              <ArrowRight className="desktop-arrow" aria-hidden="true" />
              <ArrowDown className="mobile-arrow" aria-hidden="true" />
            </p>
            <p>
              <ArrowLeft className="desktop-arrow" aria-hidden="true" />
              <ArrowUp className="mobile-arrow" aria-hidden="true" />
              <span>status + final result</span>
            </p>
            <small>Streamable HTTP</small>
          </div>
          <div className="tasks-overview-server" aria-hidden="true">
            <div className="tasks-overview-participant is-server">
              <Server aria-hidden="true" />
              <strong>MCP server</strong>
              <span>Runs the image batch</span>
            </div>
            <div className="tasks-overview-server-parts">
              <span>
                <Wrench aria-hidden="true" /> create_thumbnails
              </span>
              <span>
                <Clock3 aria-hidden="true" /> Task worker
              </span>
              <span>
                <Database aria-hidden="true" /> Local task store
              </span>
            </div>
          </div>
          <p className="sr-only">
            The MCP client declares Tasks support and calls create_thumbnails.
            The MCP server saves a task in its local store, starts the worker,
            and returns a task ID. The client uses tasks/get to retrieve status
            and the eventual result over Streamable HTTP.
          </p>
        </div>
      }
    />
  );
}
