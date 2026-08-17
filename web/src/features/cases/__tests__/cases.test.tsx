import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useSessionStore } from '@/shared/auth/session.store';
import { lawyerFixture } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';

import CaseCreatePage from '../pages/CaseCreatePage';
import CaseDetailPage from '../pages/CaseDetailPage';
import CaseListPage from '../pages/CaseListPage';

function signIn(capabilities = lawyerFixture.capabilities) {
  useSessionStore.setState({
    status: 'authenticated',
    user: { ...lawyerFixture, capabilities: [...capabilities] },
    accessToken: 'access-token-fixture',
  });
}

function renderCases(route = '/cases') {
  return renderWithProviders(
    <Routes>
      <Route path="/cases" element={<CaseListPage />} />
      <Route path="/cases/new" element={<CaseCreatePage />} />
      <Route path="/cases/:caseId" element={<CaseDetailPage />} />
    </Routes>,
    { route },
  );
}

describe('মামলার তালিকা', () => {
  it('মামলা, আদালত ও পর্যায় দেখায়', async () => {
    signIn();
    renderCases();

    const firstRow = (await screen.findByText('২৫১/২০২৪')).closest('tr') as HTMLElement;

    expect(within(firstRow).getByText('যুগ্ম জেলা জজ ২য় আদালত, ঢাকা')).toBeInTheDocument();
    // stage code নয়, workflow থেকে অনূদিত নাম
    expect(within(firstRow).getByText('বাদীর সাক্ষ্য')).toBeInTheDocument();
    // ৫০০ মামলার firm — গণনায় মোট সংখ্যা, তালিকায় প্রথম পাতা
    expect(screen.getByText('500টি মামলা')).toBeInTheDocument();
  });

  it('অবস্থা দিয়ে ফিল্টার করা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderCases();

    await screen.findByText('২৫১/২০২৪');
    await user.selectOptions(screen.getByLabelText('অবস্থা'), 'AWAITING_ORDER');

    // AWAITING_ORDER মামলাটি থাকে, ACTIVE মামলাটি সরে যায়
    expect(await screen.findByText('৮৭/২০২৩')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('২৫১/২০২৪')).not.toBeInTheDocument();
    });
  });

  it('ধরন ও আদালত ফিল্টার একসাথে কাজ করে', async () => {
    const user = userEvent.setup();
    signIn();
    renderCases();

    await screen.findByText('২৫১/২০২৪');
    await user.selectOptions(screen.getByLabelText('ধরন'), 'LAND');

    expect(await screen.findByText('৮৭/২০২৩')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('১৪/২০২৫')).not.toBeInTheDocument();
    });
  });

  /**
   * NFR N1 — ৫০০ মামলার firm। এক পাতায় সব পাঠানো হয় না; "আরও দেখুন"
   * দিয়ে পরের ৫০টি আসে (docs/05-frontend-plan.md §12)।
   */
  it('৫০০ মামলা এক পাতায় আসে না — ৫০টি করে', async () => {
    const user = userEvent.setup();
    signIn();
    renderCases();

    await screen.findByText('২৫১/২০২৪');
    // header সারি বাদে ৫০টি
    expect(screen.getAllByRole('row')).toHaveLength(51);
    // "৫০০টি মামলা · ৫০টি দেখানো হচ্ছে" — একাধিক element জুড়ে লেখা
    expect(
      screen.getByText((content) => content.includes('50') && content.includes('দেখানো হচ্ছে')),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'আরও দেখুন' }));

    await waitFor(() => {
      expect(screen.getAllByRole('row')).toHaveLength(101);
    });
  });

  it('ফিল্টারে কিছু না মিললে আলাদা empty state ও ফিল্টার মোছার পথ', async () => {
    const user = userEvent.setup();
    signIn();
    renderCases();

    await screen.findByText('২৫১/২০২৪');
    await user.selectOptions(screen.getByLabelText('অবস্থা'), 'CLOSED');

    expect(await screen.findByText('কোনো মামলা পাওয়া যায়নি')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'ফিল্টার মুছুন' })[0]!);
    expect(await screen.findByText('২৫১/২০২৪')).toBeInTheDocument();
  });

  it('case.create অনুমতি ছাড়া নতুন মামলার বোতাম নেই', async () => {
    signIn(['case.view_firm']);
    renderCases();

    await screen.findByText('২৫১/২০২৪');
    expect(screen.queryByRole('link', { name: /নতুন মামলা/ })).not.toBeInTheDocument();
  });
});

describe('মামলা তৈরি', () => {
  it('তিন ধাপ পেরিয়ে মামলা তৈরি হয়', async () => {
    const user = userEvent.setup();
    signIn();
    renderCases('/cases/new');

    // ধাপ ১
    await user.type(screen.getByLabelText('মামলা নম্বর'), '512');
    await user.type(screen.getByLabelText('মামলার শিরোনাম'), 'করিম বনাম রহিম');
    await user.click(screen.getByRole('button', { name: /পরবর্তী ধাপ/ }));

    // ধাপ ২ — আদালত বাছলে সেই court type-এর পর্যায় আসে
    const courtSelect = await screen.findByLabelText('আদালত');
    await user.selectOptions(courtSelect, 'court-2');
    await user.selectOptions(screen.getByLabelText('বর্তমান পর্যায়'), 'RECORD_EXAMINATION');
    await user.click(screen.getByRole('button', { name: /পরবর্তী ধাপ/ }));

    // ধাপ ৩
    await user.click(await screen.findByRole('checkbox', { name: /আবদুল হালিম/ }));
    await user.click(screen.getByRole('button', { name: /মামলা তৈরি করুন/ }));

    expect(await screen.findByRole('heading', { name: 'করিম বনাম রহিম' })).toBeInTheDocument();
    expect(screen.getByText('৫১২/২০২৬')).toBeInTheDocument();
  });

  it('আবশ্যক ঘর খালি থাকলে পরের ধাপে যাওয়া যায় না', async () => {
    const user = userEvent.setup();
    signIn();
    renderCases('/cases/new');

    await user.click(screen.getByRole('button', { name: /পরবর্তী ধাপ/ }));

    expect(await screen.findByText('মামলা নম্বর দিন')).toBeInTheDocument();
    // এখনো ধাপ ১-এ আছি
    expect(screen.queryByLabelText('আদালত')).not.toBeInTheDocument();
  });

  /** আদালতের ধরন অনুযায়ী পর্যায় আসে — hardcoded তালিকা নয় (F-CASE-04)। */
  it('ভূমি ট্রাইব্যুনাল বাছলে ট্রাইব্যুনালের পর্যায় দেখা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderCases('/cases/new');

    await user.type(screen.getByLabelText('মামলা নম্বর'), '7');
    await user.type(screen.getByLabelText('মামলার শিরোনাম'), 'পরীক্ষা মামলা');
    await user.click(screen.getByRole('button', { name: /পরবর্তী ধাপ/ }));

    const courtSelect = await screen.findByLabelText('আদালত');
    const stageSelect = screen.getByLabelText('বর্তমান পর্যায়');

    await user.selectOptions(courtSelect, 'court-2');
    expect(within(stageSelect).getByRole('option', { name: 'সরেজমিন তদন্ত' })).toBeInTheDocument();

    // দেওয়ানি আদালতে সেই ধাপ নেই
    await user.selectOptions(courtSelect, 'court-1');
    await waitFor(() => {
      expect(within(stageSelect).queryByRole('option', { name: 'সরেজমিন তদন্ত' })).toBeNull();
    });
    expect(
      within(stageSelect).getByRole('option', { name: 'বিচার্য বিষয় গঠন' }),
    ).toBeInTheDocument();
  });
});

describe('মামলার পাতা', () => {
  it('৭টি tab ও সারসংক্ষেপ দেখায়', async () => {
    signIn();
    renderCases('/cases/case-1');

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'মোঃ রহিম উদ্দিন বনাম মোঃ করিম মিয়া',
    );
    expect(screen.getAllByRole('tab')).toHaveLength(7);
    expect(screen.getByText(/ধানমন্ডির ৫ কাঠা জমির/)).toBeInTheDocument();
  });

  /** অগ্রগতি প্রশাসনিক — ফলাফলের পূর্বাভাস নয় (docs/02-architecture §7)। */
  it('পর্যায় ও প্রশাসনিক অগ্রগতির দাবিত্যাগ দেখায়', async () => {
    signIn();
    renderCases('/cases/case-1');

    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText('6 / 13 ধাপ')).toBeInTheDocument();
    expect(screen.getByText(/জেতার সম্ভাবনার কোনো ইঙ্গিত নয়/)).toBeInTheDocument();
  });

  it('অভ্যন্তরীণ নোট tab-এ স্থায়ী সতর্কবার্তা থাকে', async () => {
    const user = userEvent.setup();
    signIn();
    renderCases('/cases/case-1');

    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('tab', { name: 'নোট' }));

    expect(screen.getByText(/মক্কেল কখনো দেখবেন না/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/হস্তলিপি বিশেষজ্ঞের মতামত/)).toBeInTheDocument();
  });

  it('নোট সংরক্ষণ করা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderCases('/cases/case-1');

    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('tab', { name: 'নোট' }));

    const textarea = screen.getByLabelText('অভ্যন্তরীণ নোট');
    await user.clear(textarea);
    await user.type(textarea, 'নতুন কৌশল');
    await user.click(screen.getByRole('button', { name: 'নোট সংরক্ষণ' }));

    expect(await screen.findByText('নোট সংরক্ষিত হয়েছে')).toBeInTheDocument();
  });

  /** rule A4 — অনুমতি না থাকলে নোট সম্পাদনা করা যাবে না। */
  it('case.internal_notes ছাড়া নোট সম্পাদনার ঘর নেই', async () => {
    const user = userEvent.setup();
    signIn(['case.view_firm']);
    renderCases('/cases/case-1');

    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('tab', { name: 'নোট' }));

    expect(screen.getByText(/মক্কেল কখনো দেখবেন না/)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'নোট সংরক্ষণ' })).not.toBeInTheDocument();
  });

  it('অজানা মামলায় not-found', async () => {
    signIn();
    renderCases('/cases/nope');
    expect(await screen.findByText('পাওয়া যায়নি')).toBeInTheDocument();
  });
});
