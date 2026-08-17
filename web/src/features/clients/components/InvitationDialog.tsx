import type { ClientDetail } from '@caseflow/api-types';
import { CLIENT_LINK_STATUS_LABELS, label } from '@caseflow/domain';
import { Check, Copy, Ticket } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/shared/i18n/use-locale';
import { DateText } from '@/shared/ui/DateText';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';

import { useCreateInvitation } from '../api/use-clients';

/**
 * F-CLI-04 — মক্কেলকে অ্যাপে যুক্ত করার কোড।
 *
 * কোডটিই মক্কেলের একমাত্র প্রবেশপথ, তাই এটি কখনো তালিকায় ছড়িয়ে দেখানো হয় না —
 * আইনজীবী ইচ্ছা করে খুললেই কেবল দেখা যায়।
 */
export function InvitationDialog({
  client,
  open,
  onOpenChange,
}: {
  client: ClientDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { language } = useLocale();
  const createInvitation = useCreateInvitation(client.id);
  const [copied, setCopied] = useState(false);

  const link = createInvitation.data ?? client.link;
  const alreadyLinked = client.is_linked && link?.status === 'ACTIVE';

  async function copyCode() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.invitation_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission নেই — কোড পর্দাতেই দৃশ্যমান, তাই চুপচাপ উপেক্ষা
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('clients.invitation.title')}
      description={t('clients.invitation.description')}
      footer={
        <Button
          variant={link ? 'secondary' : 'primary'}
          loading={createInvitation.isPending}
          onClick={() => createInvitation.mutate()}
        >
          <Ticket className="h-4 w-4" aria-hidden />
          {link ? t('clients.invitation.regenerate') : t('clients.invitation.generate')}
        </Button>
      }
    >
      {alreadyLinked ? (
        <p className="mb-4 rounded-md bg-success-bg px-3 py-2 text-sm text-success">
          {t('clients.invitation.alreadyLinked')}
        </p>
      ) : null}

      {link ? (
        <div className="space-y-3 rounded-lg border border-border bg-surface-muted p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <code className="font-latin text-2xl font-bold tracking-widest text-fg">
              {link.invitation_code}
            </code>
            <Button variant="secondary" onClick={() => void copyCode()}>
              {copied ? (
                <Check className="h-4 w-4 text-success" aria-hidden />
              ) : (
                <Copy className="h-4 w-4" aria-hidden />
              )}
              {copied ? t('clients.invitation.copied') : t('clients.invitation.copy')}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-fg-muted">
            <Badge tone={link.status === 'ACTIVE' ? 'success' : 'info'}>
              {label(CLIENT_LINK_STATUS_LABELS, link.status, language)}
            </Badge>
            {link.expires_at ? (
              <span>
                {t('clients.invitation.expires')}: <DateText value={link.expires_at} />
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
