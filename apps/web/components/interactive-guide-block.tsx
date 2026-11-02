'use client';

import { useState } from 'react';
import { Info, Radio } from 'lucide-react';
import { useInteractiveGuide } from '@/components/interactive-guide-context';
import { GuideProgressStatus } from '@/components/auth-dialog';
import type { InteractiveGuideScene } from '@/lib/interactive-guides';
import { WorkspaceMode } from '@/components/interactive-guide/shared';
import { WorkspaceTabs } from '@/components/interactive-guide/workspace-chrome';
import { VisualMode } from '@/components/interactive-guide/visual-mode';
import { CodeMode } from '@/components/interactive-guide/code-mode';
import { ProtocolMode } from '@/components/interactive-guide/protocol-mode';
import { ClientMode } from '@/components/interactive-guide/client-mode';

export function InteractiveGuideBlock({
  scene,
}: {
  scene: InteractiveGuideScene;
}) {
  const initialMode: WorkspaceMode =
    scene === 'connect-client' || scene === 'test-server' ? 'client' : 'visual';
  const [mode, setMode] = useState<WorkspaceMode>(initialMode);
  const {
    state,
    progressPersistence,
    runtimeStatus,
    runtimeBusy,
    runtimeError,
    workspace,
    retryRuntime,
    reset,
    claimConflict,
    resolveClaimConflict,
  } = useInteractiveGuide();

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
            <Radio aria-hidden="true" /> Real MCP runtime
          </span>
          <small>{state.server.name} · MCP 2026-07-28</small>
        </div>
        <div className="interactive-save-status">
          <span>
            {runtimeStatus === 'loading'
              ? 'Loading workspace…'
              : runtimeStatus === 'error'
                ? 'Request failed'
                : runtimeStatus === 'expired'
                  ? 'Workspace expired'
                  : runtimeStatus === 'executing'
                    ? 'Executing real MCP request…'
                    : runtimeStatus === 'saving'
                      ? 'Saving workspace…'
                      : runtimeStatus === 'paused'
                        ? 'Endpoint paused'
                        : workspace
                          ? 'Workspace persisted'
                          : 'Ready to create'}
          </span>
          <GuideProgressStatus status={progressPersistence} />
        </div>
      </header>
      <WorkspaceTabs mode={mode} onChange={setMode} />
      {runtimeError ? (
        <div role="alert">
          <p>{runtimeError}</p>
          <button
            type="button"
            disabled={runtimeBusy}
            onClick={
              runtimeStatus === 'expired' && (!workspace || workspace.anonymous)
                ? reset
                : retryRuntime
            }
          >
            {runtimeStatus === 'expired' && (!workspace || workspace.anonymous)
              ? 'Start a new workspace'
              : 'Retry connection'}
          </button>
        </div>
      ) : null}
      {claimConflict ? (
        <div role="alert">
          <p>You already have a saved workspace for this guide.</p>
          <button
            type="button"
            disabled={runtimeBusy}
            onClick={() => void resolveClaimConflict('resume-saved')}
          >
            Resume saved
          </button>
          <button
            type="button"
            disabled={runtimeBusy}
            onClick={() => void resolveClaimConflict('replace-with-current')}
          >
            Replace with current
          </button>
        </div>
      ) : null}
      <div className="interactive-guide-block__body">{content}</div>
      <p className="interactive-inline-note">
        <Info aria-hidden="true" />
        <a href="https://open-meteo.com/">Weather data by Open-Meteo</a> · CC BY
        4.0
      </p>
    </section>
  );
}
