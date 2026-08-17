/// <reference types="vite/client" />

/** `.env.example`-এর সাথে মিলিয়ে রাখতে হবে — নতুন var যোগ করলে দুই জায়গাতেই। */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_PROXY_TARGET?: string;
  readonly VITE_API_MOCKING?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_APP_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
