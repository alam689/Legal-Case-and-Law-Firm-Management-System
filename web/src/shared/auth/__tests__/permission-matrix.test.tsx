import { CAPABILITIES, type Capability, FIRM_ROLES, capabilitiesForRole } from '@caseflow/domain';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';
import { lawyerFixture } from '@/test/fixtures';

import { Can } from '../Can';
import { useSessionStore } from '../session.store';

function signInAs(capabilities: readonly string[]) {
  useSessionStore.setState({
    status: 'authenticated',
    user: { ...lawyerFixture, capabilities: [...capabilities] },
  });
}

/**
 * RBAC matrix-এর প্রতিটি cell একটি test — docs/01-scope §5, docs/05 §14।
 * Phase 2-তে ৪টি role activate হলে এই suite-ই regression net।
 */
describe('<Can> — RBAC matrix', () => {
  it.each(FIRM_ROLES)('%s role-এর প্রতিটি capability cell সঠিকভাবে render হয়', (role) => {
    const granted = capabilitiesForRole(role);
    signInAs(granted);

    for (const capability of CAPABILITIES) {
      const { unmount } = renderWithProviders(
        <Can do={capability}>
          <span data-testid="allowed">ok</span>
        </Can>,
      );

      const shouldRender = granted.includes(capability);
      expect(screen.queryByTestId('allowed') !== null, `${role} × ${capability}`).toBe(
        shouldRender,
      );

      unmount();
    }
  });

  it('অনুমতি না থাকলে fallback দেখায়', () => {
    signInAs([]);
    renderWithProviders(
      <Can do="hearing.confirm" fallback={<span>locked</span>}>
        <span>confirm</span>
      </Can>,
    );
    expect(screen.getByText('locked')).toBeInTheDocument();
    expect(screen.queryByText('confirm')).not.toBeInTheDocument();
  });

  it('any: যেকোনো একটি থাকলেই যথেষ্ট', () => {
    signInAs(['payment.record']);
    renderWithProviders(
      <Can any={['invoice.create', 'payment.record']}>
        <span>billing</span>
      </Can>,
    );
    expect(screen.getByText('billing')).toBeInTheDocument();
  });

  it('all: সবগুলো লাগবে', () => {
    signInAs(['invoice.create']);
    renderWithProviders(
      <Can all={['invoice.create', 'payment.record']}>
        <span>both</span>
      </Can>,
    );
    expect(screen.queryByText('both')).not.toBeInTheDocument();
  });

  /** Deny-by-default — ভুলে খোলা রাখার চেয়ে বন্ধ থাকা নিরাপদ (FE3)। */
  it('কোনো condition না দিলে কিছুই render হয় না', () => {
    signInAs(capabilitiesForRole('FIRM_ADMIN'));
    renderWithProviders(
      <Can>
        <span>leaked</span>
      </Can>,
    );
    expect(screen.queryByText('leaked')).not.toBeInTheDocument();
  });

  /** Login না থাকলে কোনো capability নেই — অতিথি কিছুই দেখবে না। */
  it('anonymous user-এর কোনো capability নেই', () => {
    useSessionStore.setState({ status: 'anonymous', user: null });
    for (const capability of CAPABILITIES) {
      const { unmount } = renderWithProviders(
        <Can do={capability as Capability}>
          <span data-testid="allowed">ok</span>
        </Can>,
      );
      expect(screen.queryByTestId('allowed')).toBeNull();
      unmount();
    }
  });
});
