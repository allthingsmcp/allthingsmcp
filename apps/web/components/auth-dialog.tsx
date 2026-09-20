'use client';

import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  LogIn,
  Mail,
  UserRound,
  X,
} from 'lucide-react';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { authClient, authEnabled } from '@/lib/auth-client';
import { useHydrated } from '@/lib/use-hydrated';
import { cn } from '@/lib/utils';
import type { GuidePersistenceStatus } from '@/components/use-guide-progress';

type AuthReason = 'account' | 'progress' | 'simulator' | 'hosted';

type AuthDialogContextValue = {
  openAuth: (reason?: AuthReason) => void;
  closeAuth: () => void;
};

const AuthDialogContext = createContext<AuthDialogContextValue | null>(null);

const reasonCopy: Record<
  AuthReason,
  { eyebrow: string; title: string; body: string }
> = {
  account: {
    eyebrow: 'Your ATM account',
    title: 'Sign in or create an account',
    body: 'Continue with GitHub. If you’re new, your ATM account will be created automatically.',
  },
  progress: {
    eyebrow: 'Save your progress',
    title: 'Save your progress',
    body: 'Sign in or create an account to keep completed steps across reloads and devices.',
  },
  simulator: {
    eyebrow: 'Save Guide progress',
    title: 'Save your progress',
    body: 'Sign in or create an account to keep completed steps across reloads and devices.',
  },
  hosted: {
    eyebrow: 'Hosted Guide features',
    title: 'Sign in or create an account',
    body: 'Continue with GitHub. If you’re new, your ATM account will be created automatically.',
  },
};

function AuthDialog({
  open,
  reason,
  onClose,
}: {
  open: boolean;
  reason: AuthReason;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const { data: session, isPending } = authClient.useSession();
  const hydrated = useHydrated();
  const resolvedSession = hydrated ? session : null;
  const pending = !hydrated || isPending;
  const [error, setError] = useState<string>();
  const [subscribeToNewsletter, setSubscribeToNewsletter] = useState(true);
  const copy = reasonCopy[reason];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => primaryButtonRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function signIn() {
    setError(undefined);
    const result = await authClient.signIn.social({
      provider: 'github',
      callbackURL: window.location.href,
      newsletterOptIn: subscribeToNewsletter,
    });
    if (result.error) setError(result.error.message ?? 'Unable to sign in.');
  }

  async function signOut() {
    setError(undefined);
    const result = await authClient.signOut();
    if (result.error) setError(result.error.message ?? 'Unable to sign out.');
  }

  return (
    <dialog
      ref={dialogRef}
      className="auth-dialog"
      aria-labelledby="auth-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onClose={onClose}
    >
      <div className="auth-dialog__surface">
        <button
          className="auth-dialog__close"
          type="button"
          onClick={onClose}
          aria-label="Close account dialog"
        >
          <X aria-hidden="true" />
        </button>
        <span className="auth-dialog__icon">
          {resolvedSession ? (
            <UserRound aria-hidden="true" />
          ) : (
            <Cloud aria-hidden="true" />
          )}
        </span>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="auth-dialog-title">
          {session ? 'You’re signed in' : copy.title}
        </h2>
        {resolvedSession ? (
          <>
            <p>
              Signed in as{' '}
              <strong>
                {resolvedSession.user.name || resolvedSession.user.email}
              </strong>
              . The server can now associate durable Guide runs with your
              account.
            </p>
            <button
              ref={primaryButtonRef}
              className="button button--secondary auth-dialog__action"
              type="button"
              onClick={signOut}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <p>{copy.body}</p>
            <label className="auth-dialog__newsletter">
              <input
                type="checkbox"
                checked={subscribeToNewsletter}
                onChange={(event) =>
                  setSubscribeToNewsletter(event.currentTarget.checked)
                }
              />
              <span className="auth-dialog__newsletter-icon">
                <Mail aria-hidden="true" />
              </span>
              <span>
                <strong>Keep me ahead of MCP</strong>
                <small>
                  Get practical guides, important spec changes, and no filler.
                </small>
              </span>
            </label>
            <button
              ref={primaryButtonRef}
              className="button button--primary auth-dialog__action"
              type="button"
              disabled={!authEnabled || pending}
              onClick={signIn}
            >
              <LogIn aria-hidden="true" />
              {pending ? 'Checking session…' : 'Continue with GitHub'}
            </button>
            {!authEnabled && (
              <p className="auth-dialog__configuration">
                Authentication is not configured in this environment yet.
              </p>
            )}
          </>
        )}
        {error && (
          <p className="auth-dialog__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </dialog>
  );
}

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [reason, setReason] = useState<AuthReason>('account');
  const [open, setOpen] = useState(false);

  return (
    <AuthDialogContext.Provider
      value={{
        openAuth(nextReason = 'account') {
          setReason(nextReason);
          setOpen(true);
        },
        closeAuth() {
          setOpen(false);
        },
      }}
    >
      {children}
      <AuthDialog open={open} reason={reason} onClose={() => setOpen(false)} />
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog() {
  const context = useContext(AuthDialogContext);
  if (!context) throw new Error('useAuthDialog requires AuthDialogProvider.');
  return context;
}

export function AuthTrigger({ className }: { className?: string }) {
  const { openAuth } = useAuthDialog();
  const { data: session, isPending } = authClient.useSession();
  const hydrated = useHydrated();
  const resolvedSession = hydrated ? session : null;
  const pending = !hydrated || isPending;
  return (
    <button
      className={cn(
        'auth-trigger',
        resolvedSession && 'is-authenticated',
        className,
      )}
      type="button"
      onClick={() => openAuth('account')}
      aria-label={
        resolvedSession
          ? `Account for ${resolvedSession.user.name || resolvedSession.user.email}`
          : 'Sign in'
      }
    >
      <UserRound aria-hidden="true" />
      <span>
        {pending
          ? 'Account'
          : resolvedSession
            ? resolvedSession.user.name?.split(' ')[0] || 'Account'
            : 'Sign in'}
      </span>
    </button>
  );
}

export function AuthNudge({
  reason = 'progress',
  label = 'Sign in to save progress',
  tone = 'light',
  className,
}: {
  reason?: AuthReason;
  label?: string;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const { openAuth } = useAuthDialog();
  const { data: session, isPending } = authClient.useSession();
  const hydrated = useHydrated();
  if (!hydrated || isPending) return null;
  if (session) {
    return (
      <span className={cn('auth-status', `auth-status--${tone}`, className)}>
        <Cloud aria-hidden="true" /> Account connected
      </span>
    );
  }
  return (
    <button
      className={cn('auth-nudge', `auth-nudge--${tone}`, className)}
      type="button"
      onClick={() => openAuth(reason)}
    >
      <Cloud aria-hidden="true" /> {label}
    </button>
  );
}

const progressStatusCopy: Record<
  Exclude<GuidePersistenceStatus, 'temporary'>,
  string
> = {
  loading: 'Loading saved progress…',
  saving: 'Saving progress…',
  saved: 'Progress saved to your account',
  error: 'Progress could not be saved',
};

export function GuideProgressStatus({
  status,
  tone = 'light',
  className,
}: {
  status: GuidePersistenceStatus;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const { openAuth } = useAuthDialog();
  const { data: session, isPending } = authClient.useSession();
  const hydrated = useHydrated();

  if (!hydrated || isPending || status === 'loading') {
    return (
      <span className={cn('auth-status', `auth-status--${tone}`, className)}>
        <Cloud aria-hidden="true" /> Checking saved progress…
      </span>
    );
  }

  if (!session || status === 'temporary') {
    return (
      <button
        className={cn('auth-nudge', `auth-nudge--${tone}`, className)}
        type="button"
        onClick={() => openAuth('progress')}
      >
        <Cloud aria-hidden="true" /> Sign in to save progress
      </button>
    );
  }

  const Icon =
    status === 'saved'
      ? CheckCircle2
      : status === 'error'
        ? AlertCircle
        : Cloud;
  return (
    <span
      className={cn(
        'auth-status',
        `auth-status--${tone}`,
        status === 'error' && 'is-error',
        className,
      )}
      role={status === 'error' ? 'alert' : undefined}
    >
      <Icon aria-hidden="true" /> {progressStatusCopy[status]}
    </span>
  );
}
