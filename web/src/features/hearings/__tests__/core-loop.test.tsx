import type { AgendaItem } from '@caseflow/api-types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { HttpResponse, http as mswHttp } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/shared/auth/session.store';
import { env } from '@/shared/config/env';
import { todayIso } from '@/shared/i18n/formatters';
import { lawyerFixture, listCaseHearings, listCaseTimeline } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import { useState } from 'react';
import { CaseHearingsTab } from '../components/CaseHearingsTab';
import { CaseTimeline } from '../components/CaseTimeline';
import { OutcomeEntryButton } from '../components/OutcomeEntryButton';
import { QuickOutcomeDialog } from '../components/QuickOutcomeDialog';
import { type OutcomeEntryMetrics, reportOutcomeEntry, setMetricsSink } from '@/shared/telemetry/entry-metrics';

const apiBase = env.apiBaseUrl.replace(/\/$/, '');

function signIn(capabilities = lawyerFixture.capabilities) {
  useSessionStore.setState({
    status: 'authenticated',
    user: { ...lawyerFixture, capabilities: [...capabilities] },
    accessToken: 'access-token-fixture',
  });
}

/**
 * Dashboard + core loop — `app/pages/DashboardRoute` যেভাবে যুক্ত করে,
 * হুবহু সেভাবেই। Dialog পর্দার স্তরে, সারির ভিতরে নয়।
 */
function DashboardHarness() {
  const [active, setActive] = useState<AgendaItem | null>(null);
  return (
    <>
      <DashboardPage
        renderRowAction={(item) => <OutcomeEntryButton item={item} onOpen={setActive} />}
      />
      {active ? (
        <QuickOutcomeDialog
          item={active}
          hearingDate={todayIso()}
          open
          onOpenChange={(open) => !open && setActive(null)}
          source="dashboard"
        />
      ) : null}
    </>
  );
}

function renderDashboard() {
  return renderWithProviders(<DashboardHarness />);
}

/**
 * মামলা নম্বর দুই জায়গায় থাকে — উপরের "পরবর্তী শুনানি" কার্ডে ও
 * কার্যতালিকার সারিতে। এখানে সবসময় সারিটিই লাগে।
 */
async function agendaRow(caseNumber: string): Promise<HTMLElement> {
  await screen.findAllByText(caseNumber);
  const row = screen
    .getAllByText(caseNumber)
    .map((node) => node.closest('li'))
    .find((node): node is HTMLLIElement => node !== null);
  if (!row) throw new Error(`agenda row not found: ${caseNumber}`);
  return row;
}

async function openEntryFor(user: ReturnType<typeof userEvent.setup>, caseNumber: string) {
  const row = await agendaRow(caseNumber);
  await user.click(within(row).getByRole('button', { name: 'ফলাফল লিখুন' }));
  return screen.getByRole('dialog');
}

describe('★ Core loop — শুনানির ফলাফল লেখা', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('আজকের কার্যতালিকার প্রতিটি শুনানিতে ফলাফল লেখার পথ আছে', async () => {
    signIn();
    renderDashboard();

    await agendaRow('২৫১/২০২৪');
    expect(screen.getAllByRole('button', { name: 'ফলাফল লিখুন' })).toHaveLength(3);
  });

  it('hearing.entry অনুমতি ছাড়া বোতামই নেই', async () => {
    signIn(['case.view_firm']);
    renderDashboard();

    await agendaRow('২৫১/২০২৪');
    expect(screen.queryByRole('button', { name: 'ফলাফল লিখুন' })).not.toBeInTheDocument();
  });

  it('modal-এ smart default বসানো থাকে — মুলতবি ও ২১ দিন পরের তারিখ', async () => {
    const user = userEvent.setup();
    signIn();
    renderDashboard();

    const dialog = await openEntryFor(user, '২৫১/২০২৪');

    expect(within(dialog).getByLabelText('ফলাফল')).toHaveValue('ADJOURNED');

    const expected = new Date();
    expected.setDate(expected.getDate() + 21);
    expect(within(dialog).getByLabelText('পরবর্তী তারিখ')).toHaveValue(
      expected.toISOString().slice(0, 10),
    );
  });

  /**
   * ★ M1-এর কেন্দ্রীয় test — একবার সংরক্ষণে পুরো fan-out।
   */
  it('ফলাফল সংরক্ষণে পরবর্তী শুনানি, টাইমলাইন এন্ট্রি ও নোটিফিকেশন হয়', async () => {
    const user = userEvent.setup();
    signIn();
    renderDashboard();

    const dialog = await openEntryFor(user, '২৫১/২০২৪');
    await user.type(within(dialog).getByLabelText('মন্তব্য'), 'সাক্ষী অনুপস্থিত');
    await user.click(within(dialog).getByRole('button', { name: 'সংরক্ষণ' }));

    // সাফল্যের কার্ড — server নিশ্চিত করার পরেই
    expect(await screen.findByText('সংরক্ষিত হয়েছে')).toBeInTheDocument();
    expect(screen.getByText(/জন মক্কেলকে জানানো হচ্ছে/)).toBeInTheDocument();

    // store-এ প্রকৃত fan-out
    const hearings = listCaseHearings('case-1');
    const completed = hearings.find((hearing) => hearing.id === 'hearing-2');
    expect(completed?.status).toBe('COMPLETED');
    expect(completed?.outcome).toBe('ADJOURNED');

    const next = hearings.find((hearing) => hearing.previous_hearing_id === 'hearing-2');
    expect(next?.status).toBe('SCHEDULED');
    expect(next?.source).toBe('LAWYER_ENTERED');

    const timeline = listCaseTimeline('case-1');
    expect(timeline.some((event) => event.event_type === 'HEARING_OUTCOME')).toBe(true);
  });

  /** FE9 — server confirm করার আগে সাফল্য দেখানো হবে না। */
  it('optimistic নয় — server সাড়া দেওয়ার আগে সাফল্য দেখানো হয় না', async () => {
    const user = userEvent.setup();
    signIn();

    let release: (() => void) | undefined;
    server.use(
      mswHttp.post(`${apiBase}/hearings/:id/outcome`, async () => {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return HttpResponse.json({
          hearing: {},
          next_hearing: null,
          event_id: 'e-1',
          notifications_queued: 0,
          stage_changed_to: null,
          warnings: [],
        });
      }),
    );

    renderDashboard();
    const dialog = await openEntryFor(user, '২৫১/২০২৪');
    await user.click(within(dialog).getByRole('button', { name: 'সংরক্ষণ' }));

    // request চলাকালীন কোনো সাফল্যের বার্তা নেই
    expect(screen.queryByText('সংরক্ষিত হয়েছে')).not.toBeInTheDocument();
    release?.();
    expect(await screen.findByText('সংরক্ষিত হয়েছে')).toBeInTheDocument();
  });

  it('ব্যর্থ হলে বার্তা দেখায় এবং লেখা মুছে যায় না', async () => {
    const user = userEvent.setup();
    signIn();
    server.use(
      mswHttp.post(`${apiBase}/hearings/:id/outcome`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'boom' } }, { status: 500 }),
      ),
    );

    renderDashboard();
    const dialog = await openEntryFor(user, '২৫১/২০২৪');
    await user.type(within(dialog).getByLabelText('মন্তব্য'), 'গুরুত্বপূর্ণ মন্তব্য');
    await user.click(within(dialog).getByRole('button', { name: 'সংরক্ষণ' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/আপনার লেখা মুছে যায়নি/);
    expect(within(dialog).getByLabelText('মন্তব্য')).toHaveValue('গুরুত্বপূর্ণ মন্তব্য');
  });

  it('নিষ্পত্তি হলে পরবর্তী তারিখের ঘর সরে যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderDashboard();

    const dialog = await openEntryFor(user, '২৫১/২০২৪');
    await user.selectOptions(within(dialog).getByLabelText('ফলাফল'), 'DISPOSED');

    expect(within(dialog).queryByLabelText('পরবর্তী তারিখ')).not.toBeInTheDocument();
    expect(within(dialog).getByText(/নিষ্পত্তি হলে পরবর্তী তারিখ লাগে না/)).toBeInTheDocument();
  });

  it('quick chip দিয়ে তারিখ বসানো যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderDashboard();

    const dialog = await openEntryFor(user, '২৫১/২০২৪');
    await user.click(within(dialog).getByRole('button', { name: '+7 দিন' }));

    const expected = new Date();
    expected.setDate(expected.getDate() + 7);
    expect(within(dialog).getByLabelText('পরবর্তী তারিখ')).toHaveValue(
      expected.toISOString().slice(0, 10),
    );
  });

  /** Soft validation — ধাপ লাফ দেওয়া আটকানো হয় না, শুধু জানানো হয় (§7)। */
  it('পর্যায় একাধিক ধাপ এগোলে সতর্ক করে, কিন্তু আটকায় না', async () => {
    const user = userEvent.setup();
    signIn();
    renderDashboard();

    const dialog = await openEntryFor(user, '২৫১/২০২৪');
    await user.selectOptions(within(dialog).getByLabelText('পর্যায়'), 'JUDGMENT');

    expect(within(dialog).getByText(/একাধিক ধাপ এগিয়ে যাচ্ছে/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'সংরক্ষণ' })).toBeEnabled();
  });

  it('Ctrl+Enter দিয়ে সংরক্ষণ হয় — mouse ছাড়াই পুরো flow', async () => {
    const user = userEvent.setup();
    signIn();
    renderDashboard();

    const dialog = await openEntryFor(user, '২৫১/২০২৪');
    await user.click(within(dialog).getByLabelText('মন্তব্য'));
    await user.keyboard('{Control>}{Enter}{/Control}');

    expect(await screen.findByText('সংরক্ষিত হয়েছে')).toBeInTheDocument();
  });

  /** PE8 — এই measurement ছাড়া pilot exit criteria যাচাই করা যায় না। */
  it('entry-এর সময় ও সংশোধনের সংখ্যা রিপোর্ট হয়', async () => {
    const user = userEvent.setup();
    signIn();

    const captured: OutcomeEntryMetrics[] = [];
    setMetricsSink((metrics) => captured.push(metrics));

    renderDashboard();
    const dialog = await openEntryFor(user, '২৫১/২০২৪');
    await user.click(within(dialog).getByRole('button', { name: '+14 দিন' }));
    await user.click(within(dialog).getByRole('button', { name: 'সংরক্ষণ' }));

    await screen.findByText('সংরক্ষিত হয়েছে');

    expect(captured).toHaveLength(1);
    expect(captured[0]).toMatchObject({
      hearingId: 'hearing-2',
      outcome: 'ADJOURNED',
      hadNextDate: true,
      notifiedClient: true,
      usedQuickDateChip: true,
      source: 'dashboard',
    });
    expect(captured[0]?.durationMs).toBeGreaterThanOrEqual(0);
    expect(captured[0]?.fieldEdits).toBeGreaterThan(0);

    setMetricsSink(() => undefined);
  });

  it('idempotency key পাঠানো হয় — double submit server-এ ধরা পড়বে', async () => {
    const user = userEvent.setup();
    signIn();

    const keys: (string | null)[] = [];
    server.use(
      mswHttp.post(`${apiBase}/hearings/:id/outcome`, ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key'));
        return HttpResponse.json({
          hearing: {},
          next_hearing: null,
          event_id: 'e-1',
          notifications_queued: 0,
          stage_changed_to: null,
          warnings: [],
        });
      }),
    );

    renderDashboard();
    const dialog = await openEntryFor(user, '২৫১/২০২৪');
    await user.click(within(dialog).getByRole('button', { name: 'সংরক্ষণ' }));

    await screen.findByText('সংরক্ষিত হয়েছে');
    expect(keys[0]).toMatch(/^hearing-2:/);
  });

  /** Cache invalidation — outcome-এর পরে dashboard আর পুরনো তালিকা দেখাবে না। */
  it('সংরক্ষণের পরে আজকের কার্যতালিকা থেকে শুনানিটি সরে যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderDashboard();

    const dialog = await openEntryFor(user, '২৫১/২০২৪');
    await user.click(within(dialog).getByRole('button', { name: 'সংরক্ষণ' }));
    await screen.findByText('সংরক্ষিত হয়েছে');
    await user.click(screen.getByRole('button', { name: 'শেষ' }));

    await waitFor(() => {
      expect(screen.queryAllByText('২৫১/২০২৪')).toHaveLength(0);
    });
    // বাকি দুটি শুনানি এখনো আছে
    expect(screen.getAllByText('৮৭/২০২৩').length).toBeGreaterThan(0);
  });
});

describe('শুনানির ইতিহাস', () => {
  it('তারিখ পরিবর্তিত row মুছে না, চিহ্নিত হয়ে থেকে যায় (rule A2)', async () => {
    signIn();
    renderWithProviders(
      <Routes>
        <Route path="/" element={<CaseHearingsTab caseId="case-2" />} />
      </Routes>,
    );

    expect(await screen.findByText('তারিখ পরিবর্তিত')).toBeInTheDocument();
    expect(screen.getByText('নিশ্চিতকৃত')).toBeInTheDocument();
  });

  it('প্রতিটি তারিখের পাশে উৎস দেখানো হয় (rule A1)', async () => {
    signIn();
    renderWithProviders(<CaseHearingsTab caseId="case-1" />);

    await screen.findAllByText(/সাক্ষ্যগ্রহণ/);
    expect(screen.getAllByText('আইনজীবী কর্তৃক লিখিত').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('1 বার পিছিয়েছে')).toBeInTheDocument();
  });

  it('ফলাফল না লেখা শুনানি আলাদা করে চিহ্নিত', async () => {
    signIn();
    renderWithProviders(<CaseHearingsTab caseId="case-1" />);

    expect(await screen.findAllByText('ফলাফল লেখা হয়নি')).toHaveLength(2);
  });
});

describe('টাইমলাইন — append-only', () => {
  it('ঘটনা, সংশোধন ও দৃশ্যমানতা দেখায়', async () => {
    signIn();
    renderWithProviders(<CaseTimeline caseId="case-1" />);

    expect(await screen.findByText('মামলা দায়ের')).toBeInTheDocument();
    expect(screen.getByText('লিখিত জবাব দাখিল')).toBeInTheDocument();
    // 'সংশোধন' দুবার — event-এর ধরন ও badge
    expect(screen.getAllByText('সংশোধন').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('সংশোধিত')).toBeInTheDocument();
  });

  /** ★ FE5 — টাইমলাইনে কোনো delete/edit বোতাম থাকা চলবে না। */
  it('কোনো মুছে ফেলা বা সম্পাদনার বোতাম নেই', async () => {
    signIn();
    renderWithProviders(<CaseTimeline caseId="case-1" />);

    await screen.findByText('মামলা দায়ের');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText(/টাইমলাইন থেকে কিছু মোছা যায় না/)).toBeInTheDocument();
  });

  /** কাঁচা enum code ব্যবহারকারীকে দেখানো হয় না (docs/05 §6.5)। */
  it('পর্যায় পরিবর্তনের এন্ট্রিতে code নয়, অনূদিত নাম দেখায়', async () => {
    const user = userEvent.setup();
    signIn();

    const { rerender } = renderWithProviders(<CaseTimeline caseId="case-1" />);
    await screen.findByText('মামলা দায়ের');

    // outcome লিখলে STAGE_CHANGED event তৈরি হয়
    renderDashboard();
    const dialog = await openEntryFor(user, '২৫১/২০২৪');
    await user.selectOptions(within(dialog).getByLabelText('পর্যায়'), 'ARGUMENT');
    await user.click(within(dialog).getByRole('button', { name: 'সংরক্ষণ' }));
    await screen.findByText('সংরক্ষিত হয়েছে');

    rerender(<CaseTimeline caseId="case-1" />);

    expect(await screen.findByText('যুক্তিতর্ক')).toBeInTheDocument();
    expect(screen.queryByText('ARGUMENT')).not.toBeInTheDocument();
  });

  it('সংশোধিত এন্ট্রি তালিকা থেকে হারায় না', async () => {
    signIn();
    renderWithProviders(<CaseTimeline caseId="case-1" />);

    const corrected = await screen.findByText('শুনানির ফলাফল');
    expect(corrected).toBeInTheDocument();
    expect(corrected.className).toMatch(/line-through/);
  });
});

describe('তারিখের ব্যবধান শেখা', () => {
  it('আগের ব্যবধান মনে রেখে পরের বার সেটিই default হয়', async () => {
    const user = userEvent.setup();
    signIn();
    localStorage.clear();
    renderDashboard();

    // প্রথম entry — ৭ দিনের chip
    const dialog = await openEntryFor(user, '২৫১/২০২৪');
    await user.click(within(dialog).getByRole('button', { name: '+7 দিন' }));
    await user.click(within(dialog).getByRole('button', { name: 'সংরক্ষণ' }));
    await screen.findByText('সংরক্ষিত হয়েছে');

    const stored = JSON.parse(
      localStorage.getItem('caseflow.adjournment-gaps') ?? '[]',
    ) as number[];
    expect(stored).toContain(7);
  });
});

describe('metrics sink', () => {
  it('sink বদলানো যায় — Sprint 4-এর dashboard এখানেই যুক্ত হবে', () => {
    const sink = vi.fn();
    setMetricsSink(sink);
    reportOutcomeEntry({
      hearingId: 'h',
      durationMs: 1,
      fieldEdits: 0,
      failedAttempts: 0,
      outcome: 'HEARD',
      hadNextDate: false,
      usedQuickDateChip: false,
      notifiedClient: false,
      source: 'case',
    });
    expect(sink).toHaveBeenCalledOnce();
    setMetricsSink(() => undefined);
  });
});
