import type { FirmSettings, FirmSettingsWriteRequest } from '@caseflow/api-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { http } from '@/shared/api/http';
import { qk } from '@/shared/api/query-keys';

export { useFirmSettings } from '@/shared/api/reference';

/**
 * চেম্বারের সেটিংস সম্পাদনা।
 *
 * সফল হলে cache-এ server-এর উত্তরই বসে — চালানের letterhead এখান থেকেই
 * আঁকা হয়, তাই local অনুমান রাখলে সেটিংস আর ছাপা কপি আলাদা হয়ে যেত।
 */
export function useUpdateFirmSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: FirmSettingsWriteRequest) =>
      http.patch<FirmSettings>('/firm/settings', body),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.firm.settings(), updated);
      // চালানের নমুনা ও রসিদ একই তথ্য দেখায়
      void queryClient.invalidateQueries({ queryKey: qk.billing.all() });
    },
  });
}
