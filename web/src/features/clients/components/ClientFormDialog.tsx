import type { ClientDetail, ClientWriteRequest } from '@caseflow/api-types';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Dialog } from '@/shared/ui/Dialog';

import { useCreateClient, useUpdateClient } from '../api/use-clients';
import { ClientForm } from './ClientForm';

/** নতুন মক্কেল — সফল হলে সরাসরি তাঁর পাতায় নিয়ে যাওয়া হয়। */
export function ClientFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createClient = useCreateClient();

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t('clients.add')}>
      <ClientForm
        submitLabel={t('clients.form.create')}
        pending={createClient.isPending}
        error={createClient.error}
        onCancel={() => onOpenChange(false)}
        onSubmit={(values) =>
          createClient.mutate(values as ClientWriteRequest, {
            onSuccess: (client) => {
              onOpenChange(false);
              navigate(`/clients/${client.id}`);
            },
          })
        }
      />
    </Dialog>
  );
}

/** বিদ্যমান মক্কেলের তথ্য সম্পাদনা। */
export function ClientEditDialog({
  client,
  open,
  onOpenChange,
}: {
  client: ClientDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const updateClient = useUpdateClient(client.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t('clients.edit')}>
      <ClientForm
        submitLabel={t('clients.form.update')}
        pending={updateClient.isPending}
        error={updateClient.error}
        onCancel={() => onOpenChange(false)}
        defaultValues={{
          full_name: client.full_name,
          full_name_bn: client.full_name_bn ?? '',
          mobile: client.mobile,
          alt_mobile: client.alt_mobile ?? '',
          email: client.email ?? '',
          address: client.address ?? '',
          district: client.district ?? '',
          notes: client.notes ?? '',
        }}
        onSubmit={(values) =>
          updateClient.mutate(values as ClientWriteRequest, {
            onSuccess: () => onOpenChange(false),
          })
        }
      />
    </Dialog>
  );
}
