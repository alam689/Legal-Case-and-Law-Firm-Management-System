import { useTranslation } from 'react-i18next';

import { Card } from '@/shared/ui/Card';

/**
 * Route map (docs/05-frontend-plan.md §5) অনুযায়ী nav item গুলো day one থেকেই
 * আছে, কিন্তু screen পরের sprint-এ। 404-এর বদলে সৎ placeholder —
 * pilot lawyer-কে demo দেওয়ার সময় "কী কখন আসছে" স্পষ্ট থাকে।
 */
export function ComingSoonPage({ titleKey, sprint }: { titleKey: string; sprint: number }) {
  const { t } = useTranslation();
  return (
    <Card className="mx-auto max-w-lg text-center">
      <h1 className="text-lg font-semibold">{t(titleKey)}</h1>
      {/* eslint-disable-next-line no-restricted-syntax -- developer-facing placeholder, pilot build-এ থাকবে না */}
      <p className="mt-2 text-sm text-fg-muted">Sprint {sprint} · docs/05-frontend-plan.md</p>
    </Card>
  );
}
