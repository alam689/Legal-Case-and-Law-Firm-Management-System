import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ErrorState } from '@/shared/ui/states';

interface Props {
  children: ReactNode;
}

interface State {
  error: unknown;
}

/**
 * Route-level boundary — একটি screen ভাঙলে পুরো app সাদা হবে না
 * (docs/05-frontend-plan.md §6.6)। Sentry wiring Sprint 1-এর শেষে,
 * DSN দেওয়া থাকলে এখানেই `captureException` বসবে।
 */
export class RouteErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    // Sentry যুক্ত হলে এখানেই captureException বসবে (docs/05 §15 — PII scrubber সহ)
    console.error('[route-error]', error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="p-6">
          <ErrorState error={this.state.error} onRetry={() => this.setState({ error: null })} />
        </div>
      );
    }
    return this.props.children;
  }
}
