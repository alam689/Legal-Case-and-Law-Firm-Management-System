import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import AppointmentsScreen from '@/app/(tabs)/appointments';
import CasesScreen from '@/app/(tabs)/cases';
import DashboardScreen from '@/app/(tabs)/index';
import PropertiesScreen from '@/app/properties';

import { i18n } from '@/shared/i18n/init';

import { renderWithProviders, resetTestState, signInAsClient } from '../render';

/**
 * মক্কেলের মূল পথগুলো (P1)।
 *
 * প্রতিটি test আসল mock server-এর ভেতর দিয়ে যায় — কোনো hook mock করা
 * হয়নি। তাতে query key, locale chunk ও fixture-এর ভুলও ধরা পড়ে, শুধু
 * component-এর নয়।
 */
beforeEach(() => {
  resetTestState();
  signInAsClient();
});

describe('ড্যাশবোর্ড', () => {
  it('পরবর্তী তারিখ ও উপস্থিতির দাবি এক পর্দায় দেখায়', async () => {
    renderWithProviders(<DashboardScreen />);

    expect(await screen.findByText('আপনার পরবর্তী তারিখ')).toBeTruthy();
    // মক্কেলের সবচেয়ে ব্যয়বহুল প্রশ্ন — যেতে হবে কি না
    expect(await screen.findByText('আপনাকে আদালতে উপস্থিত থাকতে হবে')).toBeTruthy();
  });

  it('বকেয়ার অঙ্ক দেখায়', async () => {
    renderWithProviders(<DashboardScreen />);
    expect(await screen.findByText('বকেয়া')).toBeTruthy();
  });
});

describe('মামলার তালিকা', () => {
  it('নিজের দুটি মামলাই দেখায়', async () => {
    renderWithProviders(<CasesScreen />);

    expect(await screen.findByText('২৫১/২০২৪')).toBeTruthy();
    expect(await screen.findByText('৩১২/২০২৫')).toBeTruthy();
  });

  /** পর্যায়ের কাঁচা কোড কখনো মক্কেলের চোখে পড়বে না (rule A4)। */
  it('পর্যায়ের কোড নয়, নাম দেখায়', async () => {
    renderWithProviders(<CasesScreen />);

    await screen.findByText('২৫১/২০২৪');
    expect(screen.queryByText(/PLAINTIFF_EVIDENCE/)).toBeNull();
  });
});

describe('সাক্ষাতের অনুরোধ', () => {
  it('নিজের অনুরোধ ও কার সাথে তা দেখায়', async () => {
    renderWithProviders(<AppointmentsScreen />);

    expect(await screen.findByText('সাক্ষ্যগ্রহণের আগে কী কী কাগজ লাগবে জানতে চাই।')).toBeTruthy();
    expect(screen.getAllByText('মোঃ খোরশেদ আলম').length).toBeGreaterThan(0);
  });

  /**
   * এক মক্কেল একাধিক আইনজীবীর কাছে যান — কার কাছে অনুরোধ যাচ্ছে সেটি
   * তাঁকেই বেছে নিতে হয়।
   */
  it('আইনজীবী বাছাইয়ে নিজের মামলার আইনজীবীরাই থাকেন', async () => {
    renderWithProviders(<AppointmentsScreen />);

    fireEvent.press(await screen.findByText('সময় চান'));

    expect(await screen.findByText('কোন আইনজীবীর সাথে')).toBeTruthy();
    expect(screen.getAllByText(/মোঃ খোরশেদ আলম/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/নুসরাত জাহান/).length).toBeGreaterThan(0);
  });

  it('আইনজীবী না বাছলে অনুরোধ যায় না', async () => {
    renderWithProviders(<AppointmentsScreen />);

    fireEvent.press(await screen.findByText('সময় চান'));
    await screen.findByText('কোন আইনজীবীর সাথে');

    // ফর্মের ভেতরের "সময় চান" বোতামটিই জমা দেয়
    const submits = screen.getAllByText('সময় চান');
    fireEvent.press(submits[submits.length - 1] as never);

    expect(await screen.findByText('কোন আইনজীবীর সাথে দেখা করতে চান বেছে নিন')).toBeTruthy();
  });

  it('বেছে নিলে ও কারণ লিখলে অনুরোধ পৌঁছায়', async () => {
    renderWithProviders(<AppointmentsScreen />);

    fireEvent.press(await screen.findByText('সময় চান'));
    await screen.findByText('কোন আইনজীবীর সাথে');

    fireEvent.press(screen.getByLabelText(/নুসরাত জাহান/));
    fireEvent.changeText(screen.getByLabelText('কোন দিন'), '2026-09-15');
    fireEvent.changeText(
      screen.getByLabelText('কী বিষয়ে কথা বলতে চান'),
      'ভরণপোষণের আবেদন নিয়ে কথা বলতে চাই।',
    );

    const submits = screen.getAllByText('সময় চান');
    fireEvent.press(submits[submits.length - 1] as never);

    await waitFor(() => expect(screen.getByText('অনুরোধ পাঠানো হয়েছে')).toBeTruthy());
  });
});

describe('জমির ভল্ট', () => {
  it('খতিয়ান ও দাগ কাঠামোবদ্ধভাবে দেখায়', async () => {
    renderWithProviders(<PropertiesScreen />);

    expect(await screen.findByText('ধানমন্ডি আবাসিক প্লট')).toBeTruthy();
    expect(screen.getByText('৪৪৭')).toBeTruthy();
    // মামলাধীন সম্পত্তি আলাদা করে চিহ্নিত
    expect(screen.getByText('মামলাধীন')).toBeTruthy();
  });
});

describe('ভাষা বদল', () => {
  afterEach(async () => {
    await i18n.changeLanguage('bn');
  });

  /**
   * এই ভুলটি ব্রাউজারে ধরা পড়েছে: cold start-এ সংরক্ষিত ভাষা ('en')
   * বসানোর সময় `useLocaleChunk` আগেই 'bn' chunk বসিয়ে ফেলত, আর ভাষা
   * বদলের পরে সেটি আর ফিরে দেখত না। ফলে সেটিংস পর্দায় core-এর লেখা
   * ইংরেজি আর chunk-এর লেখা বাংলা — একই পর্দায় দুই ভাষা।
   */
  it('ভাষা বদলালে chunk-এর লেখাও নতুন ভাষায় আসে', async () => {
    renderWithProviders(<PropertiesScreen />);
    expect(await screen.findByText('আমার সম্পত্তি')).toBeTruthy();

    await act(async () => {
      await i18n.changeLanguage('en');
    });

    // chunk-এর লেখা (mobile.properties.*) ইংরেজিতে বদলাতেই হবে
    expect(await screen.findByText('My property')).toBeTruthy();
    expect(screen.queryByText('আমার সম্পত্তি')).toBeNull();
  });
});
