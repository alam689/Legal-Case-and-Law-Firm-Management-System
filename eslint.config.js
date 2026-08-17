import js from '@eslint/js';
import a11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Repo-wide flat config — web + packages।
 * docs/05-frontend-plan.md §4 (dependency rule), §13 (a11y), §15 (security)।
 */
export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', '**/*.d.ts', 'web/public/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'no-restricted-globals': [
        'error',
        // সব তারিখ/সময় Asia/Dhaka wrapper দিয়ে (docs/05 §6.5)
        { name: 'event', message: 'Use the event parameter instead.' },
      ],
    },
  },

  /* ── React (web only) ────────────────────────────────────────────── */
  {
    files: ['web/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': a11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...a11y.flatConfigs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      /* FE-security — docs/05 §15 */
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message:
            'dangerouslySetInnerHTML নিষিদ্ধ — server-এর কোনো text HTML হিসেবে render হবে না (docs/05 §15)।',
        },
        {
          // FE7 — কোনো hardcoded user-facing string নয়, সব t() দিয়ে
          selector: 'JSXText[value=/[\\u0980-\\u09FFA-Za-z]{3,}/]',
          message:
            'Hardcoded string নয় — `t()` ব্যবহার করুন (docs/05 §6.5)। ব্যতিক্রম হলে eslint-disable সহ কারণ লিখুন।',
        },
        {
          selector: 'MemberExpression[object.name="localStorage"][property.name=/^(setItem)$/] > Literal[value=/token/i]',
          message: 'Token কখনো localStorage-এ নয় (ADR FE-0013)।',
        },
      ],
    },
  },

  /* ── Dependency boundary (docs/05 §4) ────────────────────────────── */
  {
    files: ['web/src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/features/**'],
              message:
                'এক feature অন্য feature থেকে import করবে না — প্রয়োজন হলে সেই অংশ shared/-এ তুলুন (docs/05 §4)।',
            },
            {
              group: ['@/app/*', '@/app/**'],
              message: 'features → app dependency উল্টো দিকে — app-ই feature ব্যবহার করে।',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['web/src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/features/**', '@/app/*', '@/app/**'],
              message: 'shared/ কখনো feature বা app-এর উপর নির্ভর করবে না (docs/05 §4)।',
            },
          ],
        },
      ],
    },
  },

  /* ── packages/* — কোনো React/DOM নয় (docs/05 §16) ────────────────── */
  {
    files: ['packages/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'packages/* platform-agnostic — web ও mobile দুটোতেই চলে।' },
            { name: 'react-dom', message: 'packages/* platform-agnostic।' },
            { name: 'react-native', message: 'packages/* platform-agnostic।' },
          ],
        },
      ],
    },
  },

  /* ── Test files ──────────────────────────────────────────────────── */
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**', 'web/src/test/**'],
    rules: {
      'no-restricted-imports': 'off',
      // Test fixture-এ literal string থাকা স্বাভাবিক — assertion-ই তো literal
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  /* ── Config ও build script ───────────────────────────────────────── */
  {
    files: ['**/*.config.{js,ts}', '**/scripts/**', '**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-console': 'off',
      'no-restricted-syntax': 'off',
    },
  },
);
