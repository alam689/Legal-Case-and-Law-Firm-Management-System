import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { isApiError } from '@/shared/api/errors';
import { useCaseOptions } from '@/shared/api/reference';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import { Select } from '@/shared/ui/Select';

import { useLinkPropertyCase } from '../api/use-properties';

/**
 * F-PROP-07 — মামলা↔সম্পত্তি সংযোগ।
 *
 * ইতিমধ্যে যুক্ত মামলাগুলো তালিকা থেকে বাদ — "যুক্ত করুন" চেপে
 * "আগে থেকেই যুক্ত" শোনার চেয়ে বিকল্পটি না দেখানোই ভালো।
 */
export function LinkCaseDialog({
  propertyId,
  linkedCaseIds,
  open,
  onOpenChange,
}: {
  propertyId: string;
  linkedCaseIds: readonly string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState('');
  const caseList = useCaseOptions();
  const linkCase = useLinkPropertyCase(propertyId);

  const options = useMemo(
    () =>
      (caseList.data?.results ?? [])
        .filter((item) => !linkedCaseIds.includes(item.id))
        .map((item) => ({ value: item.id, label: `${item.display_number} — ${item.title}` })),
    [caseList.data, linkedCaseIds],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('properties.cases.linkTitle')}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={!selected}
            loading={linkCase.isPending}
            onClick={() =>
              linkCase.mutate(selected, {
                onSuccess: () => {
                  setSelected('');
                  onOpenChange(false);
                },
              })
            }
          >
            {t('properties.cases.linkAction')}
          </Button>
        </>
      }
    >
      <Select
        label={t('properties.cases.selectCase')}
        options={options}
        placeholder={t('properties.cases.selectCase')}
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
      />

      {linkCase.error ? (
        <p role="alert" className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {t(isApiError(linkCase.error) ? linkCase.error.i18nKey : 'errors.unknown')}
        </p>
      ) : null}
    </Dialog>
  );
}
