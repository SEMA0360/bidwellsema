import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogOut, LockKeyhole, MoreHorizontal } from 'lucide-react';
import Uploader from '@/components/Uploader';
import Dashboard from '@/components/Dashboard';
import { analyzeFile } from '@/lib/analysis';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { AnalysisResult, SavedAnalysis } from '@/types';

function App() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'sign_in' | 'sign_up' | 'forgot_password' | 'reset_password'>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [savedAnalysesLoading, setSavedAnalysesLoading] = useState(false);
  const [hasPaidPlan, setHasPaidPlan] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [persistenceError, setPersistenceError] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const sessionUserId = session?.user.id;

  useEffect(() => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'dashboard') {
      setResult(analyzeFile('Dashboard preview - sample data.pdf', 0));
      setPreviewMode(true);
    }
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'dashboard') {
      setAuthLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;
    const timeout = window.setTimeout(() => {
      if (!mounted) return;
      setAuthError('Session check timed out. You can still sign in, and we’ll keep checking in the background.');
      setAuthLoading(false);
    }, 10_000);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (mounted) {
        window.clearTimeout(timeout);
        if (event === 'PASSWORD_RECOVERY') {
          setAuthMode('reset_password');
          setAuthError('');
          setAuthMessage('');
        } else {
          setAuthError('');
        }
        setSession(nextSession);
        setAuthLoading(false);
      }
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      if (mounted) {
        setSession(data.session);
        setAuthError('');
      }
    }).catch((error: unknown) => {
      if (mounted) setAuthError(error instanceof Error ? error.message : 'Unable to check your session.');
    }).finally(() => {
      window.clearTimeout(timeout);
      if (mounted) setAuthLoading(false);
    });

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!sessionUserId) {
      setSavedAnalyses([]);
      setHasPaidPlan(false);
      if (!previewMode) {
        setResult(null);
        setCurrentAnalysisId(null);
      }
      return;
    }

    let active = true;
    setSavedAnalysesLoading(true);
    void supabase
      .from('rfp_analyses')
      .select('id, file_name, updated_at, result')
      .order('updated_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setPersistenceError(`Could not load saved bids: ${error.message}`);
        } else {
          setPersistenceError('');
          setSavedAnalyses((data ?? []) as SavedAnalysis[]);
        }
        setSavedAnalysesLoading(false);
      }, (error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unexpected network error.';
        setPersistenceError(`Could not load saved bids: ${message}`);
        setSavedAnalysesLoading(false);
      });

    return () => { active = false; };
  }, [authLoading, previewMode, sessionUserId]);

  useEffect(() => {
    if (authLoading) return;
    if (!sessionUserId) {
      setHasPaidPlan(false);
      return;
    }

    let active = true;
    void supabase
      .from('billing_entitlements')
      .select('tier, status, analysis_id')
      .eq('user_id', sessionUserId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('Could not load billing access:', error.message);
          return;
        }
        setHasPaidPlan(data?.status === 'active' && (data.tier !== 'pay-per-bid' || data.analysis_id === currentAnalysisId));
      });
    return () => { active = false; };
  }, [authLoading, currentAnalysisId, sessionUserId]);

  useEffect(() => {
    if (!result || !currentAnalysisId) return;

    let active = true;
    const timer = window.setTimeout(() => {
      setSaveStatus('saving');
      void supabase
        .from('rfp_analyses')
        .update({ result, updated_at: new Date().toISOString() })
        .eq('id', currentAnalysisId)
        .then(({ error }) => {
          if (!active) return;
          if (error) {
            setSaveStatus('error');
            setPersistenceError(`Could not save changes: ${error.message}`);
            return;
          }
          const updatedAt = new Date().toISOString();
          setSaveStatus('saved');
          setSavedAnalyses((items) => items.map((item) => item.id === currentAnalysisId ? { ...item, result, updated_at: updatedAt } : item));
        });
    }, 700);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [result, currentAnalysisId]);

  async function handleAnalyzed(analysis: AnalysisResult) {
    setPersistenceError('');
    const { data, error } = await supabase
      .from('rfp_analyses')
      .insert({ file_name: analysis.fileName, file_size: analysis.fileSize, result: analysis })
      .select('id, file_name, updated_at, result')
      .single();

    if (error) throw new Error(`Analysis completed but could not be saved: ${error.message}`);
    const saved = data as SavedAnalysis;
    setSavedAnalyses((items) => [saved, ...items.filter((item) => item.id !== saved.id)]);
    setCurrentAnalysisId(saved.id);
    setSaveStatus('saved');
    setResult(analysis);
  }

  function openSavedAnalysis(analysis: SavedAnalysis) {
    setCurrentAnalysisId(analysis.id);
    setSaveStatus('saved');
    setResult(analysis.result);
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthError('');
    setAuthMessage('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign in. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setAuthMessage(data.session
        ? 'Your account has been created.'
        : 'Account request received. If email confirmation is enabled, check your inbox to finish creating your account.');
      setAuthMode('sign_in');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to create your account. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handlePasswordResetRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthError('');
    setAuthMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setAuthMessage('If an account exists for that email, a password reset link has been sent.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to send a reset link. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setAuthMode('sign_in');
      setPassword('');
      setConfirmPassword('');
      setAuthMessage('Your password has been updated. Sign in with your new password.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to update your password. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  }

  function changeAuthMode(mode: typeof authMode) {
    setAuthMode(mode);
    setAuthError('');
    setAuthMessage('');
    setPassword('');
    setConfirmPassword('');
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(error.message);
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink-950 px-5 text-ink-100">
        <section className="w-full max-w-md rounded-lg border border-ink-700 bg-ink-900 p-8">
          <LockKeyhole className="mb-5 h-7 w-7 text-accent" aria-hidden="true" />
          <h1 className="text-xl font-semibold">Supabase configuration required</h1>
          <p className="mt-3 text-sm leading-6 text-ink-300">
            Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the deployment environment, then rebuild the app.
          </p>
        </section>
      </main>
    );
  }

  if (authLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-ink-950 text-sm text-ink-300">Checking sign-in...</main>;
  }

  if ((!session && !previewMode) || authMode === 'reset_password') {
    const isSignUp = authMode === 'sign_up';
    const isForgotPassword = authMode === 'forgot_password';
    const isResetPassword = authMode === 'reset_password';
    const title = isSignUp
      ? 'Create your Bidwell account'
      : isForgotPassword
        ? 'Reset your password'
        : isResetPassword
          ? 'Choose a new password'
          : 'Sign in to Bidwell';
    const handleSubmit = isSignUp
      ? handleSignUp
      : isForgotPassword
        ? handlePasswordResetRequest
        : isResetPassword
          ? handlePasswordUpdate
          : handleSignIn;

    return (
      <main className="flex min-h-screen items-center justify-center bg-grid bg-radial-glow bg-ink-950 px-5 text-ink-100">
        <section className="w-full max-w-md rounded-lg border border-ink-700 bg-ink-900 p-8 shadow-2xl">
          <LockKeyhole className="mb-5 h-7 w-7 text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">{title}</h1>
          {(isForgotPassword || isResetPassword) && (
            <p className="mt-2 text-sm text-ink-300">
              {isForgotPassword
                ? 'Enter your account email and we’ll send a password reset link.'
                : 'Enter and confirm your new password.'}
            </p>
          )}
          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            {!isResetPassword && (
              <label className="block text-sm font-medium text-ink-200">
                Email
                <input
                  autoComplete="email"
                  className="mt-2 block w-full rounded border border-ink-600 bg-ink-950 px-3 py-2.5 text-ink-100 outline-none focus:border-accent"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </label>
            )}
            {!isForgotPassword && (
              <label className="block text-sm font-medium text-ink-200">
                {isResetPassword ? 'New password' : 'Password'}
                <input
                  autoComplete={isResetPassword || isSignUp ? 'new-password' : 'current-password'}
                  className="mt-2 block w-full rounded border border-ink-600 bg-ink-950 px-3 py-2.5 text-ink-100 outline-none focus:border-accent"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </label>
            )}
            {(isSignUp || isResetPassword) && (
              <label className="block text-sm font-medium text-ink-200">
                Confirm password
                <input
                  autoComplete="new-password"
                  className="mt-2 block w-full rounded border border-ink-600 bg-ink-950 px-3 py-2.5 text-ink-100 outline-none focus:border-accent"
                  minLength={8}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  type="password"
                  value={confirmPassword}
                />
              </label>
            )}
            {authError && <p className="text-sm text-bad" role="alert">{authError}</p>}
            {authMessage && <p className="text-sm text-ink-200" role="status">{authMessage}</p>}
            <button
              className="w-full rounded bg-accent px-4 py-2.5 font-semibold text-ink-950 transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              disabled={authSubmitting}
              type="submit"
            >
              {authSubmitting
                ? 'Please wait...'
                : isSignUp
                  ? 'Create account'
                  : isForgotPassword
                    ? 'Send reset link'
                    : isResetPassword
                      ? 'Update password'
                      : 'Sign in'}
            </button>
          </form>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            {authMode === 'sign_in' && (
              <>
                <button className="text-accent hover:underline" onClick={() => changeAuthMode('forgot_password')} type="button">
                  Forgot password?
                </button>
                <button className="text-accent hover:underline" onClick={() => changeAuthMode('sign_up')} type="button">
                  Create account
                </button>
              </>
            )}
            {(isSignUp || isForgotPassword) && (
              <button className="text-accent hover:underline" onClick={() => changeAuthMode('sign_in')} type="button">
                Back to sign in
              </button>
            )}
            {isResetPassword && (
              <button className="text-accent hover:underline" onClick={() => changeAuthMode('forgot_password')} type="button">
                Request another reset link
              </button>
            )}
          </div>
          {isSignUp && <p className="mt-4 text-xs leading-5 text-ink-400">Use at least 8 characters for your password.</p>}
        </section>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-12 items-center justify-end gap-3 border-b border-ink-800 bg-ink-950 px-4">
        {result && <span className={`text-xs ${saveStatus === 'error' ? 'text-bad' : 'text-ink-400'}`}>{saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? 'Save failed' : 'Saved'}</span>}
        <span className="max-w-[50vw] truncate text-xs text-ink-400">{session?.user.email ?? 'Preview mode'}</span>
      </header>
      {persistenceError && <p className="bg-bad/10 px-4 py-2 text-xs text-bad" role="alert">{persistenceError}</p>}
      {previewMode && <p className="bg-warn/10 px-4 py-2 text-xs text-warn" role="status">Preview only: sample data, not analyzed from an RFP. Changes will not be saved.</p>}
      {result ? (
        <Dashboard
          result={result}
          isPro={hasPaidPlan}
          onReset={() => {
            if (previewMode) {
              setResult(analyzeFile('Dashboard preview - sample data.pdf', 0));
              return;
            }
            setResult(null);
            setCurrentAnalysisId(null);
          }}
          onResultChange={setResult}
        />
      ) : (
        <Uploader
          onAnalyzed={handleAnalyzed}
          savedAnalyses={savedAnalyses}
          savedAnalysesLoading={savedAnalysesLoading}
          onOpenAnalysis={openSavedAnalysis}
        />
      )}
      {session && (
        <div className="mt-auto flex justify-end px-4 pb-4 pt-2">
          <details className="flex flex-col items-end">
            <summary
              aria-label="Account options"
              className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded border border-ink-700 bg-ink-900 text-ink-300 shadow-lg transition-colors hover:border-ink-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              title="Account options"
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            </summary>
            <div className="mt-1 min-w-36 rounded border border-ink-700 bg-ink-900 p-1">
              <button
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-ink-200 transition-colors hover:bg-ink-800 hover:text-white"
                onClick={handleSignOut}
                type="button"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

export default App;
