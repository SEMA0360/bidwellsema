import { Component, type ErrorInfo, type ReactNode } from 'react';

interface PageErrorBoundaryProps {
  children: ReactNode;
}

interface PageErrorBoundaryState {
  hasError: boolean;
}

export default class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  state: PageErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): PageErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('The page could not be rendered:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-ink-950 px-5 text-ink-100">
          <section className="w-full max-w-md rounded-lg border border-ink-700 bg-ink-900 p-8">
            <h1 className="text-xl font-semibold">We couldn’t load this page</h1>
            <p className="mt-3 text-sm leading-6 text-ink-300">
              Something went wrong while displaying the app. Reload the page to try again.
            </p>
            <button
              className="mt-6 rounded bg-accent px-4 py-2.5 font-semibold text-ink-950 transition-opacity hover:opacity-90"
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload page
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
