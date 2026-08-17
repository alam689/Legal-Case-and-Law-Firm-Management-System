import { screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useSessionStore } from '@/shared/auth/session.store';
import { clientUserFixture, listDocuments, setDocumentVisibility } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';

import PortalHomePage from '../pages/PortalHomePage';
import PortalCasesPage, { PortalCaseDetailPage } from '../pages/PortalCasesPage';
import PortalDocumentsPage, {
  PortalInvoicesPage,
  PortalNoticesPage,
} from '../pages/PortalMorePages';

function signInAsClient() {
  useSessionStore.setState({
    status: 'authenticated',
    user: { ...clientUserFixture, capabilities: [...clientUserFixture.capabilities] },
    accessToken: 'access-token-fixture',
  });
}

function renderPortal(route = '/portal') {
  return renderWithProviders(
    <Routes>
      <Route path="/portal" element={<PortalHomePage />} />
      <Route path="/portal/cases" element={<PortalCasesPage />} />
      <Route path="/portal/cases/:caseId" element={<PortalCaseDetailPage />} />
      <Route path="/portal/documents" element={<PortalDocumentsPage />} />
      <Route path="/portal/invoices" element={<PortalInvoicesPage />} />
      <Route path="/portal/notices" element={<PortalNoticesPage />} />
    </Routes>,
    { route },
  );
}

describe('মক্কেলের হোম (P1)', () => {
  /** P1-এর একমাত্র আসল প্রশ্ন — এটিই সবচেয়ে উপরে থাকতে হবে। */
  it('পরবর্তী তারিখ সবার উপরে দেখায়', async () => {
    signInAsClient();
    renderPortal();

    expect(await screen.findByText('আপনার পরবর্তী তারিখ')).toBeInTheDocument();
    expect(screen.getByText('২৫১/২০২৪')).toBeInTheDocument();
  });

  it('উপস্থিতি লাগবে কি না স্পষ্ট করে বলে', async () => {
    signInAsClient();
    renderPortal();

    await screen.findByText('আপনার পরবর্তী তারিখ');
    expect(screen.getByText('আপনাকে আদালতে উপস্থিত থাকতে হবে')).toBeInTheDocument();
  });

  it('চেম্বারে ফোন করার লিংক থাকে', async () => {
    signInAsClient();
    renderPortal();

    const call = await screen.findByRole('link', { name: /চেম্বারে ফোন করুন/ });
    expect(call).toHaveAttribute('href', 'tel:01712345678');
  });
});

describe('মক্কেলের মামলা (P1)', () => {
  it('শুধু নিজের মামলা দেখায়', async () => {
    signInAsClient();
    renderPortal('/portal/cases');

    expect(await screen.findByText('২৫১/২০২৪')).toBeInTheDocument();
    // client-1 শুধু case-1-এর সাথে যুক্ত; অন্য মামলা এখানে আসবে না
    expect(screen.queryByText('৮৭/২০২৩')).not.toBeInTheDocument();
    expect(screen.queryByText('১৪/২০২৫')).not.toBeInTheDocument();
  });

  /**
   * ⚠ A4-এর মূল পাহারা। অন্যের মামলার id সরাসরি টাইপ করলেও কিছু দেখা
   * যাবে না — এবং "অনুমতি নেই" নয়, "পাওয়া যায়নি", যাতে মামলাটির
   * অস্তিত্বও ফাঁস না হয়।
   */
  it('অন্যের মামলার id দিলে কিছুই দেখায় না', async () => {
    signInAsClient();
    renderPortal('/portal/cases/case-2');

    expect(await screen.findByText('পাওয়া যায়নি')).toBeInTheDocument();
    expect(screen.queryByText(/ভূমি জরিপ ট্রাইব্যুনাল/)).not.toBeInTheDocument();
  });

  it('পর্যায় কোড নয়, নাম দেখায়', async () => {
    signInAsClient();
    renderPortal('/portal/cases/case-1');

    await screen.findByText('২৫১/২০২৪');
    // `PLAINTIFF_EVIDENCE` কখনো মক্কেলের চোখে পড়বে না
    expect(screen.queryByText(/PLAINTIFF_EVIDENCE/)).not.toBeInTheDocument();
  });

  it('টাইমলাইনে শুধু দৃশ্যমান ঘটনা থাকে', async () => {
    signInAsClient();
    renderPortal('/portal/cases/case-1');

    const heading = await screen.findByText('যা যা হয়েছে');
    expect(heading).toBeInTheDocument();
    // চেম্বারের internal note কখনো portal-এ আসে না
    expect(screen.queryByText(/হস্তলিপি বিশেষজ্ঞ/)).not.toBeInTheDocument();
  });
});

describe('মক্কেলের কাগজপত্র (A4)', () => {
  it('শুধু দৃশ্যমান করা নথি দেখায়', async () => {
    signInAsClient();
    renderPortal('/portal/documents');

    // doc-1 client_visible: true
    expect(await screen.findByText('আরজি (প্লেইন্ট) — দাখিলকৃত কপি')).toBeInTheDocument();
    // doc-2 client_visible: false — প্রতিপক্ষের জবাব মক্কেলের চোখে পড়বে না
    expect(screen.queryByText('প্রতিপক্ষের লিখিত জবাব')).not.toBeInTheDocument();
  });

  /** আইনজীবী দৃশ্যমান করলে সেটি সাথে সাথেই মক্কেলের কাছে পৌঁছায়। */
  it('দৃশ্যমান করলে নথিটি মক্কেলের তালিকায় আসে', async () => {
    signInAsClient();
    setDocumentVisibility('doc-2', true);

    renderPortal('/portal/documents');

    expect(await screen.findByText('প্রতিপক্ষের লিখিত জবাব')).toBeInTheDocument();
  });

  /**
   * দেখানোর সিদ্ধান্ত আর ফাইল খোলা এক নয় — doc-6 মক্কেল-দৃশ্যমান, কিন্তু
   * স্ক্যান শেষ হয়নি, তাই ডাউনলোডের লিংক নেই।
   */
  it('স্ক্যান শেষ না হলে মক্কেলও ফাইল খুলতে পারেন না', async () => {
    signInAsClient();
    renderPortal('/portal/documents');

    const row = (await screen.findByText('আদালতের রসিদ — কোর্ট ফি')).closest('li');
    expect(within(row as HTMLElement).getByText('ফাইলটি এখনো প্রস্তুত হয়নি।')).toBeInTheDocument();
    expect(within(row as HTMLElement).queryByRole('link')).not.toBeInTheDocument();
  });

  /**
   * অন্য মামলার নথি দৃশ্যমান করলেও এই মক্কেলের তালিকায় আসে না —
   * দৃশ্যমানতা আর মালিকানা দুটো আলাদা ছাঁকনি, দুটোই পার হতে হয়।
   */
  it('অন্য মামলার দৃশ্যমান নথিও এই মক্কেল দেখেন না', async () => {
    signInAsClient();
    // doc-5 case-2-এর, আর demo মক্কেল শুধু case-1-এর সাথে যুক্ত
    setDocumentVisibility('doc-5', true);
    listDocuments();

    renderPortal('/portal/documents');

    await screen.findByText('আরজি (প্লেইন্ট) — দাখিলকৃত কপি');
    expect(screen.queryByText('আদালতের আদেশ — ২১ জুলাই')).not.toBeInTheDocument();
  });
});

describe('মক্কেলের বিল ও বার্তা', () => {
  it('বকেয়ার মোট অঙ্ক দেখায়, কিন্তু টাকা পাঠানোর পথ নেই', async () => {
    signInAsClient();
    renderPortal('/portal/invoices');

    expect(await screen.findByText('মোট বকেয়া')).toBeInTheDocument();
    expect(
      screen.getByText(/পরিশোধের জন্য চেম্বারে যোগাযোগ করুন/),
    ).toBeInTheDocument();
  });

  it('খসড়া চালান মক্কেল দেখতে পান না', async () => {
    signInAsClient();
    renderPortal('/portal/invoices');

    await waitFor(() => expect(screen.queryByText('খসড়া')).not.toBeInTheDocument());
  });

  it('পাঠানো বার্তাগুলো তালিকায় থাকে', async () => {
    signInAsClient();
    renderPortal('/portal/notices');

    expect(await screen.findByText(/পরবর্তী তারিখ/)).toBeInTheDocument();
  });
});
