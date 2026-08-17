import type { CaseWriteRequest } from '@caseflow/api-types';
import {
  CASE_CATEGORIES,
  CASE_CATEGORY_LABELS,
  CASE_STATUSES,
  CASE_STATUS_LABELS,
  PARTY_SIDES,
  PARTY_SIDE_LABELS,
  caseWriteSchema,
  optionsOf,
} from '@caseflow/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { isApiError } from '@/shared/api/errors';
import { pickBilingual } from '@/shared/i18n/bilingual';
import { useLocale } from '@/shared/i18n/use-locale';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';

import { useClientOptions, useCourts, useCreateCase, useWorkflows } from '../api/use-cases';

interface CaseFormValues {
  case_number: string;
  case_year: number;
  title: string;
  court_id: string;
  case_category: string;
  our_side: string;
  status: string;
  filing_date: string;
  current_stage: string;
  client_ids: string[];
  subject_matter: string;
  relief_sought: string;
  internal_notes: string;
}

const STEP_FIELDS: Array<Array<keyof CaseFormValues>> = [
  ['case_number', 'case_year', 'title', 'case_category', 'our_side', 'status'],
  ['court_id', 'filing_date', 'current_stage'],
  ['client_ids', 'subject_matter', 'relief_sought', 'internal_notes'],
];

/**
 * F-CASE-01 — মামলা তৈরি, ৩ ধাপে।
 *
 * এক পাতায় ১৩টি ঘর দিলে ভুল বেশি হয়; ধাপে ভাগ করলে প্রতিটি ধাপ একটি
 * প্রশ্নের উত্তর দেয় — কোন মামলা, কোন আদালত, কার হয়ে।
 */
export default function CaseCreatePage() {
  const { t } = useTranslation();
  const { locale, language } = useLocale();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const createCase = useCreateCase();
  const { data: courts } = useCourts();
  const { data: workflows } = useWorkflows();
  const { data: clients } = useClientOptions();

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CaseFormValues>({
    resolver: zodResolver(caseWriteSchema),
    defaultValues: {
      case_number: '',
      case_year: new Date().getFullYear(),
      title: '',
      court_id: '',
      case_category: 'CIVIL',
      our_side: 'PLAINTIFF',
      status: 'ACTIVE',
      filing_date: '',
      current_stage: '',
      client_ids: [],
      subject_matter: '',
      relief_sought: '',
      internal_notes: '',
    },
  });

  const courtId = watch('court_id');
  const selectedClients = watch('client_ids');
  const selectedCourt = courts?.results.find((court) => court.id === courtId);
  const workflow = workflows?.results.find(
    (definition) => definition.court_type_code === selectedCourt?.court_type_code,
  );

  const messageFor = (key: keyof CaseFormValues): string | undefined =>
    errors[key] ? t(errors[key]?.message ?? 'validation.required') : undefined;

  async function nextStep() {
    const valid = await trigger(STEP_FIELDS[step] ?? []);
    if (valid) setStep((current) => Math.min(current + 1, STEP_FIELDS.length - 1));
  }

  const onSubmit = handleSubmit((values) => {
    const payload: CaseWriteRequest = {
      case_number: values.case_number,
      case_year: Number(values.case_year),
      title: values.title,
      court_id: values.court_id,
      case_category: values.case_category as CaseWriteRequest['case_category'],
      our_side: values.our_side as CaseWriteRequest['our_side'],
      status: values.status as CaseWriteRequest['status'],
      filing_date: values.filing_date || null,
      current_stage: values.current_stage || null,
      client_ids: values.client_ids,
      subject_matter: values.subject_matter || null,
      relief_sought: values.relief_sought || null,
      internal_notes: values.internal_notes || null,
    };
    createCase.mutate(payload, { onSuccess: (created) => navigate(`/cases/${created.id}`) });
  });

  const stepTitles = [
    t('cases.form.stepBasics'),
    t('cases.form.stepCourt'),
    t('cases.form.stepClients'),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/cases"
        className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        {t('cases.backToList')}
      </Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('cases.add')}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {t('cases.form.stepOf', { current: step + 1, total: STEP_FIELDS.length })} ·{' '}
          {stepTitles[step]}
        </p>
      </header>

      <ol className="flex gap-2" aria-label={t('cases.add')}>
        {stepTitles.map((title, index) => (
          <li key={title} className="flex-1">
            <span
              aria-current={index === step ? 'step' : undefined}
              className={cn(
                'block h-1.5 rounded-full',
                index <= step ? 'bg-primary' : 'bg-surface-muted',
              )}
            />
          </li>
        ))}
      </ol>

      <form
        onSubmit={onSubmit}
        noValidate
        className="space-y-5 rounded-xl border border-border bg-surface p-5"
      >
        {step === 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label={t('cases.form.caseNumber')}
                latin
                error={messageFor('case_number')}
                {...register('case_number')}
              />
              <Input
                label={t('cases.form.caseYear')}
                type="number"
                latin
                error={messageFor('case_year')}
                {...register('case_year', { valueAsNumber: true })}
              />
              <Select
                label={t('cases.form.status')}
                options={optionsOf(CASE_STATUSES, CASE_STATUS_LABELS, language)}
                error={messageFor('status')}
                {...register('status')}
              />
            </div>

            <Input
              label={t('cases.form.title')}
              hint={t('cases.form.titleHint')}
              error={messageFor('title')}
              {...register('title')}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label={t('cases.form.category')}
                options={optionsOf(CASE_CATEGORIES, CASE_CATEGORY_LABELS, language)}
                error={messageFor('case_category')}
                {...register('case_category')}
              />
              <Select
                label={t('cases.form.ourSide')}
                options={optionsOf(PARTY_SIDES, PARTY_SIDE_LABELS, language)}
                error={messageFor('our_side')}
                {...register('our_side')}
              />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Select
              label={t('cases.form.court')}
              placeholder="—"
              options={(courts?.results ?? []).map((court) => ({
                value: court.id,
                label: pickBilingual(court.name, court.name_bn, locale),
              }))}
              error={messageFor('court_id')}
              {...register('court_id')}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('cases.form.filingDate')}
                type="date"
                latin
                error={messageFor('filing_date')}
                {...register('filing_date')}
              />
              <Select
                label={t('cases.form.stage')}
                placeholder="—"
                options={(workflow?.stages ?? []).map((stage) => ({
                  value: stage.code,
                  label: pickBilingual(stage.name, stage.name_bn, locale),
                }))}
                error={messageFor('current_stage')}
                {...register('current_stage')}
              />
            </div>

            <p className="text-xs text-fg-subtle">{t('cases.form.stageHint')}</p>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-fg">
                {t('cases.form.clients')}
              </legend>

              {(clients?.results ?? []).length === 0 ? (
                <p className="text-sm text-fg-muted">{t('cases.form.noClients')}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(clients?.results ?? []).map((client) => {
                    const checked = selectedClients.includes(client.id);
                    return (
                      <label
                        key={client.id}
                        className={cn(
                          'inline-flex min-h-tap cursor-pointer items-center gap-2 rounded-full border px-3 text-sm',
                          checked
                            ? 'border-primary bg-primary-muted font-medium text-primary'
                            : 'border-border text-fg-muted hover:border-fg-subtle',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[hsl(var(--primary))]"
                          checked={checked}
                          onChange={(event) =>
                            setValue(
                              'client_ids',
                              event.target.checked
                                ? [...selectedClients, client.id]
                                : selectedClients.filter((id) => id !== client.id),
                              { shouldValidate: true },
                            )
                          }
                        />
                        {pickBilingual(client.full_name, client.full_name_bn, locale)}
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>

            <Textarea
              label={t('cases.form.subjectMatter')}
              error={messageFor('subject_matter')}
              {...register('subject_matter')}
            />
            <Textarea
              label={t('cases.form.reliefSought')}
              rows={2}
              error={messageFor('relief_sought')}
              {...register('relief_sought')}
            />
            <Textarea
              label={t('cases.form.internalNotes')}
              hint={t('cases.notes.banner')}
              error={messageFor('internal_notes')}
              {...register('internal_notes')}
            />
          </>
        ) : null}

        {createCase.error ? (
          <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            {t(isApiError(createCase.error) ? createCase.error.i18nKey : 'errors.unknown')}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
            {t('cases.form.back')}
          </Button>

          {step < STEP_FIELDS.length - 1 ? (
            <Button type="button" onClick={() => void nextStep()}>
              {t('cases.form.next')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Button>
          ) : (
            <Button type="submit" loading={createCase.isPending}>
              <Check className="h-4 w-4" aria-hidden />
              {t('cases.form.create')}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
