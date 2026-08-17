import type { ClientListItem, CursorPage } from '@caseflow/api-types';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { http } from '@/shared/api/http';
import { qk } from '@/shared/api/query-keys';
import { pickBilingual } from '@/shared/i18n/bilingual';
import { useLocale } from '@/shared/i18n/use-locale';
import { Card } from '@/shared/ui/Card';

import { useCreateInvoice } from '../api/use-billing';
import { InvoiceForm } from '../components/InvoiceForm';

/**
 * মক্কেলের তালিকা — `features/clients` থেকে hook import করা হয়নি (§4),
 * কিন্তু query key একই, তাই cache ভাগাভাগি হয়।
 */
function useClientOptions() {
  return useQuery({
    queryKey: qk.clients.list(''),
    queryFn: () => http.get<CursorPage<ClientListItem>>('/clients'),
    staleTime: 30_000,
  });
}

/** F-BILL-03 — নতুন চালান। সফল হলে সরাসরি সেটির পাতায়। */
export default function InvoiceCreatePage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const createInvoice = useCreateInvoice();
  const clients = useClientOptions();

  const clientOptions = useMemo(
    () =>
      (clients.data?.results ?? []).map((client) => ({
        value: client.id,
        label: pickBilingual(client.full_name, client.full_name_bn, locale),
      })),
    [clients.data, locale],
  );

  return (
    <div className="space-y-6">
      <Link
        to="/billing/invoices"
        className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        {t('billing.title')}
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-fg">
        {t('billing.invoice.createTitle')}
      </h1>

      <Card>
        <InvoiceForm
          clientOptions={clientOptions}
          pending={createInvoice.isPending}
          error={createInvoice.error}
          onCancel={() => navigate('/billing/invoices')}
          onSubmit={(body) =>
            createInvoice.mutate(body, {
              onSuccess: (created) => navigate(`/billing/invoices/${created.id}`),
            })
          }
        />
      </Card>
    </div>
  );
}
