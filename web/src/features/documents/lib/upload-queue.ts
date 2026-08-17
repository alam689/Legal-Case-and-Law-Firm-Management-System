import {
  ACCEPTED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  isAcceptedUploadType,
} from '@caseflow/domain';
import { useCallback, useRef, useState } from 'react';

/**
 * আপলোড সারি — একাধিক ফাইল, প্রতিটির নিজস্ব অবস্থা ও আলাদা retry।
 *
 * কেন সারি, একটিমাত্র request নয়: আদালত থেকে ফেরার পথে ৩G-তে ৫টি স্ক্যান
 * করা কাগজ পাঠানোর সময় একটি ব্যর্থ হলে পুরো ব্যাচ আবার পাঠানো নিষ্ঠুর।
 * এখানে শুধু ব্যর্থ ফাইলটিই আবার যায়, বাকিগুলো সংরক্ষিতই থাকে।
 *
 * ⚠ শতাংশ নয়, ধাপ — MSW mock ও `fetch` কোনোটিই বিশ্বাসযোগ্য byte-progress
 * দেয় না, আর বানানো শতাংশ দেখানো মিথ্যা অগ্রগতি (FE9-এর বিপরীত)। তাই
 * প্রতি ফাইলে ধাপ, আর পুরো ব্যাচে সত্যিকারের "কত-র মধ্যে কত"। Backend
 * multipart upload চালু করলে এখানেই byte-progress যোগ হবে।
 */

export type UploadPhase = 'QUEUED' | 'UPLOADING' | 'DONE' | 'FAILED';

export interface QueuedUpload {
  /** Client-side সারির id — server-এর document id নয়। */
  id: string;
  file: File;
  phase: UploadPhase;
  error?: unknown;
  documentId?: string;
}

export type FileRejectionReason = 'TOO_LARGE' | 'UNSUPPORTED_TYPE';

export interface FileRejection {
  file: File;
  reason: FileRejectionReason;
}

export const ACCEPT_ATTRIBUTE = ACCEPTED_UPLOAD_MIME_TYPES.join(',');

/** UI-র আগাম যাচাই — server-ই চূড়ান্ত, এটি শুধু ব্যবহারকারীর সময় বাঁচায় (FE3)। */
export function screenFiles(files: readonly File[]): {
  accepted: File[];
  rejected: FileRejection[];
} {
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];

  for (const file of files) {
    if (file.size > MAX_UPLOAD_BYTES) {
      rejected.push({ file, reason: 'TOO_LARGE' });
    } else if (!isAcceptedUploadType(file.type)) {
      rejected.push({ file, reason: 'UNSUPPORTED_TYPE' });
    } else {
      accepted.push(file);
    }
  }

  return { accepted, rejected };
}

export interface UploadQueue {
  items: QueuedUpload[];
  rejections: FileRejection[];
  /** এখনো পাঠানো বাকি বা ব্যর্থ — "সংরক্ষণ" বোতাম সক্রিয় রাখার শর্ত */
  pendingCount: number;
  doneCount: number;
  isRunning: boolean;
  add: (files: readonly File[]) => void;
  remove: (id: string) => void;
  reset: () => void;
  /** সব QUEUED/FAILED ফাইল ধারাবাহিকভাবে পাঠায়; ব্যর্থ হলে সারিতেই থাকে। */
  run: (upload: (file: File) => Promise<{ id: string }>) => Promise<void>;
  retry: (id: string, upload: (file: File) => Promise<{ id: string }>) => Promise<void>;
}

export function useUploadQueue(): UploadQueue {
  const [items, setItems] = useState<QueuedUpload[]>([]);
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const sequence = useRef(0);

  const add = useCallback((files: readonly File[]) => {
    const { accepted, rejected } = screenFiles(files);
    setRejections(rejected);
    if (accepted.length === 0) return;

    setItems((current) => [
      ...current,
      ...accepted.map((file) => {
        sequence.current += 1;
        return { id: `upload-${sequence.current}`, file, phase: 'QUEUED' as const };
      }),
    ]);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setRejections([]);
    sequence.current = 0;
  }, []);

  const patch = useCallback((id: string, next: Partial<QueuedUpload>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...next } : item)));
  }, []);

  const send = useCallback(
    async (item: QueuedUpload, upload: (file: File) => Promise<{ id: string }>) => {
      patch(item.id, { phase: 'UPLOADING', error: undefined });
      try {
        const created = await upload(item.file);
        patch(item.id, { phase: 'DONE', documentId: created.id });
      } catch (error) {
        // ব্যর্থ ফাইল সারিতেই থাকে — ব্যবহারকারী আবার বেছে নেবেন না
        patch(item.id, { phase: 'FAILED', error });
      }
    },
    [patch],
  );

  const run = useCallback(
    async (upload: (file: File) => Promise<{ id: string }>) => {
      setIsRunning(true);
      try {
        // `items` snapshot-এর উপরে ধারাবাহিক — সমান্তরাল পাঠালে দুর্বল
        // সংযোগে সবগুলোই একসাথে ব্যর্থ হয়।
        for (const item of items) {
          if (item.phase === 'DONE' || item.phase === 'UPLOADING') continue;
          await send(item, upload);
        }
      } finally {
        setIsRunning(false);
      }
    },
    [items, send],
  );

  const retry = useCallback(
    async (id: string, upload: (file: File) => Promise<{ id: string }>) => {
      const item = items.find((entry) => entry.id === id);
      if (!item) return;
      setIsRunning(true);
      try {
        await send(item, upload);
      } finally {
        setIsRunning(false);
      }
    },
    [items, send],
  );

  return {
    items,
    rejections,
    pendingCount: items.filter((item) => item.phase !== 'DONE').length,
    doneCount: items.filter((item) => item.phase === 'DONE').length,
    isRunning,
    add,
    remove,
    reset,
    run,
    retry,
  };
}
