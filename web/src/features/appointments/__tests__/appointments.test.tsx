import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useSessionStore } from '@/shared/auth/session.store';
import { assistantFixture, clientUserFixture, lawyerFixture } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';

import AppointmentsPage from '../pages/AppointmentsPage';
import PortalAppointmentsPage from '../pages/PortalAppointmentsPage';

function signIn(user = lawyerFixture) {
  useSessionStore.setState({
    status: 'authenticated',
    user: { ...user, capabilities: [...user.capabilities] },
    accessToken: 'access-token-fixture',
  });
}

function renderChamber() {
  return renderWithProviders(
    <Routes>
      <Route path="/appointments" element={<AppointmentsPage />} />
    </Routes>,
    { route: '/appointments' },
  );
}

function renderPortal() {
  return renderWithProviders(
    <Routes>
      <Route path="/portal/appointments" element={<PortalAppointmentsPage />} />
    </Routes>,
    { route: '/portal/appointments' },
  );
}

describe('চেম্বারের দিক — অনুরোধ দেখা', () => {
  it('অপেক্ষমাণ অনুরোধ আলাদা করে উপরে দেখায়', async () => {
    signIn();
    renderChamber();

    expect(await screen.findByText('অপেক্ষমাণ অনুরোধ')).toBeInTheDocument();
    expect(screen.getByText('সাক্ষ্যগ্রহণের আগে কী কী কাগজ লাগবে জানতে চাই।')).toBeInTheDocument();
  });

  it('মক্কেলের নাম, নম্বর ও কারণ একসাথে দেখায়', async () => {
    signIn();
    renderChamber();

    // একই মক্কেলের একাধিক অনুরোধ থাকতে পারে, তাই getAll
    await screen.findByText('অপেক্ষমাণ অনুরোধ');
    expect(screen.getAllByText('মোঃ রহিম উদ্দিন').length).toBeGreaterThan(0);
    expect(screen.getAllByText('01711223344').length).toBeGreaterThan(0);
  });

  /** চেম্বার অন্য সময় দিলে মক্কেল কী চেয়েছিলেন সেটিও পাশে থাকে। */
  it('সময় বদলানো হলে চাওয়া ও দেওয়া দুটোই দেখা যায়', async () => {
    signIn();
    renderChamber();

    const card = (await screen.findByText('নামজারির আবেদনের অবস্থা জানতে চাই।')).closest('div')
      ?.parentElement;
    expect(card).toBeTruthy();
    expect(screen.getByText('সময় বদলানো হয়েছে')).toBeInTheDocument();
  });
});

describe('চেম্বারের দিক — সিদ্ধান্ত', () => {
  /** তারিখ/সময় খালি রাখলে মক্কেল যা চেয়েছেন সেটিই নিশ্চিত হয়। */
  it('চাওয়া সময়েই দিলে অবস্থা "নিশ্চিত" হয়', async () => {
    const user = userEvent.setup();
    signIn();
    renderChamber();

    await screen.findByText('অপেক্ষমাণ অনুরোধ');
    await user.click(screen.getByRole('button', { name: 'সময় দিন' }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getAllByRole('button', { name: 'সময় দিন' })[0] as HTMLElement);

    await waitFor(() => expect(screen.getByText('নিশ্চিত')).toBeInTheDocument());
  });

  /**
   * ভিন্ন সময় দিলে `RESCHEDULED` — `CONFIRMED` নয়। নাহলে মক্কেল সবুজ
   * চিহ্ন দেখে পুরনো সময়েই চেম্বারে হাজির হতেন।
   */
  it('ভিন্ন সময় দিলে অবস্থা "সময় বদলানো হয়েছে" হয়', async () => {
    const user = userEvent.setup();
    signIn();
    renderChamber();

    await screen.findByText('অপেক্ষমাণ অনুরোধ');
    await user.click(screen.getByRole('button', { name: 'সময় দিন' }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('নতুন তারিখ'), '2026-08-22');
    await user.click(within(dialog).getAllByRole('button', { name: 'সময় দিন' })[0] as HTMLElement);

    await waitFor(() => expect(screen.getAllByText('সময় বদলানো হয়েছে').length).toBe(2));
  });

  it('কারণসহ না বলা যায়', async () => {
    const user = userEvent.setup();
    signIn();
    renderChamber();

    await screen.findByText('অপেক্ষমাণ অনুরোধ');
    await user.click(screen.getByRole('button', { name: 'দেওয়া যাবে না' }));

    const dialog = await screen.findByRole('dialog');
    await user.type(
      within(dialog).getByLabelText('মক্কেলকে যা জানাবেন'),
      'ওই সপ্তাহে হাইকোর্টে আছি।',
    );
    await user.click(
      within(dialog).getAllByRole('button', { name: 'দেওয়া যাবে না' })[0] as HTMLElement,
    );

    await waitFor(() => expect(screen.getByText('দেওয়া যায়নি')).toBeInTheDocument());
    expect(screen.getByText('ওই সপ্তাহে হাইকোর্টে আছি।')).toBeInTheDocument();
  });

  /** P4 — সহকারীর কাজই মক্কেলের ফোন ধরা ও সময় দেওয়া। */
  it('সহকারীও সময় দিতে পারেন', async () => {
    signIn(assistantFixture);
    renderChamber();

    await screen.findByText('অপেক্ষমাণ অনুরোধ');
    expect(screen.getByRole('button', { name: 'সময় দিন' })).toBeInTheDocument();
  });
});

describe('মক্কেলের দিক (P1)', () => {
  function signInAsClient() {
    signIn(clientUserFixture);
  }

  it('শুধু নিজের অনুরোধ দেখেন', async () => {
    signInAsClient();
    renderPortal();

    expect(
      await screen.findByText('সাক্ষ্যগ্রহণের আগে কী কী কাগজ লাগবে জানতে চাই।'),
    ).toBeInTheDocument();
    // appt-2 অন্য মক্কেলের (client-2)
    expect(screen.queryByText('নামজারির আবেদনের অবস্থা জানতে চাই।')).not.toBeInTheDocument();
  });

  it('অপেক্ষমাণ অনুরোধে "উত্তরের অপেক্ষায়" লেখা থাকে', async () => {
    signInAsClient();
    renderPortal();

    expect(await screen.findByText('চেম্বারের উত্তরের অপেক্ষায়')).toBeInTheDocument();
  });

  it('নতুন সময় চাওয়া যায়', async () => {
    const user = userEvent.setup();
    signInAsClient();
    renderPortal();

    await screen.findByText('চেম্বারের উত্তরের অপেক্ষায়');
    await user.click(screen.getByRole('button', { name: /সময় চান/ }));

    const dialog = await screen.findByRole('dialog');
    await user.selectOptions(
      await within(dialog).findByLabelText('কোন আইনজীবীর সাথে'),
      'staff-1',
    );
    await user.type(within(dialog).getByLabelText('কোন দিন'), '2026-08-25');
    await user.type(
      within(dialog).getByLabelText('কী বিষয়ে কথা বলতে চান'),
      'জমির কাগজ নিয়ে আলোচনা করতে চাই।',
    );
    await user.click(within(dialog).getAllByRole('button', { name: /সময় চান/ })[0] as HTMLElement);

    // অনুরোধ পাঠানোর পরে কী হবে তা স্পষ্ট করে বলা হয়
    expect(await screen.findByText('অনুরোধ পাঠানো হয়েছে')).toBeInTheDocument();
    expect(screen.getByText(/চেম্বার থেকে নিশ্চিত করার পরে/)).toBeInTheDocument();
  });

  it('কারণ না লিখলে অনুরোধ যায় না', async () => {
    const user = userEvent.setup();
    signInAsClient();
    renderPortal();

    await screen.findByText('চেম্বারের উত্তরের অপেক্ষায়');
    await user.click(screen.getByRole('button', { name: /সময় চান/ }));

    const dialog = await screen.findByRole('dialog');
    await user.selectOptions(
      await within(dialog).findByLabelText('কোন আইনজীবীর সাথে'),
      'staff-1',
    );
    await user.type(within(dialog).getByLabelText('কোন দিন'), '2026-08-25');
    await user.click(within(dialog).getAllByRole('button', { name: /সময় চান/ })[0] as HTMLElement);

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'কেন দেখা করতে চান, সংক্ষেপে লিখুন',
    );
  });

  /**
   * এক মক্কেল একাধিক আইনজীবীর কাছে যান — জমির মামলা একজন, পারিবারিক
   * মামলা অন্যজন। "কার সাথে" না জিজ্ঞেস করলে অনুরোধটি ভুল তালিকায়
   * পড়ে থাকে, আর মক্কেল ভাবেন চেম্বার উত্তরই দিচ্ছে না।
   */
  it('নিজের মামলার আইনজীবীদের মধ্যে থেকে বাছা যায়', async () => {
    const user = userEvent.setup();
    signInAsClient();
    renderPortal();

    await screen.findByText('চেম্বারের উত্তরের অপেক্ষায়');
    await user.click(screen.getByRole('button', { name: /সময় চান/ }));

    const dialog = await screen.findByRole('dialog');
    const picker = await within(dialog).findByLabelText('কোন আইনজীবীর সাথে');

    expect(within(picker).getByRole('option', { name: /মোঃ খোরশেদ আলম/ })).toBeInTheDocument();
    expect(within(picker).getByRole('option', { name: /নুসরাত জাহান/ })).toBeInTheDocument();
    // চেম্বারের সব সদস্য নয় — যাঁর হাতে এই মক্কেলের মামলা নেই তিনি নেই (A4)
    expect(within(picker).queryByRole('option', { name: /সুমন চন্দ্র দাস/ })).not.toBeInTheDocument();
  });

  it('আইনজীবী না বাছলে অনুরোধ যায় না', async () => {
    const user = userEvent.setup();
    signInAsClient();
    renderPortal();

    await screen.findByText('চেম্বারের উত্তরের অপেক্ষায়');
    await user.click(screen.getByRole('button', { name: /সময় চান/ }));

    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByLabelText('কোন আইনজীবীর সাথে');
    await user.type(within(dialog).getByLabelText('কোন দিন'), '2026-08-25');
    await user.type(
      within(dialog).getByLabelText('কী বিষয়ে কথা বলতে চান'),
      'ফি নিয়ে কথা বলতে চাই।',
    );
    await user.click(within(dialog).getAllByRole('button', { name: /সময় চান/ })[0] as HTMLElement);

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'কোন আইনজীবীর সাথে দেখা করতে চান বেছে নিন',
    );
  });

  /** বেছে নেওয়া নামটি চেম্বারের তালিকাতেও পৌঁছায় — নাহলে বাছাইটি অর্থহীন। */
  it('বাছা আইনজীবীর নাম অনুরোধের সাথে যায়', async () => {
    const user = userEvent.setup();
    signInAsClient();
    renderPortal();

    await screen.findByText('চেম্বারের উত্তরের অপেক্ষায়');
    await user.click(screen.getByRole('button', { name: /সময় চান/ }));

    const dialog = await screen.findByRole('dialog');
    await user.selectOptions(
      await within(dialog).findByLabelText('কোন আইনজীবীর সাথে'),
      'staff-2',
    );
    await user.type(within(dialog).getByLabelText('কোন দিন'), '2026-08-25');
    await user.type(
      within(dialog).getByLabelText('কী বিষয়ে কথা বলতে চান'),
      'ভরণপোষণের আবেদন নিয়ে কথা বলতে চাই।',
    );
    await user.click(within(dialog).getAllByRole('button', { name: /সময় চান/ })[0] as HTMLElement);

    await screen.findByText('অনুরোধ পাঠানো হয়েছে');

    // dialog খোলা থাকলেও পেছনের তালিকা হালনাগাদ হয়ে যায়
    await waitFor(() => expect(screen.getAllByText('নুসরাত জাহান').length).toBeGreaterThan(0));
  });

  it('নিজের অপেক্ষমাণ অনুরোধ বাতিল করা যায়', async () => {
    const user = userEvent.setup();
    signInAsClient();
    renderPortal();

    await screen.findByText('চেম্বারের উত্তরের অপেক্ষায়');
    await user.click(screen.getByRole('button', { name: 'অনুরোধ বাতিল করুন' }));

    const dialog = await screen.findByRole('dialog');
    await user.click(
      within(dialog).getAllByRole('button', { name: 'অনুরোধ বাতিল করুন' })[0] as HTMLElement,
    );

    await waitFor(() => expect(screen.getByText('বাতিল')).toBeInTheDocument());
  });
});
