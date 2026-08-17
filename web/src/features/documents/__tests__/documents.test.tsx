import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useSessionStore } from '@/shared/auth/session.store';
import { lawyerFixture } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';

import { screenFiles } from '../lib/upload-queue';
import DocumentListPage from '../pages/DocumentListPage';

function signIn(capabilities: readonly string[] = lawyerFixture.capabilities) {
  useSessionStore.setState({
    status: 'authenticated',
    user: { ...lawyerFixture, capabilities: [...capabilities] },
    accessToken: 'access-token-fixture',
  });
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/documents" element={<DocumentListPage />} />
    </Routes>,
    { route: '/documents' },
  );
}

function makeFile(name: string, type = 'application/pdf', size = 1024) {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('নথির তালিকা', () => {
  it('নথি, শ্রেণি ও ফাইলের আকার দেখায়', async () => {
    signIn();
    renderPage();

    expect(await screen.findByText('আরজি (প্লেইন্ট) — দাখিলকৃত কপি')).toBeInTheDocument();
    expect(screen.getByText('বি.এস. খতিয়ান — দাগ ১১২৪')).toBeInTheDocument();
    // ৪১২,৩৩৬ bytes → 402.7 KB (test locale-এ অঙ্ক Latin থাকে)
    expect(screen.getByText('402.7 KB')).toBeInTheDocument();
  });

  it('শ্রেণির ফোল্ডারে ক্লিক করলে তালিকা সেই শ্রেণিতেই সীমিত হয়', async () => {
    const user = userEvent.setup();
    signIn();
    renderPage();

    await screen.findByText('আরজি (প্লেইন্ট) — দাখিলকৃত কপি');

    const folders = screen.getByRole('navigation', { name: 'শ্রেণি' });
    await user.click(within(folders).getByRole('button', { name: /^খতিয়ান/ }));

    expect(await screen.findByText('বি.এস. খতিয়ান — দাগ ১১২৪')).toBeInTheDocument();
    expect(screen.queryByText('আরজি (প্লেইন্ট) — দাখিলকৃত কপি')).not.toBeInTheDocument();
  });

  it('নাম দিয়ে খোঁজা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderPage();

    await screen.findByText('আরজি (প্লেইন্ট) — দাখিলকৃত কপি');
    await user.type(screen.getByRole('searchbox'), 'খতিয়ান');

    /**
     * নতুন query key মানে আবার loading — তাই আগে ফলাফল আসা পর্যন্ত অপেক্ষা,
     * তারপর অনুপস্থিতি যাচাই। উল্টো করলে skeleton দেখেই "ফিল্টার হয়েছে"
     * ধরে নেওয়া হয় এবং test মিথ্যা সবুজ হয়।
     */
    expect(await screen.findByText('বি.এস. খতিয়ান — দাগ ১১২৪')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText('আরজি (প্লেইন্ট) — দাখিলকৃত কপি')).not.toBeInTheDocument(),
    );
  });

  /**
   * ভাইরাস স্ক্যান শেষ না হওয়া পর্যন্ত ফাইল খোলা যায় না — এটি কেবল
   * শোভাবর্ধক badge নয়, preview-ও আটকে থাকে। দুটোই একসাথে যাচাই করা হয়,
   * কারণ badge দেখিয়ে ফাইল খুলতে দেওয়াটাই সবচেয়ে বিভ্রান্তিকর ফল।
   */
  it('স্ক্যান চলা নথি চিহ্নিত হয় এবং খোলা যায় না', async () => {
    const user = userEvent.setup();
    signIn();
    renderPage();

    const row = (await screen.findByText('আদালতের আদেশ — ২১ জুলাই')).closest('tr');
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText('স্ক্যান চলছে')).toBeInTheDocument();

    await user.click(
      within(row as HTMLElement).getByRole('button', { name: /দেখুন — আদালতের আদেশ/ }),
    );

    expect(await screen.findByText('স্ক্যান শেষ হলে ফাইলটি খোলা যাবে।')).toBeInTheDocument();
  });
});

describe('মক্কেলের দৃশ্যমানতা (A4)', () => {
  it('বন্ধ থেকে খোলার আগে নিশ্চিত করতে বলে', async () => {
    const user = userEvent.setup();
    signIn();
    renderPage();

    const row = (await screen.findByText('প্রতিপক্ষের লিখিত জবাব')).closest('tr');
    await user.click(within(row as HTMLElement).getByRole('button', { name: 'শুধু চেম্বার' }));

    expect(await screen.findByText('মক্কেলকে দেখাবেন?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'হ্যাঁ, দেখান' }));

    await waitFor(() =>
      expect(
        within(row as HTMLElement).getByRole('button', { name: 'মক্কেল দেখতে পান' }),
      ).toBeInTheDocument(),
    );
  });

  it('নিশ্চিত না করলে অবস্থা বদলায় না', async () => {
    const user = userEvent.setup();
    signIn();
    renderPage();

    const row = (await screen.findByText('প্রতিপক্ষের লিখিত জবাব')).closest('tr');
    await user.click(within(row as HTMLElement).getByRole('button', { name: 'শুধু চেম্বার' }));

    await screen.findByText('মক্কেলকে দেখাবেন?');
    await user.click(screen.getByRole('button', { name: 'বাতিল' }));

    expect(
      within(row as HTMLElement).getByRole('button', { name: 'শুধু চেম্বার' }),
    ).toBeInTheDocument();
  });

  /** FE3 — capability না থাকলে অবস্থা পড়া যায়, বদলানো যায় না। */
  it('document.visibility না থাকলে শুধু badge, কোনো বোতাম নয়', async () => {
    signIn(lawyerFixture.capabilities.filter((cap) => cap !== 'document.visibility'));
    renderPage();

    const row = (await screen.findByText('প্রতিপক্ষের লিখিত জবাব')).closest('tr');
    expect(within(row as HTMLElement).getByText('শুধু চেম্বার')).toBeInTheDocument();
    expect(
      within(row as HTMLElement).queryByRole('button', { name: 'শুধু চেম্বার' }),
    ).not.toBeInTheDocument();
  });
});

describe('নথি আপলোড', () => {
  it('আপলোড করা নথি ডিফল্টভাবে শুধু চেম্বারের এবং স্ক্যান-অপেক্ষমাণ', async () => {
    const user = userEvent.setup();
    signIn();
    const { container } = renderPage();

    await screen.findByText('আরজি (প্লেইন্ট) — দাখিলকৃত কপি');
    await user.click(screen.getByRole('button', { name: /নথি যোগ/ }));

    const input = container.ownerDocument.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    await user.upload(input as HTMLInputElement, makeFile('affidavit.pdf'));

    expect(await screen.findByText('affidavit.pdf')).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    // নাম না দিলে ফাইলের নামই নাম হয়; এখানে আলাদা নাম দিয়ে সেই পথটিও দেখা
    await user.type(within(dialog).getByLabelText('নথির নাম'), 'হলফনামা — সাক্ষী ২');
    await user.click(within(dialog).getByRole('button', { name: /নথি যোগ/ }));

    await waitFor(() => expect(within(dialog).getByText('যোগ হয়েছে')).toBeInTheDocument());

    await user.click(within(dialog).getByRole('button', { name: 'সম্পন্ন' }));

    const row = (await screen.findByText('হলফনামা — সাক্ষী ২')).closest('tr');
    expect(within(row as HTMLElement).getByText('স্ক্যান চলছে')).toBeInTheDocument();
    expect(
      within(row as HTMLElement).getByRole('button', { name: 'শুধু চেম্বার' }),
    ).toBeInTheDocument();
  });

  /** সীমার বাইরের ফাইল সারিতেই ঢোকে না — server-এ পাঠিয়ে সময় নষ্ট নয়। */
  it('২৫ MB-র বড় ফাইল বাতিল হয় এবং কারণ দেখায়', async () => {
    const user = userEvent.setup();
    signIn();
    const { container } = renderPage();

    await screen.findByText('আরজি (প্লেইন্ট) — দাখিলকৃত কপি');
    await user.click(screen.getByRole('button', { name: /নথি যোগ/ }));

    const input = container.ownerDocument.querySelector<HTMLInputElement>('input[type="file"]');
    await user.upload(
      input as HTMLInputElement,
      makeFile('huge-scan.pdf', 'application/pdf', 30 * 1024 * 1024),
    );

    expect(await screen.findByText(/চেয়ে বড়/)).toBeInTheDocument();
    expect(screen.queryByText('অপেক্ষমাণ')).not.toBeInTheDocument();
  });

  /**
   * অসমর্থিত ধরনটি unit হিসেবে যাচাই — `<input accept>` থাকায় browser ও
   * `userEvent.upload` দুটোই ফাইলটি আগেই ছেঁটে দেয়, তাই UI দিয়ে এই শাখায়
   * পৌঁছানো যায় না। কিন্তু drag-drop-এ `accept` কিছুই আটকায় না, আর সেই
   * পথে এই যাচাইটিই একমাত্র রক্ষা।
   */
  it('অসমর্থিত ধরনের ফাইল সারিতে ঢোকে না', () => {
    const result = screenFiles([
      makeFile('affidavit.pdf'),
      makeFile('script.exe', 'application/x-msdownload'),
    ]);

    expect(result.accepted.map((file) => file.name)).toEqual(['affidavit.pdf']);
    expect(result.rejected).toEqual([
      expect.objectContaining({ reason: 'UNSUPPORTED_TYPE' }),
    ]);
  });
});

describe('সংস্করণ ইতিহাস', () => {
  it('পুরনো সংস্করণ তালিকায় থেকে যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderPage();

    const row = (await screen.findByText('আরজি (প্লেইন্ট) — দাখিলকৃত কপি')).closest('tr');
    await user.click(
      within(row as HTMLElement).getByRole('button', { name: /সংস্করণ — আরজি/ }),
    );

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('plaint-251-2024.pdf')).toBeInTheDocument();
    expect(within(dialog).getByText('plaint-draft.pdf')).toBeInTheDocument();
    expect(within(dialog).getByText('বর্তমান')).toBeInTheDocument();
    expect(within(dialog).getByText('প্রথম খসড়া')).toBeInTheDocument();
  });
});
