import type { CaseDetail, WorkflowDefinitionSummary } from '@caseflow/api-types';
import { PARTY_SIDE_LABELS, PARTY_TYPE_LABELS, label } from '@caseflow/domain';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { pickBilingual } from '@/shared/i18n/bilingual';
import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';
import { Card, CardHeader } from '@/shared/ui/Card';
import { DateText } from '@/shared/ui/DateText';
import { EmptyState } from '@/shared/ui/states';

import { StageStepper } from './StageStepper';

export function CaseOverviewTab({
  caseDetail,
  workflow,
}: {
  caseDetail: CaseDetail;
  workflow: WorkflowDefinitionSummary | undefined;
}) {
  const { t } = useTranslation();
  const { locale, language } = useLocale();

  return (
    <div className="space-y-6">
      <Card>
        <StageStepper workflow={workflow} currentStage={caseDetail.current_stage} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t('cases.detail.subjectMatter')} />
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
            {caseDetail.subject_matter || t('cases.detail.notProvided')}
          </p>

          {caseDetail.relief_sought ? (
            <>
              <h3 className="mt-5 text-sm font-semibold text-fg">
                {t('cases.detail.reliefSought')}
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                {caseDetail.relief_sought}
              </p>
            </>
          ) : null}
        </Card>

        <Card>
          <dl className="space-y-3 text-sm">
            <Field label={t('cases.detail.filingDate')}>
              <DateText value={caseDetail.filing_date} />
            </Field>
            <Field label={t('cases.detail.ourSide')}>
              {label(PARTY_SIDE_LABELS, caseDetail.our_side, language)}
            </Field>
            <Field label={t('cases.table.court')}>
              {caseDetail.court
                ? pickBilingual(caseDetail.court.name, caseDetail.court.name_bn, locale)
                : '—'}
            </Field>
            <Field label={t('cases.detail.assignedLawyer')}>
              {caseDetail.assigned_lawyer_name ?? '—'}
            </Field>
          </dl>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('cases.detail.clients')} />
          {caseDetail.clients.length === 0 ? (
            <EmptyState body={t('clients.detail.noCases')} />
          ) : (
            <ul className="divide-y divide-border">
              {caseDetail.clients.map((client) => (
                <li key={client.id} className="py-2.5">
                  <Link
                    to={`/clients/${client.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm hover:text-primary"
                  >
                    <span className="font-medium">
                      {pickBilingual(client.full_name, client.full_name_bn, locale)}
                    </span>
                    <span className="font-latin text-xs text-fg-subtle">{client.mobile}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title={t('cases.detail.parties')} />
          {caseDetail.parties.length === 0 ? (
            <EmptyState body={t('cases.detail.noParties')} />
          ) : (
            <ul className="divide-y divide-border">
              {caseDetail.parties.map((party) => (
                <li key={party.id} className="py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      {pickBilingual(party.name, party.name_bn, locale)}
                    </span>
                    <Badge tone={party.is_our_client ? 'success' : 'neutral'}>
                      {label(PARTY_TYPE_LABELS, party.party_type, language)}
                    </Badge>
                  </div>
                  {party.advocate_name ? (
                    <p className="mt-0.5 text-xs text-fg-subtle">{party.advocate_name}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Field({ label: fieldLabel, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs text-fg-subtle">{fieldLabel}</dt>
      <dd className="text-end text-fg">{children}</dd>
    </div>
  );
}
