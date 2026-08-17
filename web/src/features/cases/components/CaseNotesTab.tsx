import type { CaseDetail } from '@caseflow/api-types';
import { Check, Lock } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/shared/auth/Can';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Textarea';

import { useUpdateCase } from '../api/use-cases';

/**
 * F-CASE-07 — অভ্যন্তরীণ নোট।
 *
 * rule A4: এটি কখনো client-visible নয়। সতর্কবার্তা স্থায়ীভাবে উপরে থাকে —
 * ভুলে মক্কেলকে দেখানোর মতো কিছু এখানে লেখা হবে না, এই ধারণাটাই ভুল রাখা
 * বিপজ্জনক।
 */
export function CaseNotesTab({ caseDetail }: { caseDetail: CaseDetail }) {
  const { t } = useTranslation();
  const updateCase = useUpdateCase(caseDetail.id);
  const [notes, setNotes] = useState(caseDetail.internal_notes ?? '');

  const dirty = notes !== (caseDetail.internal_notes ?? '');

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
        <Lock className="h-4 w-4 shrink-0" aria-hidden />
        {t('cases.notes.banner')}
      </p>

      <Can
        do="case.internal_notes"
        fallback={
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
            {caseDetail.internal_notes || t('cases.detail.notProvided')}
          </p>
        }
      >
        <Textarea
          label={t('cases.form.internalNotes')}
          rows={10}
          value={notes}
          placeholder={t('cases.notes.placeholder')}
          onChange={(event) => setNotes(event.target.value)}
        />

        <div className="flex items-center justify-end gap-3">
          {updateCase.isSuccess && !dirty ? (
            <span className="flex items-center gap-1.5 text-sm text-success">
              <Check className="h-4 w-4" aria-hidden />
              {t('cases.notes.saved')}
            </span>
          ) : null}

          <Button
            disabled={!dirty}
            loading={updateCase.isPending}
            onClick={() => updateCase.mutate({ internal_notes: notes })}
          >
            {t('cases.notes.save')}
          </Button>
        </div>
      </Can>
    </div>
  );
}
