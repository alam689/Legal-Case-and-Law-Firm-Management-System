import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { JUDICIAL_INSTITUTIONS } from '../institutions';
import LandingPage from '../pages/LandingPage';

describe('LandingPage', () => {
  it('hero, CTA ও feature section দেখায়', () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('প্রতিটি তারিখ নিখুঁত,');
    expect(screen.getAllByRole('link', { name: /শুরু করুন/ }).length).toBeGreaterThan(0);
    expect(screen.getByText('একটি চেম্বারের যা যা দরকার, এক জায়গায়')).toBeInTheDocument();
  });

  it('sign in ও get started লিংক /login-এ যায়', () => {
    renderWithProviders(<LandingPage />);

    for (const name of ['সাইন ইন', 'শুরু করুন']) {
      const links = screen.getAllByRole('link', { name });
      expect(links[0]).toHaveAttribute('href', '/login');
    }
  });

  it('disclaimer footer-এ থাকে (N13)', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText(/আইনি পরামর্শ দেয় না/)).toBeInTheDocument();
  });

  /**
   * ★ লগইন ছাড়া প্রথম পাতায় আইনজীবীর ড্যাশবোর্ড দেখানো হবে না —
   * নমুনা হিসেবেও নয়। মামলা নম্বর, শুনানির তারিখ বা বকেয়ার অঙ্ক
   * সর্বজনীন পাতায় থাকা মানে ভুল বার্তা দেওয়া।
   */
  describe('ড্যাশবোর্ডের কোনো ঝলক নেই', () => {
    it('ড্যাশবোর্ড শব্দ বা নমুনা লেবেল নেই', () => {
      renderWithProviders(<LandingPage />);

      expect(screen.queryByText(/আইনজীবীর ড্যাশবোর্ড/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Advocate dashboard/)).not.toBeInTheDocument();
      expect(screen.queryByText('নমুনা')).not.toBeInTheDocument();
    });

    it('কোনো নমুনা মামলা নম্বর, শুনানির সময় বা বকেয়ার অঙ্ক নেই', () => {
      const { container } = renderWithProviders(<LandingPage />);
      const body = container.textContent ?? '';

      // মামলা নম্বর (২৫১/২০২৪ ধরনের), ঘড়ির সময় ও টাকার অঙ্ক
      expect(body).not.toMatch(/[০-৯]+\/[০-৯]{4}/);
      expect(body).not.toMatch(/\d{1,2}:\d{2}/);
      expect(body).not.toMatch(/৳/);
      expect(body).not.toMatch(/পরবর্তী শুনানি|Next hearing/);
      expect(body).not.toMatch(/আজকের কার্যতালিকা|Today's agenda/);
    });

    it('বদলে সর্বজনীন highlight ও ক্যালকুলেটরের লিংক আছে', () => {
      renderWithProviders(<LandingPage />);

      expect(screen.getByText('এক নজরে')).toBeInTheDocument();
      const link = screen.getAllByRole('link', { name: /উত্তরাধিকার ক্যালকুলেটর/ })[0];
      expect(link).toHaveAttribute('href', '#calculator');
    });
  });

  describe('বিচার সংশ্লিষ্ট প্রতিষ্ঠান', () => {
    it('প্রতিটি প্রতিষ্ঠানের লিংক আছে, নতুন ট্যাবে ও noopener সহ', () => {
      renderWithProviders(<LandingPage />);

      for (const institution of JUDICIAL_INSTITUTIONS) {
        const link = screen.getByRole('link', { name: new RegExp(institution.nameBn) });
        expect(link).toHaveAttribute('href', institution.url);
        expect(link).toHaveAttribute('target', '_blank');
        expect(link.getAttribute('rel')).toContain('noopener');
      }
    });

    /**
     * Positioning — platform সরকারি system-এর প্রতিস্থাপন নয় এবং কোনো
     * প্রতিষ্ঠানের অনুমোদিত নয়। সেটি লেখা না থাকলে লিংকগুলো সম্পর্ক বোঝাতে পারে।
     */
    it('affiliation নেই — সেটি স্পষ্ট লেখা আছে', () => {
      renderWithProviders(<LandingPage />);
      expect(screen.getByText(/সম্পর্কিত বা তাদের অনুমোদিত নয়/)).toBeInTheDocument();
    });

    it('সব URL https বা সরকারি ডোমেইন', () => {
      for (const institution of JUDICIAL_INSTITUTIONS) {
        expect(institution.url).toMatch(/^https?:\/\/[\w.-]+\.gov\.bd/);
      }
    });
  });
});
