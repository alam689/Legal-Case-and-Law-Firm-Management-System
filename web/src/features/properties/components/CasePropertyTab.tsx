import { LAND_CLASS_LABELS, label } from '@caseflow/domain';
import { MapPinned } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { formatArea } from '@/shared/i18n/formatters';
import { useLocale } from '@/shared/i18n/use-locale';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { SkeletonList } from '@/shared/ui/Skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/states';

import { usePropertiesForCase } from '../api/use-properties';

/**
 * মামলার বিস্তারিত পাতার "সম্পত্তি" tab (F-PROP-07)।
 *
 * সংযোগ তৈরি/বাতিল সম্পত্তির পাতা থেকেই হয়, এখান থেকে নয় — একই কাজের
 * দুটি জায়গা থাকলে কোনটিই ভরসাযোগ্য মনে হয় না। এখানে শুধু দেখা ও যাওয়া।
 */
export function CasePropertyTab({ caseId }: { caseId: string }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data, isPending, isError, error, refetch } = usePropertiesForCase(caseId);

  const properties = data?.results ?? [];
  const lang = locale === 'en' ? 'EN' : 'BN';

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <SkeletonList rows={2} />;
  if (properties.length === 0) {
    return <EmptyState title={t('properties.title')} body={t('properties.cases.empty')} />;
  }

  return (
    <ul className="space-y-3">
      {properties.map((property) => (
        <li key={property.id}>
          <Card className="space-y-2">
            <Link
              to={`/properties/${property.id}`}
              className="flex items-start gap-2 font-medium hover:text-primary hover:underline"
            >
              <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" aria-hidden />
              {property.title}
            </Link>

            <p className="text-sm text-fg-muted">
              {[property.mouza, property.upazila, property.district].filter(Boolean).join(' · ')}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-latin font-semibold tabular-nums">
                {t('properties.areaDecimal', {
                  value: formatArea(property.total_area_decimal, locale),
                })}
              </span>
              {property.land_class ? (
                <Badge tone="neutral">{label(LAND_CLASS_LABELS, property.land_class, lang)}</Badge>
              ) : null}
              {property.dag_numbers.map((dag) => (
                <Badge key={dag} tone="info" className="font-latin tabular-nums">
                  {t('properties.dagShort', { value: dag })}
                </Badge>
              ))}
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
