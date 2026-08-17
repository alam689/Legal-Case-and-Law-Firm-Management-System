#!/usr/bin/env node
/**
 * Bundle budget gate — docs/05-frontend-plan.md §12।
 *
 * FR7: budget CI-তে day one থেকে বসাতে হবে। পরে যোগ করলে কেউ মানে না,
 * এবং জেলা শহরে 3G-তে app অব্যবহার্য হওয়ার পরে ধরা পড়ে।
 */
import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(import.meta.dirname, '..', 'dist', 'assets');

const BUDGETS = {
  /** প্রথম load-এ যা আসে: entry + eager vendor chunk (gzip) */
  initialJsKb: 180,
  /** যেকোনো একটি lazy route chunk (gzip) */
  routeChunkKb: 80,
  /** সব CSS মিলিয়ে (gzip) */
  cssKb: 40,
};

function kb(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

function listFiles(dir) {
  try {
    return readdirSync(dir).filter((name) => statSync(path.join(dir, name)).isFile());
  } catch {
    console.error(`✗ dist/assets পাওয়া যায়নি — আগে \`pnpm build\` চালান।`);
    process.exit(1);
  }
}

const files = listFiles(DIST).filter((name) => /\.(js|css)$/.test(name));
const measured = files.map((name) => {
  const bytes = gzipSync(readFileSync(path.join(DIST, name))).length;
  return { name, kb: kb(bytes) };
});

const js = measured.filter((f) => f.name.endsWith('.js'));
const css = measured.filter((f) => f.name.endsWith('.css'));

// Entry + vendor chunk = initial load; বাকি সব lazy route chunk
const initial = js.filter((f) => /^(index|vendor-)/.test(f.name));
const routeChunks = js.filter((f) => !/^(index|vendor-)/.test(f.name));

const initialKb = Math.round(initial.reduce((sum, f) => sum + f.kb, 0) * 10) / 10;
const cssKbTotal = Math.round(css.reduce((sum, f) => sum + f.kb, 0) * 10) / 10;
const worstRoute = routeChunks.sort((a, b) => b.kb - a.kb)[0];

const failures = [];
if (initialKb > BUDGETS.initialJsKb) {
  failures.push(`initial JS ${initialKb} KB > ${BUDGETS.initialJsKb} KB`);
}
if (worstRoute && worstRoute.kb > BUDGETS.routeChunkKb) {
  failures.push(`route chunk ${worstRoute.name} ${worstRoute.kb} KB > ${BUDGETS.routeChunkKb} KB`);
}
if (cssKbTotal > BUDGETS.cssKb) {
  failures.push(`CSS ${cssKbTotal} KB > ${BUDGETS.cssKb} KB`);
}

console.log('Bundle budget (gzip)');
console.log(`  initial JS   ${initialKb} / ${BUDGETS.initialJsKb} KB`);
console.log(
  `  worst route  ${worstRoute ? `${worstRoute.kb} KB (${worstRoute.name})` : 'n/a'} / ${BUDGETS.routeChunkKb} KB`,
);
console.log(`  CSS          ${cssKbTotal} / ${BUDGETS.cssKb} KB`);

if (failures.length > 0) {
  console.error('\n✗ Bundle budget ছাড়িয়ে গেছে:');
  for (const failure of failures) console.error(`  · ${failure}`);
  console.error('\nlazy import করুন, অথবা budget পরিবর্তনের কারণ PR-এ ব্যাখ্যা করুন।');
  process.exit(1);
}

console.log('\n✓ budget-এর মধ্যে আছে');
