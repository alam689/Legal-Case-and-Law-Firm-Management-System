import type { EstateAssets } from '@caseflow/domain';

/** জমি ১০০ শতাংশ দিয়ে শুরু — অংশগুলো তখন সরাসরি শতাংশ হিসেবেই পড়া যায়। */
export const DEFAULT_ASSETS: EstateAssets = { land: 100, gold: 0, silver: 0, currency: 0 };
