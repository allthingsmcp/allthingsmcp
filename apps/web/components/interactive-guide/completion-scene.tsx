import { useState } from 'react';
import { Check, CheckCircle2, Circle, Download, RotateCcw } from 'lucide-react';
import { useInteractiveGuide } from '@/components/interactive-guide-context';
import { AuthNudge } from '@/components/auth-dialog';
import {
  generateProjectFiles,
  getGuideObjectives,
} from '@/lib/interactive-guides';
import { createZipArchive } from '@/lib/zip';
import { ServerSummary } from '@/components/interactive-guide/workspace-chrome';

export function downloadProject(
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

export function CompletionScene() {
  const {
    state,
    dispatch,
    reset,
    workspace,
    runtimeBusy,
    runtimeStatus,
    issueExternalToken,
    revokeExternalToken,
    setWorkspacePaused,
  } = useInteractiveGuide();
  const [access, setAccess] = useState<{
    token: string;
    endpoint: string;
  } | null>(null);
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
            Review the real MCP exchanges, download the project, or connect an
            external client to your signed-in workspace.
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
        {workspace && !workspace.anonymous && (
          <>
            <button
              className="button button--secondary"
              disabled={runtimeBusy}
              onClick={() =>
                void issueExternalToken().then(
                  (value) => value && setAccess(value),
                )
              }
              type="button"
            >
              {access ? 'Rotate access token' : 'Create access token'}
            </button>
            <button
              className="button button--secondary"
              disabled={runtimeBusy}
              onClick={() =>
                void setWorkspacePaused(workspace?.status !== 'paused')
              }
              type="button"
            >
              {workspace?.status === 'paused'
                ? 'Resume endpoint'
                : 'Pause endpoint'}
            </button>
            {access ? (
              <button
                className="button button--secondary"
                disabled={runtimeBusy}
                onClick={() =>
                  void revokeExternalToken().then(
                    (revoked) => revoked && setAccess(null),
                  )
                }
                type="button"
              >
                Revoke token
              </button>
            ) : null}
          </>
        )}
      </div>
      {access ? (
        <div role="status">
          <p>
            <strong>Endpoint:</strong> <code>{access.endpoint}</code>
          </p>
          <p>
            <strong>Bearer token (shown once):</strong>{' '}
            <code>{access.token}</code>
          </p>
        </div>
      ) : null}
      <AuthNudge
        className="interactive-cloud-requirement"
        reason="hosted"
        label="Why hosted features require an account"
      />
      <div className="interactive-finish-row">
        <button
          className="interactive-reset"
          disabled={runtimeBusy}
          onClick={reset}
          type="button"
        >
          <RotateCcw aria-hidden="true" /> Reset guide
        </button>
        <button
          className="button button--primary"
          disabled={!ready || runtimeBusy || runtimeStatus !== 'ready'}
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
