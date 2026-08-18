// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('node:path');

const { getDefaultConfig } = require('expo/metro-config');

/**
 * Monorepo-এর জন্য Metro।
 *
 * `packages/*` symlink হয়ে আসে (pnpm), আর Metro default-এ শুধু নিজের
 * folder দেখে। দুটো জিনিস না বললে `@caseflow/domain` import করলেই
 * "Unable to resolve module" — আর ভুলটা bundle করার সময় ধরা পড়ে,
 * typecheck-এ নয়:
 *
 * ১. `watchFolders` — repo root, যাতে shared package-এর বদল HMR-এ আসে
 * ২. `nodeModulesPaths` — mobile ও root দুটোই, কারণ pnpm hoist করে না
 */
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// pnpm-এর symlink গুলো Metro-কে অনুসরণ করতে দেওয়া হয়
config.resolver.unstable_enableSymlinks = true;

/**
 * `disableHierarchicalLookup` ইচ্ছাকৃতভাবে **বন্ধ করা হয়নি**।
 *
 * Monorepo-র বহু উদাহরণে সেটি `true` করা হয় (npm/yarn-এ hoisting-এর ভুল
 * package ধরা এড়াতে)। pnpm-এ সেটিই বিপর্যয়: প্রতিটি package-এর নিজস্ব
 * নির্ভরতা থাকে `.pnpm/<নাম>@<সংস্করণ>/node_modules/`-এ, আর Metro
 * সেগুলো খুঁজে পায় শুধু ফাইলের নিজের folder থেকে উপরে হেঁটে। বন্ধ করলে
 * `@expo/metro-runtime`-এর `whatwg-fetch`-এর মতো private dependency
 * গুলো একে একে "Unable to resolve" হয়।
 */

/**
 * `packages/*`-এর NodeNext import (`'./enums.js'` → `enums.ts`)।
 *
 * TypeScript-এর `moduleResolution: NodeNext`-এ extension লেখা বাধ্যতামূলক
 * এবং সেটি `.js`-ই হয়, উৎস `.ts` হলেও। Vite নিজে এটি সামলায়, Metro নয় —
 * তাই shared package import করলেই "Unable to resolve ./enums.js"।
 *
 * ক্রমটি জরুরি: **আগে মূল নাম, ব্যর্থ হলে তবেই `.js` ছাঁটা**। উল্টো করলে
 * node_modules-এর সত্যিকারের `./foo.js` ছিনতাই হয়ে যায় — যেখানে পাশে
 * `foo/` folder-ও আছে, সেখানে `./foo` গিয়ে `foo/index.js`-এ পৌঁছায়,
 * ভুল module ফেরে, আর ভুলটা ধরা পড়ে অনেক পরে ("Cannot read properties
 * of undefined")। এই ভুলেই web bundle চললেও runtime-এ ভেঙে পড়ত।
 */
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest ?? context.resolveRequest;

  try {
    // আগে যা লেখা আছে হুবহু তা-ই — নিচের fallback শুধু ব্যর্থ হলে
    return resolve(context, moduleName, platform);
  } catch (error) {
    if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
      return resolve(context, moduleName.slice(0, -3), platform);
    }
    throw error;
  }
};

module.exports = config;
