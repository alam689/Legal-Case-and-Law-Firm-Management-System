import type { InvoiceDetail, InvoiceWriteRequest } from '@caseflow/api-types';
import {
  INVOICE_LINE_CATEGORIES,
  INVOICE_LINE_CATEGORY_LABELS,
  invoiceTotals,
  invoiceWriteSchema,
  multiplyMoney,
  optionsOf,
} from '@caseflow/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { isApiError } from '@/shared/api/errors';
import { useCaseOptions } from '@/shared/api/reference';
import { formatMoney } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Money } from '@/shared/ui/DateText';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';

interface LineValues {
  category: string;
  description: string;
  quantity: string;
  unit_amount: string;
}

interface FormValues {
  client_id: string;
  case_id: string;
  issue_date: string;
  due_date: string;
  discount: string;
  note: string;
  lines: LineValues[];
}

const EMPTY_LINE: LineValues = {
  category: 'PROFESSIONAL_FEE',
  description: '',
  quantity: '1',
  unit_amount: '',
};

/**
 * F-BILL-03 — চালানের ফর্ম, live total সহ।
 *
 * যোগফল প্রতিটি keystroke-এ হালনাগাদ হয়, কিন্তু হিসাবটি
 * `@caseflow/domain`-এর `invoiceTotals()` দিয়ে — ঠিক যে function টি mock
 * server ব্যবহার করে। তাই যা টাইপ করতে করতে দেখা যায় আর সংরক্ষণের পরে যা
 * থাকে, দুটো এক। আলাদা করে হিসাব লিখলে সেই দুটো একদিন আলাদা হতই।
 */
export function InvoiceForm({
  invoice,
  clientOptions,
  onSubmit,
  pending,
  error,
  onCancel,
}: {
  invoice?: InvoiceDetail;
  clientOptions: ReadonlyArray<{ value: string; label: string }>;
  onSubmit: (body: InvoiceWriteRequest) => void;
  pending: boolean;
  error?: unknown;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const { locale, language } = useLocale();
  const caseList = useCaseOptions();

  const categoryOptions = useMemo(
    () => optionsOf(INVOICE_LINE_CATEGORIES, INVOICE_LINE_CATEGORY_LABELS, language),
    [language],
  );

  const caseOptions = useMemo(
    () =>
      (caseList.data?.results ?? []).map((item) => ({
        value: item.id,
        label: `${item.display_number} — ${item.title}`,
      })),
    [caseList.data],
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(invoiceWriteSchema),
    defaultValues: invoice
      ? {
          client_id: invoice.client_id ?? '',
          case_id: invoice.case_id ?? '',
          issue_date: invoice.issue_date ?? '',
          due_date: invoice.due_date ?? '',
          discount: invoice.discount,
          note: invoice.note ?? '',
          lines: invoice.lines.map((line) => ({
            category: line.category,
            description: line.description,
            quantity: line.quantity,
            unit_amount: line.unit_amount,
          })),
        }
      : {
          client_id: '',
          case_id: '',
          issue_date: '',
          due_date: '',
          discount: '',
          note: '',
          lines: [EMPTY_LINE],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  // Live total — প্রতিটি keystroke-এ, কিন্তু server-এর মতো একই হিসাবে
  const watchedLines = useWatch({ control, name: 'lines' }) ?? [];
  const watchedDiscount = useWatch({ control, name: 'discount' }) ?? '';
  const totals = invoiceTotals(
    watchedLines.map((line) => ({
      quantity: line?.quantity ?? '0',
      unit_amount: line?.unit_amount ?? '0',
    })),
    watchedDiscount || '0.00',
  );

  const messageFor = (path: string): string | undefined => {
    const found = path
      .split('.')
      .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], errors);
    const message = (found as { message?: string } | undefined)?.message;
    return message ? t(message) : undefined;
  };

  function submit(values: FormValues) {
    onSubmit({
      client_id: values.client_id,
      case_id: values.case_id || null,
      issue_date: values.issue_date || null,
      due_date: values.due_date || null,
      discount: values.discount || '0.00',
      note: values.note || null,
      lines: values.lines.map((line) => ({
        category: line.category as InvoiceWriteRequest['lines'][number]['category'],
        description: line.description,
        quantity: line.quantity,
        unit_amount: line.unit_amount,
      })),
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label={t('billing.fields.client')}
          options={clientOptions}
          placeholder="—"
          error={messageFor('client_id')}
          {...register('client_id')}
        />
        <Select
          label={t('billing.fields.case')}
          options={caseOptions}
          placeholder={t('billing.fields.noCase')}
          error={messageFor('case_id')}
          {...register('case_id')}
        />
        <Input
          label={t('billing.fields.issueDate')}
          type="date"
          latin
          error={messageFor('issue_date')}
          {...register('issue_date')}
        />
        <Input
          label={t('billing.fields.dueDate')}
          type="date"
          latin
          error={messageFor('due_date')}
          {...register('due_date')}
        />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-fg">{t('billing.lines.title')}</h3>
          <Button type="button" variant="secondary" onClick={() => append(EMPTY_LINE)}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('billing.lines.add')}
          </Button>
        </div>

        {messageFor('lines') ? (
          <p role="alert" className="text-xs font-medium text-danger">
            {messageFor('lines')}
          </p>
        ) : null}

        <ul className="space-y-3">
          {fields.map((field, index) => {
            const line = watchedLines[index];
            return (
              <li key={field.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
                  <Input
                    label={t('billing.lines.description')}
                    error={messageFor(`lines.${index}.description`)}
                    {...register(`lines.${index}.description` as const)}
                  />
                  <Select
                    label={t('billing.lines.category')}
                    options={categoryOptions}
                    error={messageFor(`lines.${index}.category`)}
                    {...register(`lines.${index}.category` as const)}
                  />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)_auto]">
                  <Input
                    label={t('billing.lines.quantity')}
                    latin
                    inputMode="decimal"
                    error={messageFor(`lines.${index}.quantity`)}
                    {...register(`lines.${index}.quantity` as const)}
                  />
                  <Input
                    label={t('billing.lines.unitAmount')}
                    latin
                    inputMode="decimal"
                    error={messageFor(`lines.${index}.unit_amount`)}
                    {...register(`lines.${index}.unit_amount` as const)}
                  />

                  <div className="flex items-end justify-between gap-2 sm:justify-end">
                    <p className="text-sm">
                      <span className="block text-xs text-fg-subtle">
                        {t('billing.lines.amount')}
                      </span>
                      <Money
                        value={multiplyMoney(line?.quantity ?? '0', line?.unit_amount ?? '0')}
                        className="font-semibold"
                      />
                    </p>
                    {fields.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t('billing.lines.remove')}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t('billing.fields.discount')}
          latin
          inputMode="decimal"
          error={messageFor('discount')}
          {...register('discount')}
        />

        <dl
          aria-live="polite"
          className="space-y-1 rounded-lg border border-border bg-surface-muted/50 p-3 text-sm"
        >
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">{t('billing.totals.subtotal')}</dt>
            <dd>
              <Money value={totals.subtotal} />
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">{t('billing.totals.discount')}</dt>
            <dd>
              <Money value={totals.discount} />
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-1 font-semibold">
            <dt>{t('billing.totals.total')}</dt>
            <dd>
              <span className="font-latin tabular-nums">
                {formatMoney(totals.total, locale)}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <p className="text-xs text-fg-subtle">{t('billing.totals.liveHint')}</p>

      <Textarea
        label={t('billing.fields.note')}
        rows={2}
        error={messageFor('note')}
        {...register('note')}
      />

      {error ? (
        <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {t(isApiError(error) ? error.i18nKey : 'errors.unknown')}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={pending}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
